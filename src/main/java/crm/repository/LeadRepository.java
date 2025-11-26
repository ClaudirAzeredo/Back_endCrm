package crm.repository;

import crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, String> {
    List<Lead> findAllByFunnelId(String funnelId);
    List<Lead> findAllByAssignedToUserId(String userId);
    // Multi-tenant: filtros por empresa
    List<Lead> findAllByCompanyId(String companyId);
    List<Lead> findAllByCompanyIdAndFunnelId(String companyId, String funnelId);
    // Suporte a backfill: encontrar leads sem empresa definida
    List<Lead> findAllByCompanyIdIsNull();
}