package crm.service;

import crm.entity.WhatsAppConfig;
import crm.model.MensagemRequest;
import crm.repository.WhatsAppConfigRepository;
import crm.security.CryptoUtil;
import crm.tenant.TenantResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class WhatsappService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappService.class);
    private final RestTemplate restTemplate;
    private final WhatsAppConfigRepository repository;
    private final CryptoUtil cryptoUtil;
    private final TenantResolver tenantResolver;

    // Optional: account security token to include as Client-Token header (fallback)
    @Value("${zapi.api-key:}")
    private String zapiApiKey;

    public WhatsappService(RestTemplate restTemplate,
                           WhatsAppConfigRepository repository,
                           CryptoUtil cryptoUtil,
                           TenantResolver tenantResolver) {
        this.restTemplate = restTemplate;
        this.repository = repository;
        this.cryptoUtil = cryptoUtil;
        this.tenantResolver = tenantResolver;
    }

    public String enviarMensagem(MensagemRequest request) {
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            throw new RuntimeException("Config not found for company");
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String instanceId = cfg.getInstanceId();
        String instanceToken = getInstanceToken();
        String apiKey = getApiKey();

        if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
            throw new RuntimeException("Missing instanceId or instanceToken for company");
        }
        // Normalize baseUrl: ensure it points to the instance root
        if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
            baseUrl = "https://api.z-api.io/instances/" + instanceId;
        }
        // Z-API docs: POST https://api.z-api.io/instances/{INSTANCE}/token/{TOKEN}/send-text
        String url = baseUrl + "/token/" + instanceToken + "/send-text";

        Map<String, String> body = new HashMap<>();
        // Z-API expects digits only, without '+' or formatting
        String digitsOnly = request.getNumero() != null ? request.getNumero().replaceAll("[^0-9]", "") : "";
        body.put("phone", digitsOnly);
        body.put("message", request.getMensagem());

        String headerApiKey = (apiKey != null && !apiKey.isBlank()) ? apiKey : zapiApiKey;
        if (headerApiKey == null || headerApiKey.isBlank()) {
            throw new RuntimeException("Client-Token ausente");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Client-Token", headerApiKey);
        headers.setBearerAuth(instanceToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response == null || response.getBody() == null) {
                throw new RestClientException("Empty response from WhatsApp API");
            }
            return response.getBody();
        } catch (RestClientException ex) {
            throw new RuntimeException("Erro ao enviar mensagem via Z-API: " + ex.getMessage(), ex);
        }
    }

    private Optional<WhatsAppConfig> getCurrentCompanyConfig() {
        String companyId = tenantResolver.getCurrentCompanyId();
        return repository.findByCompanyId(companyId);
    }

    private String getApiKey() {
        try {
            return getCurrentCompanyConfig()
                    .map(WhatsAppConfig::getApiKeyEncrypted)
                    .map(cryptoUtil::decrypt)
                    .orElse(null);
        } catch (Exception ex) {
            return null;
        }
    }

    private String getInstanceToken() {
        try {
            return getCurrentCompanyConfig()
                    .map(WhatsAppConfig::getInstanceTokenEncrypted)
                    .map(cryptoUtil::decrypt)
                    .orElse(null);
        } catch (Exception ex) {
            return null;
        }
    }

    public boolean modifyChat(String phone, String action) {
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            throw new RuntimeException("Config not found for company");
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String instanceId = cfg.getInstanceId();
        String instanceToken = getInstanceToken();
        String apiKey = getApiKey();

        if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
            throw new RuntimeException("Missing instanceId or instanceToken for company");
        }
        
        // Normalize baseUrl
        if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
            baseUrl = "https://api.z-api.io/instances/" + instanceId;
        }
        
        // Z-API docs: POST https://api.z-api.io/instances/{INSTANCE}/token/{TOKEN}/modify-chat
        String url = baseUrl + "/token/" + instanceToken + "/modify-chat";

        Map<String, String> body = new HashMap<>();
        // Z-API expects digits only, without '+' or formatting
        String digitsOnly = phone != null ? phone.replaceAll("[^0-9]", "") : "";
        body.put("phone", digitsOnly);
        body.put("action", action);

        String headerApiKey = (apiKey != null && !apiKey.isBlank()) ? apiKey : zapiApiKey;
        if (headerApiKey == null || headerApiKey.isBlank()) {
            throw new RuntimeException("Client-Token ausente");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Client-Token", headerApiKey);
        headers.setBearerAuth(instanceToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response == null || response.getBody() == null) {
                throw new RestClientException("Empty response from WhatsApp API");
            }
            // Parse response to check if action was successful
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            try {
                Map<String, Object> responseMap = mapper.readValue(response.getBody(), Map.class);
                Object value = responseMap.get("value");
                return Boolean.TRUE.equals(value);
            } catch (Exception e) {
                log.warn("Failed to parse modify-chat response: {}", response.getBody());
                return false;
            }
        } catch (RestClientException ex) {
            throw new RuntimeException("Erro ao modificar chat via Z-API: " + ex.getMessage(), ex);
        }
    }

    public boolean updateWebhookChatPresence(String webhookUrl) {
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            throw new RuntimeException("Config not found for company");
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String instanceId = cfg.getInstanceId();
        String instanceToken = getInstanceToken();
        String apiKey = getApiKey();

        if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
            throw new RuntimeException("Missing instanceId or instanceToken for company");
        }
        
        // Normalize baseUrl
        if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
            baseUrl = "https://api.z-api.io/instances/" + instanceId;
        }
        
        // Z-API docs: PUT https://api.z-api.io/instances/{INSTANCE}/token/{TOKEN}/update-webhook-chat-presence
        String url = baseUrl + "/token/" + instanceToken + "/update-webhook-chat-presence";

        Map<String, String> body = new HashMap<>();
        body.put("value", webhookUrl);

        String headerApiKey = (apiKey != null && !apiKey.isBlank()) ? apiKey : zapiApiKey;
        if (headerApiKey == null || headerApiKey.isBlank()) {
            throw new RuntimeException("Client-Token ausente");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Client-Token", headerApiKey);
        headers.setBearerAuth(instanceToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.PUT, entity, String.class);
            if (response == null || response.getBody() == null) {
                throw new RestClientException("Empty response from WhatsApp API");
            }
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException ex) {
            throw new RuntimeException("Erro ao atualizar webhook de presença via Z-API: " + ex.getMessage(), ex);
        }
    }

    public boolean updateWebhookMessageStatus(String webhookUrl) {
        Optional<WhatsAppConfig> opt = getCurrentCompanyConfig();
        if (opt.isEmpty()) {
            throw new RuntimeException("Config not found for company");
        }
        WhatsAppConfig cfg = opt.get();
        String baseUrl = cfg.getBaseUrl();
        String instanceId = cfg.getInstanceId();
        String instanceToken = getInstanceToken();
        String apiKey = getApiKey();

        if (instanceId == null || instanceId.isBlank() || instanceToken == null || instanceToken.isBlank()) {
            throw new RuntimeException("Missing instanceId or instanceToken for company");
        }
        
        // Normalize baseUrl
        if (baseUrl == null || baseUrl.isBlank()
                || baseUrl.contains("/api/whatsapp")
                || baseUrl.startsWith("http://localhost")
                || baseUrl.startsWith("https://localhost")
                || !baseUrl.contains("/instances/")) {
            baseUrl = "https://api.z-api.io/instances/" + instanceId;
        }
        
        // Z-API docs: PUT https://api.z-api.io/instances/{INSTANCE}/token/{TOKEN}/update-webhook-status
        String url = baseUrl + "/token/" + instanceToken + "/update-webhook-status";

        Map<String, String> body = new HashMap<>();
        body.put("value", webhookUrl);

        String headerApiKey = (apiKey != null && !apiKey.isBlank()) ? apiKey : zapiApiKey;
        if (headerApiKey == null || headerApiKey.isBlank()) {
            throw new RuntimeException("Client-Token ausente");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Client-Token", headerApiKey);
        headers.setBearerAuth(instanceToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.PUT, entity, String.class);
            if (response == null || response.getBody() == null) {
                throw new RestClientException("Empty response from WhatsApp API");
            }
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException ex) {
            throw new RuntimeException("Erro ao atualizar webhook de status via Z-API: " + ex.getMessage(), ex);
        }
    }
}
