package crm.controller;

import crm.entity.JobTitle;
import crm.service.JobTitleService;
import crm.repository.JobTitleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/job-titles")
public class JobTitleController {

    private final JobTitleService jobTitleService;
    private final JobTitleRepository jobTitleRepository;

    public JobTitleController(JobTitleService jobTitleService, JobTitleRepository jobTitleRepository) {
        this.jobTitleService = jobTitleService;
        this.jobTitleRepository = jobTitleRepository;
    }

    @GetMapping
    public ResponseEntity<List<JobTitle>> listAll(@RequestParam(value = "companyId", required = false) String companyId) {
        return ResponseEntity.ok(jobTitleService.list(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobTitle> get(@PathVariable String id) {
        JobTitle jt = jobTitleService.findById(id);
        if (jt == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(jt);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody CreateJobTitleRequest req) {
        if (req.name == null || req.name.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Nome é obrigatório"));
        }
        if (req.companyId == null || req.companyId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "companyId é obrigatório"));
        }
        if (req.systemRole == null || req.systemRole.isBlank()) {
            req.systemRole = "employee";
        }

        // Duplicidade por empresa (case-insensitive)
        if (jobTitleRepository.existsByCompanyIdAndNameIgnoreCase(req.companyId, req.name)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "error", "Já existe um cargo com esse nome nesta empresa"));
        }

        JobTitle jt = JobTitle.builder()
                .name(req.name.trim())
                .systemRole(req.systemRole)
                .companyId(req.companyId)
                .canViewSameRoleData(req.canViewSameRoleData == null ? true : req.canViewSameRoleData)
                .isSystemDefault(false)
                .build();
        jobTitleService.save(jt);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "jobTitle", jt
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable String id, @RequestBody UpdateJobTitleRequest req) {
        JobTitle jt = jobTitleService.findById(id);
        if (jt == null) return ResponseEntity.notFound().build();

        // Validar duplicidade se mudou nome
        if (req.name != null && !req.name.isBlank()) {
            String newName = req.name.trim();
            if (!newName.equalsIgnoreCase(jt.getName()) && jobTitleRepository.existsByCompanyIdAndNameIgnoreCase(jt.getCompanyId(), newName)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "error", "Já existe um cargo com esse nome nesta empresa"));
            }
            jt.setName(newName);
        }
        if (req.systemRole != null && !req.systemRole.isBlank()) {
            jt.setSystemRole(req.systemRole);
        }
        if (req.canViewSameRoleData != null) {
            jt.setCanViewSameRoleData(req.canViewSameRoleData);
        }

        jobTitleService.save(jt);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "jobTitle", jt
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        JobTitle jt = jobTitleService.findById(id);
        if (jt == null) return ResponseEntity.notFound().build();
        jobTitleRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    public static class CreateJobTitleRequest {
        public String name;
        public String systemRole;
        public String companyId;
        public Boolean canViewSameRoleData;
    }

    public static class UpdateJobTitleRequest {
        public String name;
        public String systemRole;
        public Boolean canViewSameRoleData;
    }
}