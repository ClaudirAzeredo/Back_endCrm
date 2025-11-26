package crm.service;

import crm.entity.WhatsAppConfig;
import crm.repository.WhatsAppConfigRepository;
import crm.security.CryptoUtil;
import crm.tenant.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import org.springframework.beans.factory.annotation.Value;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class WhatsAppConfigService {

    private final WhatsAppConfigRepository repository;
    private final CryptoUtil cryptoUtil;
    private final TenantResolver tenantResolver;
    private final RestTemplate restTemplate;

    @Value("${zapi.instance-id:}")
    private String zapiInstanceIdProp;
    @Value("${ZAPI_INSTANCE_ID:}")
    private String zapiInstanceIdEnv;
    @Value("${zapi.token:}")
    private String zapiTokenProp;
    @Value("${ZAPI_TOKEN:}")
    private String zapiTokenEnv;

    public WhatsAppConfigService(WhatsAppConfigRepository repository,
                                 CryptoUtil cryptoUtil,
                                 TenantResolver tenantResolver,
                                 RestTemplate restTemplate) {
        this.repository = repository;
        this.cryptoUtil = cryptoUtil;
        this.tenantResolver = tenantResolver;
        this.restTemplate = restTemplate;
    }

    public Optional<WhatsAppConfig> getCurrentCompanyConfig() {
        String companyId = tenantResolver.getCurrentCompanyId();
        return repository.findByCompanyId(companyId);
    }

    public WhatsAppConfig saveConfig(WhatsAppConfig incoming) {
        String companyId = tenantResolver.getCurrentCompanyId();
        Optional<WhatsAppConfig> existingOpt = repository.findByCompanyId(companyId);
        WhatsAppConfig entity = existingOpt.orElseGet(WhatsAppConfig::new);
        entity.setCompanyId(companyId);
        entity.setProvider(incoming.getProvider());
        entity.setBaseUrl(incoming.getBaseUrl());
        entity.setWebhookUrl(incoming.getWebhookUrl());
        entity.setClientId(incoming.getClientId());
        entity.setInstanceId(incoming.getInstanceId());

        // Encrypt secrets if provided
        if (incoming.getApiKeyEncrypted() != null && !incoming.getApiKeyEncrypted().isEmpty()) {
            // Allow receiving plain apiKey in apiKeyEncrypted field for simplicity in DTO-less controller
            entity.setApiKeyEncrypted(cryptoUtil.encrypt(incoming.getApiKeyEncrypted()));
        }
        if (incoming.getInstanceTokenEncrypted() != null && !incoming.getInstanceTokenEncrypted().isEmpty()) {
            entity.setInstanceTokenEncrypted(cryptoUtil.encrypt(incoming.getInstanceTokenEncrypted()));
        }
        return repository.save(entity);
    }

    public Map<String, Object> getSafeConfigView() {
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        Map<String, Object> resp = new HashMap<>();
        if (opt.isEmpty()) return resp;
        WhatsAppConfig cfg = opt.get();
        resp.put("connected", cfg.getConnected() != null ? cfg.getConnected() : Boolean.FALSE);
        resp.put("baseUrl", cfg.getBaseUrl());
        resp.put("webhookUrl", cfg.getWebhookUrl());
        resp.put("instanceId", cfg.getInstanceId());
        String instanceToken = getInstanceToken();
        resp.put("token", instanceToken);
        return resp;
    }

    public Map<String, Object> fixSession() {
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        Map<String, Object> resp = new HashMap<>();
        if (opt.isEmpty()) {
            resp.put("success", false);
            resp.put("error", "no config");
            return resp;
        }
        WhatsAppConfig cfg = opt.get();
        String base = cfg.getBaseUrl();
        if (base == null || base.isBlank()) base = "https://api.z-api.io";
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        String id = cfg.getInstanceId();
        String token = getInstanceToken();
        String apiKey = getApiKey();

        HttpHeaders tokenHeaders = new HttpHeaders();
        if (apiKey != null && !apiKey.isBlank()) tokenHeaders.add("Client-Token", apiKey);
        if (token != null && !token.isBlank()) tokenHeaders.setBearerAuth(token);
        tokenHeaders.add("Content-Type", "application/json");
        HttpEntity<String> tokenReq = new HttpEntity<>("{}", tokenHeaders);

        HttpHeaders bearerHeaders = new HttpHeaders();
        if (token != null && !token.isBlank()) bearerHeaders.setBearerAuth(token);
        if (apiKey != null && !apiKey.isBlank()) bearerHeaders.add("Client-Token", apiKey);
        bearerHeaders.add("Content-Type", "application/json");
        HttpEntity<String> bearerReq = new HttpEntity<>("{}", bearerHeaders);

        Map<String, Object> steps = new java.util.LinkedHashMap<>();
        try {
            ResponseEntity<String> s1 = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/status", HttpMethod.GET, new HttpEntity<>(tokenHeaders), String.class);
            steps.put("status_before", s1.getBody());
        } catch (Exception e) {
            steps.put("status_before_error", e.getMessage());
        }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/logout", HttpMethod.POST, tokenReq, String.class); steps.put("logout_token", r.getBody()); } catch (Exception e) { steps.put("logout_token_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/logout", HttpMethod.POST, bearerReq, String.class); steps.put("logout_bearer", r.getBody()); } catch (Exception e) { steps.put("logout_bearer_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/disconnect", HttpMethod.POST, tokenReq, String.class); steps.put("disconnect_token_post", r.getBody()); } catch (Exception e) { steps.put("disconnect_token_post_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/disconnect", HttpMethod.DELETE, tokenReq, String.class); steps.put("disconnect_token_delete", r.getBody()); } catch (Exception e) { steps.put("disconnect_token_delete_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/disconnect", HttpMethod.POST, bearerReq, String.class); steps.put("disconnect_bearer_post", r.getBody()); } catch (Exception e) { steps.put("disconnect_bearer_post_error", e.getMessage()); }
        try { Thread.sleep(1500); } catch (InterruptedException ignored) {}
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/start-session", HttpMethod.POST, tokenReq, String.class); steps.put("start_session_token", r.getBody()); } catch (Exception e) { steps.put("start_session_token_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/start-session", HttpMethod.POST, bearerReq, String.class); steps.put("start_session_bearer", r.getBody()); } catch (Exception e) { steps.put("start_session_bearer_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/qr-code", HttpMethod.GET, new HttpEntity<>(tokenHeaders), String.class); steps.put("qr_code", r.getBody()); } catch (Exception e) { steps.put("qr_code_error", e.getMessage()); }
        try { ResponseEntity<String> r = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/qr-code/image", HttpMethod.GET, new HttpEntity<>(tokenHeaders), String.class); steps.put("qr_code_image", r.getBody()); } catch (Exception e) { steps.put("qr_code_image_error", e.getMessage()); }
        try { ResponseEntity<String> s2 = restTemplate.exchange(base + "/instances/" + id + "/token/" + token + "/status", HttpMethod.GET, new HttpEntity<>(tokenHeaders), String.class); steps.put("status_after", s2.getBody()); } catch (Exception e) { steps.put("status_after_error", e.getMessage()); }
        resp.put("success", true);
        resp.put("steps", steps);
        return resp;
    }

    // Helper to resolve decrypted secrets when calling external APIs
    public String getApiKey() {
        try {
            return getCurrentCompanyConfig()
                    .map(WhatsAppConfig::getApiKeyEncrypted)
                    .map(cryptoUtil::decrypt)
                    .orElse(null);
        } catch (Exception ex) {
            return null;
        }
    }

    public String getInstanceToken() {
        try {
            return getCurrentCompanyConfig()
                    .map(WhatsAppConfig::getInstanceTokenEncrypted)
                    .map(cryptoUtil::decrypt)
                    .orElse(null);
        } catch (Exception ex) {
            return null;
        }
    }

    public RestTemplate getRestTemplate() {
        return restTemplate;
    }

    public Map<String, Object> createInstanceIfPossible(String clientId) {
        Map<String, Object> result = new HashMap<>();
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            result.put("error", "Config not found");
            return result;
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String apiKey = getApiKey();
        if (baseUrl == null || apiKey == null) {
            result.put("error", "Missing baseUrl or apiKey");
            return result;
        }
        HttpHeaders headers = new HttpHeaders();
        // Z-API aceita autenticação pelo token da API.
        // Alguns ambientes usam header "Client-Token"; adicionamos ambos para máxima compatibilidade.
        headers.setBearerAuth(apiKey);
        headers.add("Client-Token", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> body = new HashMap<>();
        body.put("clientId", clientId != null ? clientId : (cfg.getClientId() != null ? cfg.getClientId() : "unichat-client"));
        body.put("name", "UniCRM - " + body.get("clientId"));
        HttpEntity<Map<String, String>> req = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/instances", req, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map bodyMap = response.getBody();
                Object instId = bodyMap.get("instanceId");
                // Z-API costuma retornar o campo "token"; manter compatibilidade com "instanceToken" se existir
                Object instToken = bodyMap.get("instanceToken");
                if (instToken == null) {
                    instToken = bodyMap.get("token");
                }
                if (instId != null) cfg.setInstanceId(instId.toString());
                if (instToken != null) cfg.setInstanceTokenEncrypted(cryptoUtil.encrypt(instToken.toString()));
                repository.save(cfg);
                result.put("instanceId", cfg.getInstanceId());
                result.put("instanceToken", instToken);
                return result;
            }
            result.put("error", "Failed to create instance");
            result.put("status", response.getStatusCode().value());
            result.put("response", response.getBody());
            return result;
        } catch (org.springframework.web.client.RestClientResponseException ex) {
            result.put("error", "External API error");
            result.put("status", ex.getRawStatusCode());
            result.put("response", ex.getResponseBodyAsString());
            return result;
        } catch (org.springframework.web.client.ResourceAccessException ex) {
            result.put("error", "External API unreachable");
            result.put("details", ex.getMessage());
            return result;
        } catch (Exception ex) {
            result.put("error", "Unexpected error creating instance");
            result.put("details", ex.getMessage());
            return result;
        }
    }

    public Map<String, Object> getConnectionStatus() {
        Map<String, Object> result = new HashMap<>();
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            result.put("error", "Config not found for company");
            return result;
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String instanceId = cfg.getInstanceId();
        String instanceToken = getInstanceToken();

        if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
            result.put("error", "Missing instanceId or instanceToken");
            return result;
        }
        // Normalize baseUrl for Z-API even if a wrong local URL was saved via UI
        if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
            baseUrl = "https://api.z-api.io/instances/" + instanceId;
        }

        return doStatusCheck(baseUrl, instanceId, instanceToken);
    }

    public Map<String, Object> generateQrCode() {
        Map<String, Object> result = new HashMap<>();
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            result.put("error", "Config not found for company");
            return result;
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String instanceId = cfg.getInstanceId();
        String instanceToken = getInstanceToken();

        if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
            result.put("error", "Missing instanceId or instanceToken");
            return result;
        }
        if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
            baseUrl = "https://api.z-api.io/instances/" + instanceId;
        }

        String apiKey = getApiKey();
        HttpHeaders headersInstanceBearer = new HttpHeaders();
        headersInstanceBearer.setBearerAuth(instanceToken);
        if (apiKey != null && !apiKey.isBlank()) {
            headersInstanceBearer.add("Client-Token", apiKey);
        }
        HttpHeaders headersAccountBearer = new HttpHeaders();
        if (apiKey != null && !apiKey.isBlank()) {
            headersAccountBearer.setBearerAuth(apiKey);
            headersAccountBearer.add("Client-Token", apiKey);
        }
        HttpEntity<Void> reqNoAuth = new HttpEntity<>(new HttpHeaders());
        HttpEntity<Void> reqInstanceBearer = new HttpEntity<>(headersInstanceBearer);
        HttpEntity<Void> reqAccountBearer = new HttpEntity<>(headersAccountBearer);
        String altBase = baseUrl.contains("/instances/") ? baseUrl.replace("/instances/", "/v2/instances/") : baseUrl.replace("api.z-api.io", "api.z-api.io/v2");
        String[] tokenPaths = new String[] { "/token/" + instanceToken + "/qrcode", "/token/" + instanceToken + "/qr-code", "/token/" + instanceToken + "/qr" };
        HttpMethod[] methods = new HttpMethod[] { HttpMethod.GET, HttpMethod.POST };
        try {
            for (String p : tokenPaths) {
                for (HttpMethod m : methods) {
                    try {
                        ResponseEntity<Map> r = restTemplate.exchange(baseUrl + p, m, reqInstanceBearer, Map.class);
                        if (r.getStatusCode().is2xxSuccessful() && r.getBody() != null) {
                            Map b = r.getBody();
                            Object qr = b.get("qrCode");
                            if (qr == null) qr = b.get("qr_code");
                            if (qr == null) qr = b.get("image");
                            if (qr == null) qr = b.get("qrcode");
                            if (qr == null) qr = b.get("base64");
                            if (qr != null) {
                                result.put("qrCode", qr.toString());
                                return result;
                            }
                        }
                    } catch (org.springframework.web.client.RestClientResponseException ignore) {
                        // try next path/method
                    }
                }
                for (HttpMethod m : methods) {
                    try {
                        ResponseEntity<Map> r = restTemplate.exchange(altBase + p, m, reqInstanceBearer, Map.class);
                        if (r.getStatusCode().is2xxSuccessful() && r.getBody() != null) {
                            Map b = r.getBody();
                            Object qr = b.get("qrCode");
                            if (qr == null) qr = b.get("qr_code");
                            if (qr == null) qr = b.get("image");
                            if (qr == null) qr = b.get("qrcode");
                            if (qr == null) qr = b.get("base64");
                            if (qr != null) {
                                result.put("qrCode", qr.toString());
                                return result;
                            }
                        }
                    } catch (org.springframework.web.client.RestClientResponseException ignore) {
                    }
                }
            }

            // Bearer fallback without token in URL
            String[] bearerPaths = new String[] { "/qrcode", "/qr-code", "/qr" };
            for (String p : bearerPaths) {
                for (HttpMethod m : methods) {
                    try {
                        ResponseEntity<Map> r = restTemplate.exchange(baseUrl + p, m, reqAccountBearer, Map.class);
                        if (r.getStatusCode().is2xxSuccessful() && r.getBody() != null) {
                            Map b = r.getBody();
                            Object qr = b.get("qrCode");
                            if (qr == null) qr = b.get("qr_code");
                            if (qr == null) qr = b.get("image");
                            if (qr == null) qr = b.get("qrcode");
                            if (qr == null) qr = b.get("base64");
                            if (qr != null) {
                                result.put("qrCode", qr.toString());
                                return result;
                            }
                            result.put("details", b);
                            result.put("status", r.getStatusCode().value());
                            return result;
                        }
                    } catch (org.springframework.web.client.RestClientResponseException ignore) {
                    }
                }
                for (HttpMethod m : methods) {
                    try {
                        ResponseEntity<Map> r = restTemplate.exchange(altBase + p, m, reqAccountBearer, Map.class);
                        if (r.getStatusCode().is2xxSuccessful() && r.getBody() != null) {
                            Map b = r.getBody();
                            Object qr = b.get("qrCode");
                            if (qr == null) qr = b.get("qr_code");
                            if (qr == null) qr = b.get("image");
                            if (qr == null) qr = b.get("qrcode");
                            if (qr == null) qr = b.get("base64");
                            if (qr != null) {
                                result.put("qrCode", qr.toString());
                                return result;
                            }
                            result.put("details", b);
                            result.put("status", r.getStatusCode().value());
                            return result;
                        }
                    } catch (org.springframework.web.client.RestClientResponseException ignore) {
                    }
                }
            }

            result.put("error", "Failed to generate QR");
            return result;
        } catch (org.springframework.web.client.ResourceAccessException ex) {
            result.put("error", "External API unreachable");
            result.put("details", ex.getMessage());
            return result;
        } catch (Exception ex) {
            result.put("error", "QR generation failed: " + ex.getMessage());
            return result;
        }
    }

    private Map<String, Object> doStatusCheck(String baseUrl, String instanceId, String instanceToken) {
        Map<String, Object> result = new HashMap<>();
        HttpHeaders emptyHeaders = new HttpHeaders();
        HttpEntity<Void> req = new HttpEntity<>(emptyHeaders);
        String apiKey = getApiKey();
        HttpHeaders headersAccountBearer = new HttpHeaders();
        if (apiKey != null && !apiKey.isBlank()) {
            headersAccountBearer.setBearerAuth(apiKey);
            headersAccountBearer.add("Client-Token", apiKey);
        }
        HttpEntity<Void> reqAccountBearer = new HttpEntity<>(headersAccountBearer);
        HttpHeaders headersTokenUrl = new HttpHeaders();
        // Algumas contas exigem Client-Token mesmo nas rotas token/...
        if (apiKey != null && !apiKey.isBlank()) {
            headersTokenUrl.add("Client-Token", apiKey);
        }
        // Inclui Bearer da instância para máxima compatibilidade
        if (instanceToken != null && !instanceToken.isBlank()) {
            headersTokenUrl.setBearerAuth(instanceToken);
        }
        HttpEntity<Void> reqTokenUrl = new HttpEntity<>(headersTokenUrl);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(baseUrl + "/token/" + instanceToken + "/status", HttpMethod.GET, reqTokenUrl, Map.class);
            result.put("statusCode", response.getStatusCode().value());
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                Object connected = body.get("connected");
                boolean isConnected;
                if (connected instanceof Boolean) {
                    isConnected = (Boolean) connected;
                } else {
                    Object status = body.get("status");
                    isConnected = status != null && status.toString().equalsIgnoreCase("connected");
                }
                result.put("connected", isConnected);
                result.put("details", body);
            } else {
                ResponseEntity<Map> alt = restTemplate.exchange(baseUrl + "/status", HttpMethod.GET, reqAccountBearer, Map.class);
                result.put("statusCode", alt.getStatusCode().value());
                if (alt.getStatusCode().is2xxSuccessful() && alt.getBody() != null) {
                    Map body = alt.getBody();
                    Object connected = body.get("connected");
                    boolean isConnected;
                    if (connected instanceof Boolean) {
                        isConnected = (Boolean) connected;
                    } else {
                        Object status = body.get("status");
                        isConnected = status != null && status.toString().equalsIgnoreCase("connected");
                    }
                    result.put("connected", isConnected);
                    result.put("details", body);
                } else {
                    result.put("connected", false);
                    result.put("error", "Failed to check status");
                }
            }
        } catch (Exception ex) {
            result.put("connected", false);
            result.put("error", "Status check failed: " + ex.getMessage());
        }
        return result;
    }

    private String firstNonBlank(String... vals) {
        if (vals == null) return null;
        for (String v : vals) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
