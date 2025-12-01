package crm.migration;

import crm.entity.Lead;
import crm.entity.LeadContact;
import crm.entity.LeadInteraction;
import crm.entity.WhatsAppMessage;
import crm.entity.WhatsAppContact;
import crm.entity.User;
import crm.entity.WhatsAppConfig;
import crm.repository.LeadRepository;
import crm.repository.LeadContactRepository;
import crm.repository.LeadInteractionRepository;
import crm.repository.UserRepository;
import crm.repository.WhatsAppMessageRepository;
import crm.repository.WhatsAppContactRepository;
import crm.repository.WhatsAppConfigRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataBackfillRunner implements CommandLineRunner {

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final LeadContactRepository leadContactRepository;
    private final LeadInteractionRepository leadInteractionRepository;
    private final WhatsAppMessageRepository whatsappMessageRepository;
    private final WhatsAppContactRepository whatsappContactRepository;
    private final WhatsAppConfigRepository whatsappConfigRepository;
    @PersistenceContext
    private EntityManager entityManager;

    public DataBackfillRunner(LeadRepository leadRepository,
                              UserRepository userRepository,
                              LeadContactRepository leadContactRepository,
                              LeadInteractionRepository leadInteractionRepository,
                              WhatsAppMessageRepository whatsappMessageRepository,
                              WhatsAppContactRepository whatsappContactRepository,
                              WhatsAppConfigRepository whatsappConfigRepository) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.leadContactRepository = leadContactRepository;
        this.leadInteractionRepository = leadInteractionRepository;
        this.whatsappMessageRepository = whatsappMessageRepository;
        this.whatsappContactRepository = whatsappContactRepository;
        this.whatsappConfigRepository = whatsappConfigRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        normalizeWhatsAppConfigsConnectedFlag();
        createPartialUniqueIndexForWhatsAppConfig();
        createWebhookDebugTableIfNotExists();
        backfillLeadsCompanyId();
        backfillLeadContactsCompanyId();
        backfillLeadInteractionsCompanyId();
        backfillWhatsAppMessagesCompanyId();
    }

    private void backfillLeadsCompanyId() {
        List<Lead> missing = leadRepository.findAllByCompanyIdIsNull();
        int updated = 0;
        for (Lead l : missing) {
            String assignedUserId = l.getAssignedToUserId();
            if (assignedUserId != null && !assignedUserId.isBlank()) {
                User u = userRepository.findById(assignedUserId).orElse(null);
                if (u != null && u.getCompanyId() != null) {
                    l.setCompanyId(u.getCompanyId());
                    updated++;
                }
            }
        }
        if (updated > 0) {
            leadRepository.saveAll(missing);
        }
        System.out.println("[migration] Lead company_id backfilled: " + updated);
    }

    private void backfillLeadContactsCompanyId() {
        List<LeadContact> missing = leadContactRepository.findAllByCompanyIdIsNull();
        int updated = 0;
        for (LeadContact c : missing) {
            if (c.getLead() != null && c.getLead().getCompanyId() != null) {
                c.setCompanyId(c.getLead().getCompanyId());
                updated++;
            }
        }
        if (updated > 0) {
            leadContactRepository.saveAll(missing);
        }
        System.out.println("[migration] LeadContact company_id backfilled: " + updated);
    }

    private void backfillLeadInteractionsCompanyId() {
        List<LeadInteraction> missing = leadInteractionRepository.findAllByCompanyIdIsNull();
        int updated = 0;
        for (LeadInteraction i : missing) {
            if (i.getLead() != null && i.getLead().getCompanyId() != null) {
                i.setCompanyId(i.getLead().getCompanyId());
                updated++;
            }
        }
        if (updated > 0) {
            leadInteractionRepository.saveAll(missing);
        }
        System.out.println("[migration] LeadInteraction company_id backfilled: " + updated);
    }

    private void backfillWhatsAppMessagesCompanyId() {
        List<WhatsAppMessage> missing = whatsappMessageRepository.findAllByCompanyIdIsNull();
        int updated = 0;
        for (WhatsAppMessage m : missing) {
            if (m.getContactId() != null && !m.getContactId().isBlank()) {
                WhatsAppContact c = whatsappContactRepository.findById(m.getContactId()).orElse(null);
                if (c != null && c.getCompanyId() != null && !c.getCompanyId().isBlank()) {
                    m.setCompanyId(c.getCompanyId());
                    updated++;
                }
            }
        }
        if (updated > 0) {
            whatsappMessageRepository.saveAll(missing);
        }
        System.out.println("[migration] WhatsAppMessage company_id backfilled: " + updated);
    }

    private void normalizeWhatsAppConfigsConnectedFlag() {
        List<WhatsAppConfig> all = whatsappConfigRepository.findAll();
        java.util.Map<String, java.util.List<WhatsAppConfig>> groups = new java.util.HashMap<>();
        for (WhatsAppConfig c : all) {
            String iid = c.getInstanceId();
            if (iid == null) iid = "";
            groups.computeIfAbsent(iid, k -> new java.util.ArrayList<>()).add(c);
        }
        int adjusted = 0;
        for (java.util.Map.Entry<String, java.util.List<WhatsAppConfig>> e : groups.entrySet()) {
            java.util.List<WhatsAppConfig> list = e.getValue();
            if (list.isEmpty()) continue;
            list.sort(java.util.Comparator.comparingLong(WhatsAppConfig::getId));
            WhatsAppConfig preferred = null;
            for (WhatsAppConfig c : list) {
                Boolean conn = c.getConnected();
                if (Boolean.TRUE.equals(conn)) {
                    preferred = c;
                    break;
                }
            }
            if (preferred == null) preferred = list.get(0);
            for (WhatsAppConfig c : list) {
                boolean shouldBeTrue = c == preferred;
                Boolean current = c.getConnected();
                boolean currTrue = Boolean.TRUE.equals(current);
                if (shouldBeTrue != currTrue) {
                    c.setConnected(shouldBeTrue);
                    adjusted++;
                }
            }
        }
        if (adjusted > 0) {
            whatsappConfigRepository.saveAll(all);
        }
        System.out.println("[migration] WhatsAppConfig connected normalized: " + adjusted);
    }

    private void createPartialUniqueIndexForWhatsAppConfig() {
        try {
            entityManager.createNativeQuery(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_config_instance_id_connected ON whatsapp_config(instance_id) WHERE connected = true"
            ).executeUpdate();
            System.out.println("[migration] Partial unique index created for whatsapp_config.instance_id WHERE connected=true");
        } catch (Exception ignored) {
        }
    }

    private void createWebhookDebugTableIfNotExists() {
        try {
            entityManager.createNativeQuery(
                    "CREATE TABLE IF NOT EXISTS whatsapp_webhook_debug (" +
                            " id VARCHAR(36) PRIMARY KEY, " +
                            " received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), " +
                            " raw_payload JSONB, " +
                            " instance_id TEXT, " +
                            " message_id TEXT, " +
                            " phone TEXT " +
                            ")"
            ).executeUpdate();
            entityManager.createNativeQuery(
                    "CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_debug_instance ON whatsapp_webhook_debug (instance_id)"
            ).executeUpdate();
            entityManager.createNativeQuery(
                    "CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_debug_message ON whatsapp_webhook_debug (message_id)"
            ).executeUpdate();
            System.out.println("[migration] whatsapp_webhook_debug table ensured");
        } catch (Exception ignored) {
        }
    }
}
