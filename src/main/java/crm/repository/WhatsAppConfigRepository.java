package crm.repository;

import crm.entity.WhatsAppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WhatsAppConfigRepository extends JpaRepository<WhatsAppConfig, Long> {
    Optional<WhatsAppConfig> findByCompanyId(String companyId);
    Optional<WhatsAppConfig> findFirstByInstanceIdOrderByIdAsc(String instanceId);
    Optional<WhatsAppConfig> findFirstByInstanceIdAndConnectedTrueOrderByIdAsc(String instanceId);
}
