package crm.migration;

import crm.entity.Lead;
import crm.entity.LeadContact;
import crm.entity.LeadInteraction;
import crm.entity.User;
import crm.repository.LeadRepository;
import crm.repository.LeadContactRepository;
import crm.repository.LeadInteractionRepository;
import crm.repository.UserRepository;
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

    public DataBackfillRunner(LeadRepository leadRepository,
                              UserRepository userRepository,
                              LeadContactRepository leadContactRepository,
                              LeadInteractionRepository leadInteractionRepository) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.leadContactRepository = leadContactRepository;
        this.leadInteractionRepository = leadInteractionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        backfillLeadsCompanyId();
        backfillLeadContactsCompanyId();
        backfillLeadInteractionsCompanyId();
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
}