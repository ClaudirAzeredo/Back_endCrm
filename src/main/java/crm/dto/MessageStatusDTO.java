package crm.dto;

public class MessageStatusDTO {
    private String instanceId;
    private String status; // SENT, RECEIVED, READ, READ_BY_ME, PLAYED
    private String[] ids;
    private Long momment;
    private Integer phoneDevice;
    private String phone;
    private String type; // MessageStatusCallback
    private Boolean isGroup;

    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String[] getIds() { return ids; }
    public void setIds(String[] ids) { this.ids = ids; }

    public Long getMomment() { return momment; }
    public void setMomment(Long momment) { this.momment = momment; }

    public Integer getPhoneDevice() { return phoneDevice; }
    public void setPhoneDevice(Integer phoneDevice) { this.phoneDevice = phoneDevice; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Boolean getIsGroup() { return isGroup; }
    public void setIsGroup(Boolean isGroup) { this.isGroup = isGroup; }
}