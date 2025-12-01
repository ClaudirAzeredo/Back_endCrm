package crm.controller;

import jakarta.annotation.PostConstruct;
import org.postgresql.util.PGobject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.util.UUID;

@Component
public class WhatsAppWebhookControllerRawPersistPatch {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookControllerRawPersistPatch.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${whatsapp.webhook.persist-raw:true}")
    private boolean persistRaw;

    @Value("${whatsapp.webhook.debug-retention-days:30}")
    private int retentionDays;

    public WhatsAppWebhookControllerRawPersistPatch(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureIndexes() {
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_debug_received_at ON whatsapp_webhook_debug (received_at)");
        } catch (Exception e) {
            log.warn("[WEBHOOK DEBUG] falha ao garantir índice received_at: {}", e.toString());
        }
    }

    @Scheduled(cron = "${whatsapp.webhook.cleanup-cron:0 0 3 * * *}")
    public void scheduledCleanup() {
        if (retentionDays <= 0) return;
        try {
            int deleted = jdbcTemplate.update("DELETE FROM whatsapp_webhook_debug WHERE received_at < now() - interval '" + retentionDays + " days'");
            if (deleted > 0) log.info("[WEBHOOK DEBUG] cleanup executado, removidas {} linhas", deleted);
        } catch (Exception e) {
            log.warn("[WEBHOOK DEBUG] falha no cleanup agendado: {}", e.toString());
        }
    }

    public String persistDebug(String rawJson, String instanceId, String messageId, String rawPhone) {
        if (!persistRaw) return null;
        String debugId = UUID.randomUUID().toString();
        try {
            PGobject json = new PGobject();
            json.setType("jsonb");
            json.setValue(rawJson == null ? "{}" : rawJson);

            String sql = "INSERT INTO whatsapp_webhook_debug (id, received_at, raw_payload, instance_id, message_id, phone) " +
                    "VALUES (?, now(), ?, ?, ?, ?)";

            jdbcTemplate.update(sql, debugId, json, instanceId, messageId, rawPhone);
            return debugId;
        } catch (SQLException sqle) {
            log.warn("[WEBHOOK DEBUG] SQLException ao persistir raw_payload jsonb, id={}", debugId, sqle);
        } catch (Exception e) {
            log.warn("[WEBHOOK DEBUG] falha ao persistir debug row, id={}", debugId, e);
        }
        return null;
    }
}
