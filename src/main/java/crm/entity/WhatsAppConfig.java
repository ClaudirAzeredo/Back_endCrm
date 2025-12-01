package crm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "whatsapp_config")
public class WhatsAppConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(name = "provider", nullable = false)
    private String provider; // e.g., "zapi" | "custom" | "meta" | "twilio"

    @Column(name = "base_url")
    private String baseUrl;

    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "client_id")
    private String clientId;

    // Secrets stored encrypted
    @Column(name = "api_key_encrypted")
    private String apiKeyEncrypted;

    @Column(name = "instance_id")
    private String instanceId;

    @Column(name = "instance_token_encrypted")
    private String instanceTokenEncrypted;

    @Column(name = "connected")
    private Boolean connected;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyId() {
        return companyId;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getWebhookUrl() {
        return webhookUrl;
    }

    public void setWebhookUrl(String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getApiKeyEncrypted() {
        return apiKeyEncrypted;
    }

    public void setApiKeyEncrypted(String apiKeyEncrypted) {
        this.apiKeyEncrypted = apiKeyEncrypted;
    }

    public String getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(String instanceId) {
        this.instanceId = instanceId;
    }

    public String getInstanceTokenEncrypted() {
        return instanceTokenEncrypted;
    }

    public void setInstanceTokenEncrypted(String instanceTokenEncrypted) {
        this.instanceTokenEncrypted = instanceTokenEncrypted;
    }

    public Boolean getConnected() {
        return connected;
    }

    public void setConnected(Boolean connected) {
        this.connected = connected;
    }
}
