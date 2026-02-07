package crm.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import crm.service.WhatsAppConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/whatsapp", "/api/whatsapp"})
public class WhatsAppConfigController {

    @Autowired
    private WhatsAppConfigService service;

    private static final Logger log = LoggerFactory.getLogger(WhatsAppConfigController.class);

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        try {
            Map<String, Object> safe = service.getSafeConfigView();
            Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("connected", safe.getOrDefault("connected", Boolean.FALSE));
            resp.put("baseUrl", safe.getOrDefault("baseUrl", ""));
            resp.put("instanceId", safe.getOrDefault("instanceId", ""));
            resp.put("token", safe.getOrDefault("token", ""));
            resp.put("webhookUrl", safe.getOrDefault("webhookUrl", ""));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody Map<String, String> body) {
        try {
            Boolean connected = Boolean.valueOf(body.getOrDefault("connected", "false"));
            String baseUrl = body.getOrDefault("baseUrl", "");
            String instanceId = body.getOrDefault("instanceId", "");
            String token = body.getOrDefault("token", "");
            String apiKey = body.getOrDefault("apiKey", "");
            String webhookUrl = body.getOrDefault("webhookUrl", "");
            if (webhookUrl == null || webhookUrl.isBlank()) {
                webhookUrl = "https://api.uniconnectcrm.com.br/api/whatsapp/webhook";
            }

            if (baseUrl.isBlank() || instanceId.isBlank() || token.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields: baseUrl, instanceId, token"));
            }

            crm.entity.WhatsAppConfig config = new crm.entity.WhatsAppConfig();
            config.setProvider("z-api");
            config.setBaseUrl(baseUrl);
            config.setWebhookUrl(webhookUrl);
            config.setInstanceId(instanceId);
            config.setInstanceTokenEncrypted(token);
            if (apiKey != null && !apiKey.isBlank()) {
                config.setApiKeyEncrypted(apiKey);
            }
            config.setConnected(connected);

            service.saveConfig(config);

            try {
                String resolvedApiKey = service.getApiKey();
                HttpHeaders headers = new HttpHeaders();
                if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Client-Token ausente"));
                }
                headers.add("Client-Token", resolvedApiKey);
                headers.setBearerAuth(token);
                headers.setContentType(MediaType.APPLICATION_JSON);
                Map<String, Object> wb = new java.util.HashMap<>();
                wb.put("webhookUrl", webhookUrl);
                HttpEntity<Map<String, Object>> req = new HttpEntity<>(wb, headers);
                RestTemplate rt = service.getRestTemplate();
                String root = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length()-1) : baseUrl;
                String url = root + "/instances/" + instanceId + "/token/" + token + "/webhook";
                rt.exchange(url, HttpMethod.POST, req, String.class);
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                "connected", connected,
                "baseUrl", baseUrl,
                "instanceId", instanceId,
                "token", token,
                "webhookUrl", webhookUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        try {
            Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
            if (opt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "smartphoneConnected", false,
                    "sessionActive", false,
                    "requiresInstance", true
                ));
            }
            var config = opt.get();
            String instanceId = config.getInstanceId();
            String token = service.getInstanceToken();
            if (instanceId == null || instanceId.isBlank() || token == null || token.isBlank()) {
                return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "smartphoneConnected", false,
                    "sessionActive", false,
                    "requiresInstance", true,
                    "instanceId", instanceId != null ? instanceId : ""
                ));
            }

            String base = config.getBaseUrl();
            if (base == null || base.isBlank()) base = "https://api.z-api.io";
            // Normalize root (ensure we don't duplicate /instances)
            String root = base.contains("/instances") ? base.substring(0, base.indexOf("/instances")) : base;
            if (root.endsWith("/")) root = root.substring(0, root.length() - 1);
            String url = root + "/instances/" + instanceId + "/token/" + token + "/status";

            String apiKey = service.getApiKey();
            if (apiKey == null || apiKey.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client-Token ausente"));
            }
            HttpHeaders headers = new HttpHeaders();
            headers.add("Client-Token", apiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            RestTemplate rt = service.getRestTemplate();

            try {
                ResponseEntity<Map<String, Object>> resp = rt.exchange(url, HttpMethod.GET, entity, new ParameterizedTypeReference<Map<String, Object>>() {});
                Map<String, Object> body = resp.getBody() != null ? resp.getBody() : java.util.Collections.emptyMap();
                boolean smartphoneConnected = Boolean.parseBoolean(String.valueOf(body.getOrDefault("smartphoneConnected", body.getOrDefault("connected", false))));
                Object stObj = body.get("status");
                String st = stObj != null ? String.valueOf(stObj) : null;
                boolean sessionActive = smartphoneConnected || (st != null && (st.equalsIgnoreCase("CONNECTED") || st.equalsIgnoreCase("open") || st.equalsIgnoreCase("online")));
                return ResponseEntity.ok(Map.of(
                    "connected", smartphoneConnected,
                    "smartphoneConnected", smartphoneConnected,
                    "sessionActive", sessionActive,
                    "instanceId", instanceId,
                    "raw", body
                ));
            } catch (Exception e) {
                return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "smartphoneConnected", false,
                    "sessionActive", false,
                    "error", e.getMessage(),
                    "instanceId", instanceId
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "connected", false,
                "status", "error",
                "error", e.getMessage()
            ));
        }
    }

    // ---------- QR endpoints (robust proxy + fallback) ----------

    /**
     * Endpoint recomendado: retorna image/png diretamente (proxy).
     * Front-end: <img src="/api/whatsapp/qr/image?ts=..." />
     */
    @GetMapping(value = "/qr/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrImage() {
        try {
            Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
            if (opt.isEmpty()) return ResponseEntity.status(404).body(null);

            var config = opt.get();
            String instanceId = config.getInstanceId();
            String token = service.getInstanceToken();
            if (instanceId == null || token == null || instanceId.isBlank() || token.isBlank()) {
                return ResponseEntity.badRequest().body(null);
            }

            String base = config.getBaseUrl();
            if (base == null || base.isBlank()) base = "https://api.z-api.io";
            String root = base.contains("/instances") ? base.substring(0, base.indexOf("/instances")) : base;
            if (root.endsWith("/")) root = root.substring(0, root.length() - 1);
            String basePath = root + "/instances/" + instanceId + "/token/" + token;

            RestTemplate rt = service.getRestTemplate();
            HttpHeaders headers = new HttpHeaders();
            String apiKey = service.getApiKey();
            if (apiKey != null && !apiKey.isBlank()) headers.add("Client-Token", apiKey);
            headers.setBearerAuth(token);

            // centraliza tentativas / normalização
            byte[] imageBytes = fetchQrBytes(rt, basePath, headers);
            if (imageBytes == null || imageBytes.length == 0) {
                log.warn("[QR] no image bytes from provider");
                return ResponseEntity.status(502).body(null);
            }

            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore().mustRevalidate())
                    .contentType(MediaType.IMAGE_PNG)
                    .contentLength(imageBytes.length)
                    .body(imageBytes);

        } catch (Exception e) {
            log.error("[QR] getQrImage error", e);
            return ResponseEntity.status(502).body(null);
        }
    }

    /**
     * Fallback/compat endpoint that returns JSON with a data URL:
     * POST /whatsapp/qr -> { "value": "data:image/png;base64,..." }
     */
    @PostMapping("/qr")
    public ResponseEntity<Map<String, Object>> getQrCodeJson() {
        try {
            Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
            if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "not configured"));

            var config = opt.get();
            String instanceId = config.getInstanceId();
            String token = service.getInstanceToken();
            if (instanceId == null || token == null || instanceId.isBlank() || token.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Instance or token missing"));
            }

            String base = config.getBaseUrl();
            if (base == null || base.isBlank()) base = "https://api.z-api.io";
            String root = base.contains("/instances") ? base.substring(0, base.indexOf("/instances")) : base;
            if (root.endsWith("/")) root = root.substring(0, root.length() - 1);
            String basePath = root + "/instances/" + instanceId + "/token/" + token;

            RestTemplate rt = service.getRestTemplate();
            HttpHeaders headers = new HttpHeaders();
            String apiKey = service.getApiKey();
            if (apiKey != null && !apiKey.isBlank()) headers.add("Client-Token", apiKey);
            headers.setBearerAuth(token);

            byte[] imageBytes = fetchQrBytes(rt, basePath, headers);
            if (imageBytes == null || imageBytes.length == 0) {
                return ResponseEntity.status(502).body(Map.of("error", "empty image from provider"));
            }

            String b64 = Base64.getEncoder().encodeToString(imageBytes);
            String safeB64 = b64.replaceAll("\\s+", "");
            String dataUrl = "data:image/png;base64," + safeB64;
            return ResponseEntity.ok(Map.of("value", dataUrl));
        } catch (Exception e) {
            log.error("[QR] getQrCodeJson error", e);
            return ResponseEntity.status(502).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/qr")
    public ResponseEntity<Map<String, Object>> getQrCodeJsonGet() {
        return getQrCodeJson();
    }

    // Test-friendly helper: returns a data URL string (PNG base64)
    public ResponseEntity<String> getQrBytes() {
        try {
            Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
            if (opt.isEmpty()) return ResponseEntity.status(404).body(null);

            var config = opt.get();
            String instanceId = config.getInstanceId();
            String token = service.getInstanceToken();
            if (instanceId == null || token == null || instanceId.isBlank() || token.isBlank()) {
                return ResponseEntity.badRequest().body(null);
            }

            String base = config.getBaseUrl();
            if (base == null || base.isBlank()) base = "https://api.z-api.io";
            String root = base.contains("/instances") ? base.substring(0, base.indexOf("/instances")) : base;
            if (root.endsWith("/")) root = root.substring(0, root.length() - 1);
            String basePath = root + "/instances/" + instanceId + "/token/" + token;

            RestTemplate rt = service.getRestTemplate();
            HttpHeaders headers = new HttpHeaders();
            String apiKey = service.getApiKey();
            if (apiKey != null && !apiKey.isBlank()) headers.add("Client-Token", apiKey);
            headers.setBearerAuth(token);

            byte[] imageBytes = fetchQrBytes(rt, basePath, headers);
            if (imageBytes == null || imageBytes.length == 0) {
                return ResponseEntity.status(502).body(null);
            }

            String b64 = Base64.getEncoder().encodeToString(imageBytes);
            String safeB64 = b64.replaceAll("\\s+", "");
            String dataUrl = "data:image/png;base64," + safeB64;
            return ResponseEntity.ok(dataUrl);
        } catch (Exception e) {
            log.error("[QR] getQrBytes error", e);
            return ResponseEntity.status(502).body(null);
        }
    }

    /**
     * Centralized method that tries various Z-API endpoints and formats to extract image bytes.
     * Order:
     *  - GET /qr-code (may return bytes or JSON/text containing base64)
     *  - GET /qr-code/image (may return base64 or bytes)
     *  - fallback attempts without Client-Token if 403 occurs
     */
    private byte[] fetchQrBytes(RestTemplate rt, String basePath, HttpHeaders headers) {
        try {
            // 1) Try /qr-code/image
            try {
                ResponseEntity<byte[]> resp2 = rt.exchange(
                        basePath + "/qr-code/image",
                        HttpMethod.GET,
                        new org.springframework.http.HttpEntity<>(headers),
                        byte[].class
                );
                MediaType ct2 = resp2.getHeaders().getContentType();
                byte[] body2 = resp2.getBody();
                if (body2 != null && body2.length > 0) {
                    if (ct2 != null && (MediaType.APPLICATION_OCTET_STREAM.includes(ct2) || MediaType.IMAGE_PNG.includes(ct2))) {
                        log.info("[QR] /qr-code/image returned binary len={}", body2.length);
                        return body2;
                    }
                    String txt = new String(body2, StandardCharsets.UTF_8).trim();
                    String base64 = extractBase64FromPossibleJsonOrText(txt);
                    if (base64 != null) {
                        String normalized = normalizeBase64Strict(base64);
                        if (normalized != null) return Base64.getDecoder().decode(normalized);
                        else log.warn("[QR] normalization failed for /qr-code/image text");
                    } else {
                        // raw base64?
                        String normalized = normalizeBase64Strict(txt);
                        if (normalized != null) return Base64.getDecoder().decode(normalized);
                    }
                } else {
                    log.warn("[QR] /qr-code/image returned empty");
                }
            } catch (HttpStatusCodeException hse2) {
                log.warn("[QR] /qr-code/image failed status={}, body={}", hse2.getStatusCode().value(), hse2.getResponseBodyAsString());
            } catch (Exception ex2) {
                log.warn("[QR] /qr-code/image error", ex2);
            }

            // 2) Fallback: try /qr-code/image without Client-Token (if Z-API rejected it)
            try {
                HttpHeaders headersNoClient = new HttpHeaders();
                // preserve bearer if available
                String bearer = null;
                if (headers.getFirst(HttpHeaders.AUTHORIZATION) != null) {
                    bearer = headers.getFirst(HttpHeaders.AUTHORIZATION).replace("Bearer ", "");
                }
                if (bearer != null && !bearer.isBlank()) headersNoClient.setBearerAuth(bearer);
                ResponseEntity<byte[]> resp3 = rt.exchange(
                        basePath + "/qr-code/image",
                        HttpMethod.GET,
                        new org.springframework.http.HttpEntity<>(headersNoClient),
                        byte[].class
                );
                byte[] body3 = resp3.getBody();
                if (body3 != null && body3.length > 0) {
                    String txt = new String(body3, StandardCharsets.UTF_8).trim();
                    String base64 = extractBase64FromPossibleJsonOrText(txt);
                    if (base64 == null) {
                        String normalized = normalizeBase64Strict(txt);
                        if (normalized != null) return Base64.getDecoder().decode(normalized);
                    } else {
                        String normalized = normalizeBase64Strict(base64);
                        if (normalized != null) return Base64.getDecoder().decode(normalized);
                    }
                }
            } catch (Exception ignore) {
                log.debug("[QR] final fallback without client token failed", ignore);
            }

            // 3) Try /qr-code
            try {
                ResponseEntity<byte[]> resp = rt.exchange(
                        basePath + "/qr-code",
                        HttpMethod.GET,
                        new org.springframework.http.HttpEntity<>(headers),
                        byte[].class
                );
                MediaType ct = resp.getHeaders().getContentType();
                byte[] body = resp.getBody();
                if (body != null && body.length > 0) {
                    if (ct != null) {
                        if (MediaType.APPLICATION_OCTET_STREAM.includes(ct) || MediaType.IMAGE_PNG.includes(ct)) {
                            log.info("[QR] /qr-code returned binary (len={})", body.length);
                            return body;
                        } else if (MediaType.APPLICATION_JSON.includes(ct) || MediaType.TEXT_PLAIN.includes(ct) || (ct.getSubtype() != null && ct.getSubtype().contains("json"))) {
                            String txt = new String(body, StandardCharsets.UTF_8).trim();
                            String base64 = extractBase64FromPossibleJsonOrText(txt);
                            if (base64 != null) {
                                String normalized = normalizeBase64Strict(base64);
                                if (normalized != null) {
                                    return Base64.getDecoder().decode(normalized);
                                } else {
                                    log.warn("[QR] normalized base64 is null (from /qr-code JSON/text)");
                                }
                            } else {
                                log.warn("[QR] /qr-code JSON/text did not contain base64 field");
                            }
                        } else {
                            if (looksLikePng(body)) {
                                return body;
                            }
                        }
                    } else {
                        if (looksLikePng(body)) return body;
                        String txt = new String(body, StandardCharsets.UTF_8).trim();
                        String base64 = extractBase64FromPossibleJsonOrText(txt);
                        if (base64 != null) {
                            String normalized = normalizeBase64Strict(base64);
                            if (normalized != null) return Base64.getDecoder().decode(normalized);
                        }
                    }
                } else {
                    log.warn("[QR] /qr-code returned empty body");
                }
            } catch (HttpStatusCodeException hse) {
                log.warn("[QR] /qr-code request failed status={}, body={}", hse.getStatusCode().value(), hse.getResponseBodyAsString());
            } catch (Exception ex) {
                log.warn("[QR] /qr-code request error", ex);
            }

        } catch (Exception outer) {
            log.error("[QR] fetchQrBytes unexpected error", outer);
        }
        return null;
    }

    // Extract base64 string from JSON or plain text responses
    private String extractBase64FromPossibleJsonOrText(String txt) {
        if (txt == null) return null;
        String trimmed = txt.trim();
        try {
            if (trimmed.startsWith("{")) {
                ObjectMapper om = new ObjectMapper();
                JsonNode json = om.readTree(trimmed);
                String[] keys = new String[]{"image", "qrCode", "base64", "qr", "value", "data"};
                for (String k : keys) {
                    if (json.has(k) && !json.get(k).isNull()) {
                        String cand = json.get(k).asText();
                        if (cand != null && !cand.isBlank()) {
                            if (cand.startsWith("data:")) {
                                int idx = cand.indexOf(',');
                                if (idx >= 0) return cand.substring(idx + 1).trim();
                            }
                            return cand.trim();
                        }
                    }
                }
                return null;
            } else {
                if (trimmed.startsWith("data:")) {
                    int idx = trimmed.indexOf(',');
                    if (idx >= 0) return trimmed.substring(idx + 1).trim();
                }
                return trimmed;
            }
        } catch (Exception e) {
            log.debug("[QR] extractBase64FromPossibleJsonOrText parse error", e);
            return null;
        }
    }

    // Quick PNG signature check
    private boolean looksLikePng(byte[] bytes) {
        if (bytes == null || bytes.length < 8) return false;
        byte[] pngSig = new byte[]{(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        for (int i = 0; i < pngSig.length; i++) if (bytes[i] != pngSig[i]) return false;
        return true;
    }

    /**
     * Strong normalization:
     * - remove ^\d+@ prefix
     * - remove control chars
     * - split by [,|\s]+
     * - remove non-base64 chars from segments
     * - remove '=' padding from segments, join, reapply padding at end
     * - validate decode
     */
    private String normalizeBase64Strict(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        // remove numeric prefix like "2@"
        v = v.replaceFirst("^\\d+@", "");
        // remove control chars
        v = v.replaceAll("[\\x00-\\x1F\\x7F-\\x9F]", "");
        // split on separators
        String[] parts = v.split("[,|\\s]+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p == null || p.isEmpty()) continue;
            // keep only base64 chars A-Za-z0-9+/
            String cleaned = p.replaceAll("[^A-Za-z0-9+/]", "");
            // remove '=' internal padding from segments
            cleaned = cleaned.replace("=", "");
            sb.append(cleaned);
        }
        String joined = sb.toString();
        // reapply padding at the end
        int mod = joined.length() % 4;
        if (mod != 0) {
            int pads = 4 - mod;
            for (int i = 0; i < pads; i++) joined += "=";
        }
        // validate decode
        try {
            Base64.getDecoder().decode(joined);
            return joined;
        } catch (IllegalArgumentException ex) {
            log.warn("[QR] normalizeBase64Strict failed decode - joined.len={} (start sample={})",
                    joined.length(), joined.length() > 60 ? joined.substring(0, 60) + "..." : joined);
            return null;
        }
    }

    // ---------- other existing controller methods (disconnect/restart) ----------

    @PostMapping("/disconnect-instance")
    public ResponseEntity<?> disconnectInstance() {
        try {
            Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "WhatsApp configuration not found"));
            }
            var config = opt.get();
            String instanceId = config.getInstanceId();
            String instanceToken = service.getInstanceToken();
            String apiKey = service.getApiKey();

            if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("error", "Missing instance configuration"));
            }

            String baseUrl = config.getBaseUrl();
            if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
                baseUrl = "https://api.z-api.io/instances/" + instanceId;
            }

            if (apiKey == null || apiKey.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client-Token ausente"));
            }
            HttpHeaders headers = new HttpHeaders();
            headers.add("Client-Token", apiKey);
            headers.setBearerAuth(instanceToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>("{}", headers);
            RestTemplate restTemplate = service.getRestTemplate();

            String url = baseUrl + "/token/" + instanceToken + "/disconnect";
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.DELETE, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "response", response.getBody()
                ));
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(Map.of(
                    "error", "Failed to disconnect instance",
                    "status", response.getStatusCode()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error disconnecting instance: " + e.getMessage(),
                "success", false
            ));
        }
    }

    @PostMapping("/restart-instance")
    public ResponseEntity<?> restartInstance() {
        try {
            Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "WhatsApp configuration not found"));
            }
            var config = opt.get();
            String instanceId = config.getInstanceId();
            String instanceToken = service.getInstanceToken();
            String apiKey = service.getApiKey();

            if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("error", "Missing instance configuration"));
            }

            String baseUrl = config.getBaseUrl();
            if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
                baseUrl = "https://api.z-api.io/instances/" + instanceId;
            }

            if (apiKey == null || apiKey.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Client-Token ausente"));
            }
            HttpHeaders headers = new HttpHeaders();
            headers.add("Client-Token", apiKey);
            headers.setBearerAuth(instanceToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>("{}", headers);
            RestTemplate restTemplate = service.getRestTemplate();

            String url = baseUrl + "/token/" + instanceToken + "/restart";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.PUT, entity, new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "response", response.getBody()
                ));
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(Map.of(
                    "error", "Failed to restart instance",
                    "status", response.getStatusCode()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error restarting instance: " + e.getMessage(),
                "success", false
            ));
        }
    }
}
