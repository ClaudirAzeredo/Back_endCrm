package crm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "whatsapp_messages")
public class WhatsAppMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_message_id")
    private String externalMessageId;

    @Column(name = "company_id")
    private String companyId;

    @Column(name = "contact_id", nullable = false)
    private String contactId;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "timestamp")
    private Instant timestamp;

    @Column(name = "is_from_me")
    private Boolean isFromMe = Boolean.FALSE;

    @Column(name = "message_type")
    private String messageType = "text";

    @Column(name = "status")
    private String status = "received";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getExternalMessageId() { return externalMessageId; }
    public void setExternalMessageId(String externalMessageId) { this.externalMessageId = externalMessageId; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Boolean getIsFromMe() { return isFromMe; }
    public void setIsFromMe(Boolean fromMe) { isFromMe = fromMe; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}