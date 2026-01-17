package crm.model;

public class ModifyChatRequest {
    private String phone;
    private String action; // "read", "unread", "delete"

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}