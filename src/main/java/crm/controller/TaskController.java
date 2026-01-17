package crm.controller;

import crm.entity.Lead;
import crm.entity.Task;
import crm.entity.User;
import crm.repository.LeadRepository;
import crm.repository.TaskRepository;
import crm.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public TaskController(TaskRepository taskRepository, LeadRepository leadRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listTasks(
            @RequestParam(name = "companyId", required = false) String companyId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "priority", required = false) String priority,
            @RequestParam(name = "assignedTo", required = false) String assignedTo,
            @RequestParam(name = "leadId", required = false) String leadId
    ) {
        List<Task> tasks;
        if (companyId != null && !companyId.isBlank()) {
            tasks = taskRepository.query(companyId, status, priority, assignedTo, leadId);
        } else {
            tasks = taskRepository.findAll();
        }
        return ResponseEntity.ok(toDtos(tasks));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTask(@PathVariable String id) {
        return taskRepository.findById(id)
                .map(t -> ResponseEntity.ok(toDto(t)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTask(@RequestBody Map<String, Object> body) {
        Task t = new Task();
        t.setTitle(String.valueOf(body.getOrDefault("title", "")));
        t.setDescription((String) body.getOrDefault("description", null));
        String status = String.valueOf(body.getOrDefault("status", "pending"));
        String priority = String.valueOf(body.getOrDefault("priority", "medium"));
        t.setStatus(status);
        t.setPriority(priority);
        String companyId = (String) body.getOrDefault("companyId", null);
        t.setCompanyId(companyId);
        String leadId = (String) body.getOrDefault("leadId", null);
        if (leadId != null && !leadId.isBlank()) {
            Optional<Lead> lead = leadRepository.findById(leadId);
            lead.ifPresent(t::setLead);
        }
        Object assigned = body.get("assignedTo");
        if (assigned instanceof Map<?, ?> m) {
            t.setAssignedToUserId(String.valueOf(m.getOrDefault("id", null)));
        } else if (assigned instanceof String s) {
            t.setAssignedToUserId(s);
        }
        String dueDateStr = (String) body.getOrDefault("dueDate", null);
        if (dueDateStr != null) {
            try { t.setDueDate(Instant.parse(dueDateStr)); } catch (Exception ignore) {}
        }
        t.setCreatedAt(Instant.now());
        Task saved = taskRepository.save(t);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<Task> opt = taskRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Task t = opt.get();
        if (body.containsKey("title")) t.setTitle(String.valueOf(body.get("title")));
        if (body.containsKey("description")) t.setDescription((String) body.get("description"));
        if (body.containsKey("status")) t.setStatus(String.valueOf(body.get("status")));
        if (body.containsKey("priority")) t.setPriority(String.valueOf(body.get("priority")));
        if (body.containsKey("leadId")) {
            String leadId = (String) body.get("leadId");
            if (leadId != null && !leadId.isBlank()) {
                leadRepository.findById(leadId).ifPresent(t::setLead);
            } else {
                t.setLead(null);
            }
        }
        if (body.containsKey("assignedTo")) {
            Object assigned = body.get("assignedTo");
            if (assigned instanceof Map<?, ?> m) {
                t.setAssignedToUserId(String.valueOf(m.getOrDefault("id", null)));
            } else if (assigned instanceof String s) {
                t.setAssignedToUserId(s);
            }
        }
        if (body.containsKey("dueDate")) {
            String dueDateStr = (String) body.get("dueDate");
            if (dueDateStr != null) {
                try { t.setDueDate(Instant.parse(dueDateStr)); } catch (Exception ignore) {}
            } else {
                t.setDueDate(null);
            }
        }
        Task saved = taskRepository.save(t);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<Task> opt = taskRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Task t = opt.get();
        String status = String.valueOf(body.getOrDefault("status", t.getStatus()));
        t.setStatus(status);
        if ("completed".equalsIgnoreCase(status)) {
            t.setCompletedAt(Instant.now());
        } else {
            t.setCompletedAt(null);
        }
        Task saved = taskRepository.save(t);
        return ResponseEntity.ok(toDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTask(@PathVariable String id) {
        Optional<Task> opt = taskRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        taskRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "deleted"));
    }

    private List<Map<String, Object>> toDtos(List<Task> tasks) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Task t : tasks) result.add(toDto(t));
        return result;
    }

    private Map<String, Object> toDto(Task t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("title", t.getTitle());
        m.put("description", t.getDescription());
        m.put("status", t.getStatus());
        m.put("priority", t.getPriority());
        m.put("leadId", t.getLead() != null ? t.getLead().getId() : null);
        if (t.getLead() != null) {
            m.put("leadName", t.getLead().getTitle());
        }
        m.put("dueDate", t.getDueDate() != null ? t.getDueDate().toString() : null);
        m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        m.put("createdBy", "manual");
        m.put("completedAt", t.getCompletedAt() != null ? t.getCompletedAt().toString() : null);
        if (t.getAssignedToUserId() != null) {
            Optional<User> u = userRepository.findById(t.getAssignedToUserId());
            if (u.isPresent()) {
                Map<String, Object> ass = new LinkedHashMap<>();
                ass.put("id", u.get().getId());
                ass.put("name", u.get().getName());
                m.put("assignedTo", ass);
            } else {
                Map<String, Object> ass = new LinkedHashMap<>();
                ass.put("id", t.getAssignedToUserId());
                m.put("assignedTo", ass);
            }
        }
        return m;
    }
}
