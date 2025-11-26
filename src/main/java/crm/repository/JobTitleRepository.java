package crm.repository;

import crm.entity.JobTitle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobTitleRepository extends JpaRepository<JobTitle, String> {
    List<JobTitle> findAllByCompanyId(String companyId);
    boolean existsByCompanyIdAndNameIgnoreCase(String companyId, String name);
}