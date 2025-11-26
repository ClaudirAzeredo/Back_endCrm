package crm.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import crm.service.WhatsAppConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/whatsapp")
public class WhatsAppConfigController {

    @Autowired
    private WhatsAppConfigService service;

    private static final String API_BASE = "https://api.z-api.io/instances";

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
            String webhookUrl = body.getOrDefault("webhookUrl", "");

            if (baseUrl.isBlank() || instanceId.isBlank() || token.isBlank() || webhookUrl.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields: baseUrl, instanceId, token, webhookUrl"));
            }

            crm.entity.WhatsAppConfig config = new crm.entity.WhatsAppConfig();
            config.setProvider("z-api");
            config.setBaseUrl(baseUrl);
            config.setWebhookUrl(webhookUrl);
            config.setInstanceId(instanceId);
            config.setInstanceTokenEncrypted(token);
            config.setConnected(connected);

            service.saveConfig(config);

            try {
                String apiKey = service.getApiKey();
                HttpHeaders headers = new HttpHeaders();
                if (apiKey != null && !apiKey.isBlank()) headers.add("Client-Token", apiKey);
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

            HttpHeaders headers = new HttpHeaders();
            String apiKey = service.getApiKey();
            if (apiKey != null && !apiKey.isBlank()) headers.add("Client-Token", apiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            RestTemplate rt = service.getRestTemplate();

            try {
                ResponseEntity<Map> resp = rt.exchange(url, HttpMethod.GET, entity, Map.class);
                Map body = resp.getBody() != null ? resp.getBody() : java.util.Collections.emptyMap();
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
    @GetMapping("/qr")
    public ResponseEntity<String> getQrCode() {
        Optional<crm.entity.WhatsAppConfig> opt = service.getCurrentCompanyConfig();
        if (opt.isEmpty()) return ResponseEntity.status(404).body("{}");

        var config = opt.get();

        String instanceId = config.getInstanceId();
        String token = service.getInstanceToken();
        if (instanceId == null || token == null || instanceId.isBlank() || token.isBlank()) {
            return ResponseEntity.badRequest().body("{\"error\":\"Instance or token missing\"}");
        }

        String base = config.getBaseUrl();
        if (base == null || base.isBlank()) base = "https://api.z-api.io";

        String root = base.contains("/instances")
                ? base.substring(0, base.indexOf("/instances"))
                : base;

        if (root.endsWith("/")) root = root.substring(0, root.length() - 1);

        String basePath = root + "/instances/" + instanceId + "/token/" + token;

        RestTemplate rt = service.getRestTemplate();

        // HEADER (pode precisar remover se der 403)
        HttpHeaders headers = new HttpHeaders();
        String apiKey = service.getApiKey();
        if (apiKey != null && !apiKey.isBlank()) headers.add("Client-Token", apiKey);

// 🔥 ADICIONADO PARA EVITAR 403/502
        headers.setBearerAuth(token);

        try {
            return requestQrImage(rt, basePath, headers);
        } catch (HttpStatusCodeException e) {

            // Se for 403 por causa do Client-Token → tenta sem
            if (e.getStatusCode().value() == 403 && e.getResponseBodyAsString().contains("Client-Token")) {

                HttpHeaders headers2 = new HttpHeaders(); // sem client-token
                try {
                    return requestQrImage(rt, basePath, headers2);
                } catch (Exception ignore) {
                    // cai no fallback abaixo
                }
            }

            // FALLBACK FINAL: pegar bytes do /qr-code
            try {
                ResponseEntity<byte[]> resp = rt.exchange(basePath + "/qr-code", HttpMethod.GET,
                        new HttpEntity<>(headers), byte[].class);

                byte[] bytes = resp.getBody();
                if (bytes == null) {
                    return ResponseEntity.status(502).body("{\"error\":\"Provider returned empty response\"}");
                }

                String b64 = Base64.getEncoder().encodeToString(bytes);
                return ResponseEntity.ok("data:image/png;base64," + b64);

            } catch (Exception ex2) {
                return ResponseEntity.status(502).body("{\"error\":\"" +
                        ex2.getMessage().replace("\"","\\\"") +
                        "\"}");
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/send-message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> body) {
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
            
            String phone = body.get("phone");
            String message = body.get("message");
            
            if (phone == null || phone.isBlank() || message == null || message.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing phone or message"));
            }
            
            String baseUrl = config.getBaseUrl();
            if (baseUrl == null || baseUrl.isBlank() 
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
                baseUrl = "https://api.z-api.io/instances/" + instanceId;
            }
            
            HttpHeaders headers = new HttpHeaders();
            if (apiKey != null && !apiKey.isBlank()) {
                headers.add("Client-Token", apiKey);
            }
            headers.setBearerAuth(instanceToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> messageBody = new HashMap<>();
            messageBody.put("phone", phone.replaceAll("[^0-9]", ""));
            messageBody.put("message", message);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(messageBody, headers);
            RestTemplate restTemplate = service.getRestTemplate();
            
            String url = baseUrl + "/token/" + instanceToken + "/send-text";
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "response", response.getBody()
                ));
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(Map.of(
                    "error", "Failed to send message",
                    "status", response.getStatusCode()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error sending message: " + e.getMessage(),
                "success", false
            ));
        }
    }

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
            
            HttpHeaders headers = new HttpHeaders();
            if (apiKey != null && !apiKey.isBlank()) {
                headers.add("Client-Token", apiKey);
            }
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
            
            HttpHeaders headers = new HttpHeaders();
            if (apiKey != null && !apiKey.isBlank()) {
                headers.add("Client-Token", apiKey);
            }
            headers.setBearerAuth(instanceToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>("{}", headers);
            RestTemplate restTemplate = service.getRestTemplate();
            
            String url = baseUrl + "/token/" + instanceToken + "/restart";
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.PUT, entity, Map.class);
            
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
    private ResponseEntity<String> requestQrImage(RestTemplate rt, String basePath, HttpHeaders headers) throws JsonProcessingException {
        ResponseEntity<String> resp = rt.exchange(
                basePath + "/qr-code/image",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
        );

        String body = resp.getBody();
        if (body == null || body.isBlank()) {
            return ResponseEntity.status(502).body("{\"error\":\"Empty response from provider\"}");
        }

        // Já é JSON → parsear base64
        ObjectMapper mapper = new ObjectMapper();
        JsonNode json = mapper.readTree(body);

        String b64 = null;

        if (json.has("qrCode")) b64 = json.get("qrCode").asText();
        if (json.has("image")) b64 = json.get("image").asText();
        if (json.has("base64")) b64 = json.get("base64").asText();
        if (json.has("qr")) b64 = json.get("qr").asText();

        if (b64 == null) {
            return ResponseEntity.status(502).body("{\"error\":\"Provider JSON missing base64 field\"}");
        }

        // Normalizar — remover prefixos ou adicionar se faltar
        String v = b64.trim();
        if (!v.startsWith("data:")) {
            int idx = v.indexOf(",");
            if (idx > 0) v = v.substring(idx + 1);
            v = "data:image/png;base64," + v;
        }

        return ResponseEntity.ok(v);
    }

    private String getCurrentInstanceId() {
        return service.getCurrentCompanyConfig()
                .map(c -> c.getInstanceId())
                .orElseThrow(() -> new RuntimeException("WhatsApp configuration not found"));
    }

    private String getCurrentToken() {
        return service.getInstanceToken();
    }

    private String getClientToken() {
        return service.getApiKey();
    }

    private ResponseEntity<?> handleError(Exception e) {
        return ResponseEntity.internalServerError().body(Map.of(
            "error", e.getMessage(),
            "success", false
        ));
    }
}
