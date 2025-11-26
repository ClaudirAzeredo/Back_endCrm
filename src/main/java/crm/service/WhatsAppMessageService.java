package crm.service;

import crm.dto.WhatsAppIncomingMessageDTO;
import crm.entity.WhatsAppMessage;
import crm.repository.WhatsAppMessageRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class WhatsAppMessageService {

    private final WhatsAppMessageRepository repository;

    public WhatsAppMessageService(WhatsAppMessageRepository repository) {
        this.repository = repository;
    }

    public WhatsAppMessage saveIncomingMessage(Map<String, Object> messagePayload) {
        WhatsAppMessage m = new WhatsAppMessage();
        m.setExternalMessageId(asString(messagePayload.get("id")));
        m.setContactId(sanitize(asString(messagePayload.get("contactId")))); // phone/contact id (digits only)
        m.setContent(asString(messagePayload.get("content")));

        String ts = asString(messagePayload.get("timestamp"));
        Instant instant = parseInstant(ts);
        m.setTimestamp(instant != null ? instant : Instant.now());

        Object isFromMeObj = messagePayload.get("isFromMe");
        m.setIsFromMe(isFromMeObj instanceof Boolean ? (Boolean) isFromMeObj : Boolean.FALSE);

        String messageType = asString(messagePayload.get("messageType"));
        m.setMessageType(messageType != null && !messageType.isBlank() ? messageType : "text");

        String status = asString(messagePayload.get("status"));
        m.setStatus(status != null && !status.isBlank() ? status : "received");

        return repository.save(m);
    }

    public WhatsAppMessage saveIncomingMessage(WhatsAppIncomingMessageDTO dto) {
        WhatsAppMessage m = new WhatsAppMessage();
        m.setExternalMessageId(dto.getId());
        m.setContactId(sanitize(dto.getContactId()));
        m.setContent(dto.getContent());
        m.setTimestamp(dto.getTimestamp() != null ? dto.getTimestamp() : Instant.now());
        m.setIsFromMe(Boolean.TRUE.equals(dto.getIsFromMe()));
        m.setMessageType(dto.getMessageType() != null && !dto.getMessageType().isBlank() ? dto.getMessageType() : "text");
        m.setStatus(dto.getStatus() != null && !dto.getStatus().isBlank() ? dto.getStatus() : "received");
        return repository.save(m);
    }

    public List<Map<String, Object>> listConversations() {
        List<WhatsAppMessage> all = repository.findAllByOrderByTimestampAsc();
        Map<String, List<WhatsAppMessage>> byContact = new LinkedHashMap<>();
        for (WhatsAppMessage m : all) {
            byContact.computeIfAbsent(m.getContactId(), k -> new ArrayList<>()).add(m);
        }

        List<Map<String, Object>> conversations = new ArrayList<>();
        for (Map.Entry<String, List<WhatsAppMessage>> entry : byContact.entrySet()) {
            String contactId = entry.getKey();
            List<WhatsAppMessage> msgs = entry.getValue();
            int unreadCount = 0; // Placeholder: could track read status in future
            for (WhatsAppMessage mm : msgs) {
                if (!Boolean.TRUE.equals(mm.getIsFromMe())) {
                    unreadCount++;
                }
            }
            Map<String, Object> conv = new HashMap<>();
            conv.put("contactId", contactId);
            conv.put("messages", mapMessages(msgs));
            conv.put("unreadCount", unreadCount);
            if (!msgs.isEmpty()) {
                conv.put("lastMessage", mapMessage(msgs.get(msgs.size() - 1)));
            }
            conversations.add(conv);
        }
        return conversations;
    }

    public List<Map<String, Object>> listMessagesForContact(String contactId) {
        String normalized = sanitize(contactId);
        List<WhatsAppMessage> all = repository.findAllByOrderByTimestampAsc();
        List<WhatsAppMessage> filtered = new ArrayList<>();
        for (WhatsAppMessage m : all) {
            if (normalized.equals(sanitize(m.getContactId()))) {
                filtered.add(m);
            }
        }
        return mapMessages(filtered);
    }

    private List<Map<String, Object>> mapMessages(List<WhatsAppMessage> msgs) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (WhatsAppMessage m : msgs) {
            out.add(mapMessage(m));
        }
        return out;
    }

    private Map<String, Object> mapMessage(WhatsAppMessage m) {
        Map<String, Object> mm = new HashMap<>();
        mm.put("id", Optional.ofNullable(m.getExternalMessageId()).orElse(String.valueOf(m.getId())));
        mm.put("contactId", m.getContactId());
        mm.put("content", Optional.ofNullable(m.getContent()).orElse(""));
        mm.put("timestamp", Optional.ofNullable(m.getTimestamp()).orElse(Instant.now()).toString());
        mm.put("isFromMe", Boolean.TRUE.equals(m.getIsFromMe()));
        mm.put("messageType", Optional.ofNullable(m.getMessageType()).orElse("text"));
        mm.put("status", Optional.ofNullable(m.getStatus()).orElse("received"));
        return mm;
    }

    private String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private Instant parseInstant(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Instant.parse(s);
        } catch (Exception e) {
            return null;
        }
    }

    private String sanitize(String phone) {
        if (phone == null) return null;
        return phone.replaceAll("\\D", "");
    }
}