package crm.repository;

import crm.entity.Automation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationRepository extends JpaRepository<Automation, String> {
    List<Automation> findByCompanyId(String companyId);
    List<Automation> findByCompanyIdAndColumnId(String companyId, String columnId);
    List<Automation> findByCompanyIdAndActive(String companyId, Boolean active);
}

