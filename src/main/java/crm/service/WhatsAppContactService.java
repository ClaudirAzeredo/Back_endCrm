package crm.service;

import crm.entity.WhatsAppContact;
import crm.repository.WhatsAppContactRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WhatsAppContactService {

    private final WhatsAppContactRepository repository;

    public WhatsAppContactService(WhatsAppContactRepository repository) {
        this.repository = repository;
    }

    public WhatsAppContact upsert(String phone, String name, String companyId) {
        String id = sanitize(phone);
        WhatsAppContact existing = repository.findById(id).orElse(null);
        if (existing == null) {
            existing = new WhatsAppContact();
            existing.setId(id);
            existing.setPhone(id);
        }
        if (name != null && !name.isBlank()) existing.setName(name.trim());
        if (companyId != null && !companyId.isBlank()) existing.setCompanyId(companyId.trim());
        return repository.save(existing);
    }

    public List<WhatsAppContact> list() {
        return repository.findAll();
    }

    private String sanitize(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("\\D", "");
    }
}