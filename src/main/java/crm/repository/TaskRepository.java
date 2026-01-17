package crm.repository;

import crm.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    List<Task> findAllByCompanyId(String companyId);

    List<Task> findAllByCompanyIdAndStatus(String companyId, String status);

    List<Task> findAllByCompanyIdAndPriority(String companyId, String priority);

    @Query("select t from Task t where t.companyId = :companyId and (:status is null or t.status = :status) and (:priority is null or t.priority = :priority) and (:assignedTo is null or t.assignedToUserId = :assignedTo) and (:leadId is null or t.lead.id = :leadId)")
    List<Task> query(String companyId, String status, String priority, String assignedTo, String leadId);
}
