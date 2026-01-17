package crm.dto;

public class ChatPresenceDTO {
    private String type;
    private String phone;
    private String status; // UNAVAILABLE, AVAILABLE, COMPOSING, RECORDING, PAUSED
    private Long lastSeen;
    private String instanceId;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getLastSeen() { return lastSeen; }
    public void setLastSeen(Long lastSeen) { this.lastSeen = lastSeen; }

    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
}