package crm.dto;

import java.time.Instant;

public class WhatsAppIncomingMessageDTO {
    private String id;
    private String contactId;
    private String content;
    private Instant timestamp;
    private Boolean isFromMe;
    private String messageType;
    private String status;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Boolean getIsFromMe() { return isFromMe; }
    public void setIsFromMe(Boolean isFromMe) { this.isFromMe = isFromMe; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}