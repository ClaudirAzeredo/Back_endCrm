package crm.repository;

import crm.entity.LeadInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadInteractionRepository extends JpaRepository<LeadInteraction, String> {
    List<LeadInteraction> findAllByCompanyIdIsNull();
}