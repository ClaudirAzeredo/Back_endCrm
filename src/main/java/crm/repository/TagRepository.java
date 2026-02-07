package crm.repository;

import crm.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, String> {
    List<Tag> findAllByCompanyId(String companyId);
    Optional<Tag> findByCompanyIdAndNameIgnoreCase(String companyId, String name);
}
