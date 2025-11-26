package crm.controller;

import crm.model.MensagemRequest;
import crm.dto.WhatsAppIncomingMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import crm.service.WhatsAppMessageService;
import crm.service.WhatsappService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/whatsapp", "/api/whatsapp"})
public class WhatsAppWebhookController {

    private final WhatsAppMessageService messageService;
    private final WhatsappService whatsappService;
    private final crm.service.WhatsAppContactService contactService;
    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    public WhatsAppWebhookController(WhatsAppMessageService messageService, WhatsappService whatsappService, crm.service.WhatsAppContactService contactService) {
        this.messageService = messageService;
        this.whatsappService = whatsappService;
        this.contactService = contactService;
    }

    // Webhook receiver from Z-API or custom providers
    @PostMapping("/webhook")
    public ResponseEntity<?> receiveWebhook(@RequestBody Map<String, Object> body) {
        try {
            if (body == null || body.isEmpty()) {
                log.warn("Webhook recebido com corpo vazio");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "Empty body"));
            }

            // Try native format first (our internal contract): { type: "message", message: { ... } }
            String type = String.valueOf(body.getOrDefault("type", ""));

            if ("message".equalsIgnoreCase(type) && body.get("message") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messagePayload = (Map<String, Object>) body.get("message");
                WhatsAppIncomingMessageDTO dto = mapToDto(messagePayload);
                messageService.saveIncomingMessage(dto);
                log.info("Mensagem recebida (native): id={}, contato={}", dto.getId(), dto.getContactId());
                return ResponseEntity.ok(Map.of("success", true));
            }

            // Z-API adapter: map common webhook payloads into our internal format
            Map<String, Object> adapted = adaptZapiPayload(body);
            if (adapted != null) {
                WhatsAppIncomingMessageDTO dto = mapToDto(adapted);
                messageService.saveIncomingMessage(dto);
                // Upsert contact by phone for persistence
                if (dto.getContactId() != null) {
                    contactService.upsert(dto.getContactId(), null, null);
                }
                log.info("Mensagem recebida (Z-API adaptada): id={}, contato={}", dto.getId(), dto.getContactId());
                return ResponseEntity.ok(Map.of("success", true, "adapted", true));
            }

            // Unsupported/unknown type: accept to avoid retries but mark ignored
            return ResponseEntity.ok(Map.of("success", true, "ignored", true));
        } catch (Exception e) {
            log.error("Erro ao processar webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Best-effort adapter for Z-API webhook payloads
    private Map<String, Object> adaptZapiPayload(Map<String, Object> body) {
        try {
            String zType = String.valueOf(body.getOrDefault("type", ""));
            // Accept both "ReceivedCallBack" and sent-by-me deliveries
            boolean looksLikeZapi = zType.equalsIgnoreCase("ReceivedCallBack")
                    || zType.equalsIgnoreCase("ReceivedCallback")
                    || zType.equalsIgnoreCase("PresenceChatCallback")
                    || body.containsKey("text")
                    || body.containsKey("messageId")
                    || body.containsKey("phones")
                    || body.containsKey("phone");

            if (!looksLikeZapi) return null;

            // Presence events do not carry a message content — ignore
            if (zType.equalsIgnoreCase("PresenceChatCallback")) return null;

            String id = stringOrNull(body.get("messageId"));
            String contactId = firstNonBlank(
                    stringOrNull(body.get("phones")),
                    stringOrNull(body.get("phone"))
            );

            // Determine content and messageType from known sections
            String content = null;
            String messageType = "text";
            Object textObj = body.get("text");
            if (textObj instanceof Map<?, ?> textMap) {
                content = stringOrNull(textMap.get("message"));
                messageType = "text";
            }
            // List response (interactive)
            if (content == null) {
                Object listObj = body.get("listResponseMessage");
                if (listObj instanceof Map<?, ?> listMap) {
                    content = firstNonBlank(
                            stringOrNull(listMap.get("message")),
                            stringOrNull(listMap.get("title"))
                    );
                    messageType = "list";
                }
            }
            if (content == null) {
                // images
                Object imageObj = body.get("image");
                if (imageObj instanceof Map<?, ?> imageMap) {
                    content = firstNonBlank(
                            stringOrNull(imageMap.get("caption")),
                            stringOrNull(imageMap.get("imageUrl")),
                            stringOrNull(imageMap.get("thumbnailUrl"))
                    );
                    messageType = "image";
                }
            }
            if (content == null) {
                // audio
                Object audioObj = body.get("audio");
                if (audioObj instanceof Map<?, ?> audioMap) {
                    content = firstNonBlank(
                            stringOrNull(audioMap.get("audioUrl")),
                            stringOrNull(audioMap.get("mimeType"))
                    );
                    messageType = "audio";
                }
            }
            if (content == null) {
                // video
                Object videoObj = body.get("video");
                if (videoObj instanceof Map<?, ?> videoMap) {
                    content = firstNonBlank(
                            stringOrNull(videoMap.get("caption")),
                            stringOrNull(videoMap.get("videoUrl"))
                    );
                    messageType = "video";
                }
            }
            if (content == null) {
                // document
                Object docObj = body.get("document");
                if (docObj instanceof Map<?, ?> docMap) {
                    content = firstNonBlank(
                            stringOrNull(docMap.get("title")),
                            stringOrNull(docMap.get("fileName")),
                            stringOrNull(docMap.get("documentUrl"))
                    );
                    messageType = "document";
                }
            }
            if (content == null) {
                // sticker
                Object stickerObj = body.get("sticker");
                if (stickerObj instanceof Map<?, ?> stickerMap) {
                    content = firstNonBlank(
                            stringOrNull(stickerMap.get("stickerUrl")),
                            stringOrNull(stickerMap.get("mimeType"))
                    );
                    messageType = "sticker";
                }
            }

            String timestamp;
            Object mommentObj = body.get("momment");
            Object momentObj = body.get("moment");
            if (mommentObj instanceof Number) {
                timestamp = Instant.ofEpochMilli(((Number) mommentObj).longValue()).toString();
            } else if (momentObj instanceof Number) {
                timestamp = Instant.ofEpochMilli(((Number) momentObj).longValue()).toString();
            } else {
                timestamp = firstNonBlank(
                        stringOrNull(mommentObj),
                        stringOrNull(momentObj),
                        Instant.now().toString()
                );
            }

            boolean isFromMe = Boolean.parseBoolean(String.valueOf(body.getOrDefault("fromMe", false)));
            String status = firstNonBlank(
                    stringOrNull(body.get("status")),
                    isFromMe ? "sent" : "received"
            );

            if (contactId == null && content == null) return null;

            Map<String, Object> payload = Map.of(
                    "id", id != null ? id : ("zap_" + UUID.randomUUID()),
                    "contactId", contactId != null ? contactId : "unknown",
                    "content", content != null ? content : "",
                    "timestamp", timestamp,
                    "isFromMe", isFromMe,
                    "messageType", messageType,
                    "status", status
            );
            return payload;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String stringOrNull(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    // Enviar mensagem (utilizado pelo provider "custom" no front)
    @PostMapping("/send-message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body) {
        try {
            if (body == null || body.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "Body vazio"));
            }

            String contactId = String.valueOf(body.getOrDefault("contactId", "")).trim();
            String message = String.valueOf(body.getOrDefault("message", "")).trim();
            String timestamp = String.valueOf(body.getOrDefault("timestamp", Instant.now().toString()));

            if (contactId.isBlank() || message.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("success", false, "error", "Campos obrigatórios: contactId, message"));
            }

            // Envia via serviço já existente (Z-API)
            MensagemRequest request = new MensagemRequest();
            request.setNumero(contactId);
            request.setMensagem(message);
            String apiResponse = whatsappService.enviarMensagem(request);

            // Persiste no banco para refletir na UI
            String generatedId = "msg_" + UUID.randomUUID();
            Map<String, Object> payload = Map.of(
                    "id", generatedId,
                    "contactId", contactId,
                    "content", message,
                    "timestamp", timestamp,
                    "isFromMe", true,
                    "messageType", "text",
                    "status", "sent"
            );
            messageService.saveIncomingMessage(payload);
            // Upsert contact
            contactService.upsert(contactId, null, null);
            log.info("Mensagem enviada: contato={}, conteudo_len={}", contactId, message.length());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "messageId", generatedId,
                    "providerResponse", apiResponse
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Phase 2: Conversations listing
    @GetMapping("/conversations")
    public ResponseEntity<Map<String, Object>> getConversations() {
        List<Map<String, Object>> conversations = messageService.listConversations();
        return ResponseEntity.ok(Map.of("conversations", conversations));
    }

    // Phase 2: Messages by contact
    @GetMapping("/messages/{contactId}")
    public ResponseEntity<Map<String, Object>> getMessagesByContact(@PathVariable String contactId) {
        List<Map<String, Object>> messages = messageService.listMessagesForContact(contactId);
        return ResponseEntity.ok(Map.of("messages", messages));
    }

    @GetMapping("/contacts")
    public ResponseEntity<Map<String, Object>> listContacts() {
        List<crm.entity.WhatsAppContact> contacts = contactService.list();
        return ResponseEntity.ok(Map.of("contacts", contacts));
    }

    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> upsertContact(@RequestBody Map<String, Object> body) {
        String phone = String.valueOf(body.getOrDefault("phone", body.getOrDefault("id", "")));
        String name = String.valueOf(body.getOrDefault("name", ""));
        if (phone == null || phone.replaceAll("\\D", "").isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "phone obrigatório"));
        }
        crm.entity.WhatsAppContact saved = contactService.upsert(phone, name, null);
        return ResponseEntity.ok(Map.of("success", true, "contact", saved));
    }
    private WhatsAppIncomingMessageDTO mapToDto(Map<String, Object> payload) {
        WhatsAppIncomingMessageDTO dto = new WhatsAppIncomingMessageDTO();
        dto.setId(stringOrNull(payload.get("id")));
        dto.setContactId(stringOrNull(payload.get("contactId")));
        dto.setContent(stringOrNull(payload.get("content")));
        String ts = stringOrNull(payload.get("timestamp"));
        try {
            dto.setTimestamp(ts != null && !ts.isBlank() ? Instant.parse(ts) : Instant.now());
        } catch (Exception e) {
            dto.setTimestamp(Instant.now());
        }
        Object fromMe = payload.get("isFromMe");
        dto.setIsFromMe(fromMe instanceof Boolean ? (Boolean) fromMe : Boolean.FALSE);
        String type = stringOrNull(payload.get("messageType"));
        dto.setMessageType(type != null && !type.isBlank() ? type : "text");
        String st = stringOrNull(payload.get("status"));
        dto.setStatus(st != null && !st.isBlank() ? st : "received");
        return dto;
    }
}