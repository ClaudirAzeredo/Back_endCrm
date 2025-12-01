package crm.controller;

import crm.model.MensagemRequest;
import crm.dto.WhatsAppIncomingMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import crm.service.WhatsAppMessageService;
import crm.service.WhatsAppSseService;
import crm.service.WhatsAppConfigService;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import crm.service.WhatsappService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@RestController
@RequestMapping({"/whatsapp", "/api/whatsapp"})
public class WhatsAppWebhookController {

    private final WhatsAppMessageService messageService;
    private final WhatsappService whatsappService;
    private final WhatsAppSseService sseService;
    private final WhatsAppConfigService configService;
    private final crm.service.WhatsAppContactService contactService;
    private final WhatsAppWebhookControllerRawPersistPatch webhookDebugPersist;
    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);
    @PersistenceContext
    private EntityManager entityManager;

    public WhatsAppWebhookController(WhatsAppMessageService messageService, WhatsappService whatsappService, crm.service.WhatsAppContactService contactService, WhatsAppSseService sseService, WhatsAppConfigService configService, WhatsAppWebhookControllerRawPersistPatch webhookDebugPersist) {
        this.messageService = messageService;
        this.whatsappService = whatsappService;
        this.contactService = contactService;
        this.sseService = sseService;
        this.configService = configService;
        this.webhookDebugPersist = webhookDebugPersist;
    }

    // Webhook receiver from Z-API or custom providers
    @org.springframework.transaction.annotation.Transactional
    @PostMapping(value = "/webhook", consumes = "application/json")
    public ResponseEntity<?> receiveWebhook(@RequestHeader Map<String, String> headers,
                                            @RequestBody(required = false) Map<String, Object> body) {
        try {
            System.out.println("### ENTROU NO HANDLER /webhook ###");
            log.info("[WEBHOOK RAW] headers: {}", headers != null ? headers.keySet() : null);
            log.info("[WEBHOOK RAW] body keys: {}", body != null ? body.keySet() : null);
            log.info("[Z-API WEBHOOK] {}", body);
            System.out.println("[Z-API WEBHOOK]: " + body);
            if (body == null || body.isEmpty()) {
                System.out.println("[Z-API WEBHOOK]: payload NULL!");
                log.warn("Webhook recebido com corpo vazio");
                return ResponseEntity.ok(Map.of("success", false, "reason", "empty payload"));
            }

            Object fromMeObjRaw = body.get("fromMe");
            Map<String, Object> msgMap = null;
            Object msgObj = body.get("message");
            if (msgObj instanceof Map<?, ?> m) {
                //noinspection unchecked
                msgMap = (Map<String, Object>) m;
                if (fromMeObjRaw == null) fromMeObjRaw = msgMap.get("fromMe");
            }
            boolean isFromMeLog = Boolean.parseBoolean(String.valueOf(fromMeObjRaw));
            String phoneLog = String.valueOf(body.getOrDefault("phone", body.getOrDefault("phones", "")));
            if (phoneLog == null || phoneLog.isBlank()) {
                Object contactObj = body.get("contact");
                if (contactObj instanceof Map<?, ?> c) {
                    Object cid = ((Map<?, ?>) c).get("id");
                    if (cid != null) phoneLog = String.valueOf(cid);
                }
            }
            String messageIdLog = null;
            if (msgMap != null) messageIdLog = String.valueOf(msgMap.getOrDefault("id", ""));
            if (messageIdLog == null || messageIdLog.isBlank()) messageIdLog = String.valueOf(body.getOrDefault("messageId", ""));
            log.info("[WEBHOOK] received fromMe={} phone={} messageId={}", isFromMeLog, phoneLog, messageIdLog);

            // Try native format first (our internal contract): { type: "message", message: { ... } }
            String type = String.valueOf(body.getOrDefault("type", ""));

            if ("message".equalsIgnoreCase(type) && body.get("message") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messagePayload = (Map<String, Object>) body.get("message");
                boolean looksNative = messagePayload.containsKey("contactId") || messagePayload.containsKey("content");
                if (looksNative) {
                    WhatsAppIncomingMessageDTO dto = mapToDto(messagePayload);
                    messageService.saveIncomingMessage(dto);
                    log.info("Mensagem recebida (native): id={}, contato={}", dto.getId(), dto.getContactId());
                    return ResponseEntity.ok(Map.of("success", true));
                }
            }

            // Z-API adapter: map common webhook payloads into our internal format
            Map<String, Object> adapted = adaptZapiPayload(body);
            if (adapted != null) {
                log.info("Z-API adaptado: {}", adapted);
                Object cid = adapted.get("contactId");
                Object cnt = adapted.get("content");
                if (cid == null || String.valueOf(cid).isBlank() || cnt == null || String.valueOf(cnt).isBlank()) {
                    return ResponseEntity.ok(Map.of("success", true, "ignored", true));
                }
                String zType = String.valueOf(body.getOrDefault("type", ""));
                Object fromMeObj = adapted.get("isFromMe");
                boolean isFromMe = fromMeObj instanceof Boolean ? (Boolean) fromMeObj : false;
                boolean isReceivedCallback = zType.equalsIgnoreCase("ReceivedCallback") || zType.equalsIgnoreCase("message");
                if (!isReceivedCallback || isFromMe) {
                    return ResponseEntity.ok(Map.of("success", true, "ignored", true));
                }
                String instanceId = String.valueOf(body.getOrDefault("instanceId", "")).trim();
                String companyId = configService.resolveCompanyIdByInstanceId(instanceId);
                if (companyId == null || companyId.isBlank()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("success", false, "reason", "unknown-instance"));
                }
                Map<String, Object> enriched = new java.util.LinkedHashMap<>(adapted);
                enriched.put("companyId", companyId);
                try {
                    com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
                    String rawJson = om.writeValueAsString(body);
                    String rawPhone = String.valueOf(body.getOrDefault("participant",
                            body.getOrDefault("phone", body.getOrDefault("from", ""))));
                    String debugId = webhookDebugPersist.persistDebug(rawJson, instanceId, String.valueOf(enriched.get("id")), rawPhone);
                    if (debugId == null) {
                        log.debug("[WEBHOOK DEBUG] persistDebug retornou null (continuando)");
                    } else {
                        log.debug("[WEBHOOK DEBUG] persisted debugId={}", debugId);
                    }
                } catch (Exception ignore) {
                    log.debug("[WEBHOOK DEBUG] erro ao serializar body para JSON (continuando)", ignore);
                }
                messageService.saveIncomingMessage(enriched);
                String clientKey = resolveClientKey();
                sseService.publish(clientKey, Map.of("type","message","payload", enriched));
                // Upsert contact by phone for persistence
                String adaptedContactId = String.valueOf(enriched.get("contactId"));
                if (adaptedContactId != null && !adaptedContactId.isBlank()) {
                    contactService.upsert(adaptedContactId, null, companyId);
                }
                log.info("Mensagem recebida (Z-API adaptada): id={}, contato={} companyId={}", enriched.get("id"), enriched.get("contactId"), companyId);
                return ResponseEntity.ok(Map.of("success", true, "adapted", true));
            }

            // Unsupported/unknown type: accept to avoid retries but mark ignored
            return ResponseEntity.ok(Map.of("success", true, "ignored", true));
        } catch (Exception e) {
            log.error("Erro ao processar webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true, "ignored", true, "error", e.getMessage()));
        }
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(value = "clientKey", required = false) String clientKey) {
        String key = clientKey != null && !clientKey.isBlank() ? clientKey : resolveClientKey();
        return sseService.subscribe(key);
    }

    @GetMapping("/webhook/debug-last")
    public ResponseEntity<?> debugLast() {
        try {
            @SuppressWarnings("unchecked")
            java.util.List<Object[]> rows = entityManager.createNativeQuery(
                            "SELECT id, received_at, instance_id, message_id, phone FROM whatsapp_webhook_debug ORDER BY received_at DESC LIMIT 5")
                    .getResultList();
            java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
            for (Object[] r : rows) {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", r[0]);
                m.put("received_at", r[1]);
                m.put("instance_id", r[2]);
                m.put("message_id", r[3]);
                m.put("phone", r[4]);
                list.add(m);
            }
            return ResponseEntity.ok(java.util.Map.of("rows", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/backfill-messages")
    public ResponseEntity<?> backfillMessages(@RequestParam(value = "contactId", required = false) String contactId) {
        try {
            int updated = messageService.backfillCompanyIdForNullMessages(contactId);
            return ResponseEntity.ok(Map.of("success", true, "updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping(value = "/webhook", consumes = {"text/plain", "application/octet-stream"})
    public ResponseEntity<?> logAnyWebhook(@RequestHeader Map<String, String> headers,
                                           HttpServletRequest request) throws IOException {
        String raw = new BufferedReader(new InputStreamReader(request.getInputStream()))
                .lines().collect(Collectors.joining("\n"));
        log.info("[WEBHOOK RAW] headers: {}", headers != null ? headers.keySet() : null);
        String preview = raw != null ? raw : "null";
        log.info("[WEBHOOK RAW] raw preview: {}", preview.substring(0, Math.min(1000, preview.length())));

        Map<String, Object> parsed = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            parsed = om.readValue(raw, Map.class);
        } catch (Exception ex) {
            log.warn("[WEBHOOK RAW] failed to parse JSON: {}", ex.toString());
        }

        if (parsed != null) {
            log.info("[WEBHOOK RAW] payload keys: {}", parsed.keySet());
            Object fromMeObj = parsed.get("fromMe");
            Map<String, Object> msgMap = null;
            Object msgObj = parsed.get("message");
            if (msgObj instanceof Map<?, ?> m) {
                //noinspection unchecked
                msgMap = (Map<String, Object>) m;
                if (fromMeObj == null) fromMeObj = msgMap.get("fromMe");
            }
            boolean isFromMeLog = Boolean.parseBoolean(String.valueOf(fromMeObj));
            String phoneLog = String.valueOf(parsed.getOrDefault("phone", parsed.getOrDefault("phones", "")));
            if (phoneLog == null || phoneLog.isBlank()) {
                Object contactObj = parsed.get("contact");
                if (contactObj instanceof Map<?, ?> c) {
                    Object cid = ((Map<?, ?>) c).get("id");
                    if (cid != null) phoneLog = String.valueOf(cid);
                }
            }
            String messageIdLog = null;
            if (msgMap != null) messageIdLog = String.valueOf(msgMap.getOrDefault("id", ""));
            if (messageIdLog == null || messageIdLog.isBlank()) messageIdLog = String.valueOf(parsed.getOrDefault("messageId", ""));
            log.info("[WEBHOOK] received fromMe={} phone={} messageId={}", isFromMeLog, phoneLog, messageIdLog);

            Map<String, Object> adapted = adaptZapiPayload(parsed);
            if (adapted != null) {
                Object cid = adapted.get("contactId");
                Object cnt = adapted.get("content");
                String zType = String.valueOf(parsed.getOrDefault("type", ""));
                Object fromMeA = adapted.get("isFromMe");
                boolean isFromMeA = fromMeA instanceof Boolean ? (Boolean) fromMeA : false;
                boolean isReceivedCallback = zType.equalsIgnoreCase("ReceivedCallback") || zType.equalsIgnoreCase("message");
                if (cid != null && !String.valueOf(cid).isBlank() && cnt != null && !String.valueOf(cnt).isBlank() && isReceivedCallback && !isFromMeA) {
                    WhatsAppIncomingMessageDTO dto = mapToDto(adapted);
                    messageService.saveIncomingMessage(dto);
                    String clientKey = resolveClientKey();
                    sseService.publish(clientKey, Map.of("type","message","payload", adapted));
                    if (dto.getContactId() != null) {
                        contactService.upsert(dto.getContactId(), null, null);
                    }
                    log.info("Mensagem recebida (GENERIC adaptada): id={}, contato={}", dto.getId(), dto.getContactId());
                    return ResponseEntity.ok(Map.of("success", true, "adapted", true));
                }
            }
        }

        return ResponseEntity.ok(Map.of("success", "raw-ok"));
    }

    // Best-effort adapter for Z-API webhook payloads
    private Map<String, Object> adaptZapiPayload(Map<String, Object> body) {
        try {
            String zType = String.valueOf(body.getOrDefault("type", ""));
            boolean looksLikeZapi = zType.equalsIgnoreCase("ReceivedCallBack")
                    || zType.equalsIgnoreCase("ReceivedCallback")
                    || zType.equalsIgnoreCase("PresenceChatCallback")
                    || zType.equalsIgnoreCase("message")
                    || body.containsKey("text")
                    || body.containsKey("messageId")
                    || body.containsKey("phones")
                    || body.containsKey("phone")
                    || body.containsKey("contact");

            if (!looksLikeZapi) return null;

            if (zType.equalsIgnoreCase("PresenceChatCallback")) return null;

            Map<String, Object> msg = null;
            Object msgObj = body.get("message");
            if (msgObj instanceof Map<?, ?> m) {
                //noinspection unchecked
                msg = (Map<String, Object>) m;
            }

            // Variant A: messages array
            Object messagesObj = body.get("messages");
            Map<String, Object> m0 = null;
            if (messagesObj instanceof java.util.List<?> list && !list.isEmpty()) {
                Object first = list.get(0);
                if (first instanceof Map<?, ?> fm) {
                    //noinspection unchecked
                    m0 = (Map<String, Object>) fm;
                }
            }

            String id = firstNonBlank(
                    stringOrNull(m0 != null ? m0.get("id") : null),
                    stringOrNull(msg != null ? msg.get("id") : null),
                    stringOrNull(body.get("messageId"))
            );

            Map<String, Object> contactMap = null;
            Object contactObj = body.get("contact");
            if (contactObj instanceof Map<?, ?> c) {
                //noinspection unchecked
                contactMap = (Map<String, Object>) c;
            }

            String participant = stringOrNull(body.get("participant"));
            String participantPhone = stringOrNull(body.get("participantPhone"));
            String participantLid = stringOrNull(body.get("participantLid"));
            String contactId = firstNonBlank(
                    participant,
                    participantPhone,
                    participantLid,
                    stringOrNull(m0 != null ? m0.get("from") : null),
                    stringOrNull(body.get("phones")),
                    stringOrNull(body.get("phone")),
                    stringOrNull(contactMap != null ? contactMap.get("id") : null),
                    stringOrNull(body.get("from")),
                    stringOrNull(body.get("sender")),
                    stringOrNull(body.get("senderLid"))
            );
            if (contactId != null) {
                int at = contactId.indexOf('@');
                if (at > 0) contactId = contactId.substring(0, at);
                contactId = contactId.replaceAll("\\D+", "");
            }

            String content = null;
            String messageType = "text";
            if (m0 != null) {
                Object textNode = m0.get("text");
                if (textNode instanceof Map<?, ?> textMap) {
                    content = firstNonBlank(
                            stringOrNull(((Map<?, ?>) textMap).get("body")),
                            stringOrNull(((Map<?, ?>) textMap).get("message"))
                    );
                } else {
                    content = firstNonBlank(
                            stringOrNull(m0.get("body")),
                            stringOrNull(m0.get("text"))
                    );
                }
                String mt = stringOrNull(m0.get("type"));
                if (mt != null && !mt.isBlank()) messageType = mt;
            } else if (msg != null) {
                content = firstNonBlank(
                        stringOrNull(msg.get("body")),
                        stringOrNull(msg.get("text"))
                );
                String mt = stringOrNull(msg.get("type"));
                if (mt != null && !mt.isBlank()) messageType = mt;
            }
            Object textObj = body.get("text");
            if (content == null && textObj instanceof Map<?, ?> textMap) {
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
            Object rootTs = body.get("timestamp");
            Object msgTs = null;
            if (m0 != null) msgTs = m0.get("timestamp");
            else if (msg != null) msgTs = msg.get("timestamp");
            if (msgTs instanceof Number) {
                timestamp = Instant.ofEpochMilli(((Number) msgTs).longValue()).toString();
            } else if (rootTs instanceof Number) {
                timestamp = Instant.ofEpochMilli(((Number) rootTs).longValue()).toString();
            } else {
                Object mommentObj = body.get("momment");
                Object momentObj = body.get("moment");
                timestamp = firstNonBlank(
                        stringOrNull(msgTs),
                        stringOrNull(rootTs),
                        stringOrNull(mommentObj),
                        stringOrNull(momentObj),
                        Instant.now().toString()
                );
            }

            Object fromMeObj = m0 != null ? m0.get("fromMe") : (msg != null ? msg.get("fromMe") : body.getOrDefault("fromMe", false));
            boolean isFromMe = Boolean.parseBoolean(String.valueOf(fromMeObj));
            String status = firstNonBlank(
                    stringOrNull(body.get("status")),
                    isFromMe ? "sent" : "received"
            );

            if (contactId == null && content == null) return null;

            Map<String, Object> payload = new java.util.LinkedHashMap<>();
            payload.put("id", id != null && !id.isBlank() ? id : ("zap_" + UUID.randomUUID()));
            payload.put("contactId", contactId != null ? contactId : "unknown");
            payload.put("content", content != null ? content : "");
            payload.put("timestamp", timestamp);
            payload.put("isFromMe", isFromMe);
            payload.put("messageType", messageType);
            payload.put("status", status);
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

    private String resolveClientKey() {
        return configService.getCurrentCompanyConfig()
                .map(c -> {
                    String iid = c.getInstanceId();
                    return (iid != null && !iid.isBlank()) ? ("instance:" + iid) : "global";
                })
                .orElse("global");
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
            String clientKey = resolveClientKey();
            sseService.publish(clientKey, Map.of("type","message","payload", payload));
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
