package crm.repository;

import crm.entity.WhatsAppContact;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppContactRepository extends JpaRepository<WhatsAppContact, String> {
}