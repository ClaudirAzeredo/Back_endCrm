package crm.controller;

import crm.entity.Automation;
import crm.service.AutomationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/automations", "/api/automations"})
public class AutomationController {

    private final AutomationService automationService;

    public AutomationController(AutomationService automationService) {
        this.automationService = automationService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(@RequestParam Map<String, String> query) {
        List<Automation> list = automationService.list(query);
        List<Map<String, Object>> body = new ArrayList<>();
        for (Automation a : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("name", a.getName());
            m.put("columnId", a.getColumnId());
            m.put("trigger", a.getTrigger());
            m.put("actions", parseJsonArray(a.getActionsJson()));
            m.put("active", a.getActive());
            m.put("delay", a.getDelay());
            m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt().toString());
            body.add(m);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable String id) {
        List<Automation> list = automationService.list(Map.of());
        Automation found = list.stream().filter(a -> id.equals(a.getId())).findFirst().orElse(null);
        if (found == null) return ResponseEntity.notFound().build();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", found.getId());
        m.put("name", found.getName());
        m.put("columnId", found.getColumnId());
        m.put("trigger", found.getTrigger());
        m.put("actions", parseJsonArray(found.getActionsJson()));
        m.put("active", found.getActive());
        m.put("delay", found.getDelay());
        m.put("createdAt", found.getCreatedAt() == null ? null : found.getCreatedAt().toString());
        return ResponseEntity.ok(m);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Automation a = fromBody(body);
        Automation saved = automationService.create(a);
        return ResponseEntity.ok(toBody(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Automation patch = fromBody(body);
        Automation updated = automationService.update(id, patch);
        return ResponseEntity.ok(toBody(updated));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable String id, @RequestBody Map<String, Object> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        Automation updated = automationService.toggle(id, active);
        return ResponseEntity.ok(toBody(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        automationService.delete(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "deleted"));
    }

    private Automation fromBody(Map<String, Object> body) {
        Automation.AutomationBuilder b = Automation.builder();
        Object id = body.get("id");
        if (id != null) b.id(String.valueOf(id));
        Object name = body.get("name");
        if (name != null) b.name(String.valueOf(name));
        Object columnId = body.get("columnId");
        if (columnId != null) b.columnId(String.valueOf(columnId));
        Object trigger = body.get("trigger");
        if (trigger != null) b.trigger(String.valueOf(trigger));
        Object delay = body.get("delay");
        if (delay != null) b.delay(Integer.valueOf(String.valueOf(delay)));
        Object active = body.get("active");
        if (active != null) b.active(Boolean.valueOf(String.valueOf(active))); else b.active(Boolean.TRUE);
        Object actions = body.get("actions");
        if (actions != null) b.actionsJson(toJson(actions));
        Object funnelId = body.get("funnelId");
        if (funnelId != null) b.funnelId(String.valueOf(funnelId));
        return b.build();
    }

    private Map<String, Object> toBody(Automation a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("name", a.getName());
        m.put("columnId", a.getColumnId());
        m.put("trigger", a.getTrigger());
        m.put("actions", parseJsonArray(a.getActionsJson()));
        m.put("active", a.getActive());
        m.put("delay", a.getDelay());
        m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt().toString());
        return m;
    }

    private String toJson(Object o) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(o);
        } catch (Exception e) {
            return "[]";
        }
    }

    private Object parseJsonArray(String json) {
        if (json == null || json.isBlank()) return new java.util.ArrayList<>();
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            return om.readValue(json, java.util.List.class);
        } catch (Exception e) {
            return new java.util.ArrayList<>();
        }
    }
}

