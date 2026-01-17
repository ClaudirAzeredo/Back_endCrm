package crm.service;

import crm.entity.Automation;
import crm.repository.AutomationRepository;
import crm.tenant.TenantResolver;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AutomationService {
    public final AutomationRepository repository;
    public final TenantResolver tenantResolver;

    public AutomationService(AutomationRepository repository, TenantResolver tenantResolver) {
        this.repository = repository;
        this.tenantResolver = tenantResolver;
    }

    public List<Automation> list(Map<String, String> query) {
        String companyId = tenantResolver.getCurrentCompanyId();
        String columnId = query != null ? query.get("columnId") : null;
        String activeStr = query != null ? query.get("active") : null;
        if (columnId != null && !columnId.isBlank()) {
            return repository.findByCompanyIdAndColumnId(companyId, columnId);
        }
        if (activeStr != null) {
            boolean active = Boolean.parseBoolean(activeStr);
            return repository.findByCompanyIdAndActive(companyId, active);
        }
        return repository.findByCompanyId(companyId);
    }

    public Automation create(Automation incoming) {
        String companyId = tenantResolver.getCurrentCompanyId();
        if (incoming.getId() == null || incoming.getId().isBlank()) {
            incoming.setId("auto_" + System.currentTimeMillis());
        }
        incoming.setCompanyId(companyId);
        if (incoming.getActive() == null) incoming.setActive(Boolean.TRUE);
        return repository.save(incoming);
    }

    public Automation update(String id, Automation patch) {
        String companyId = tenantResolver.getCurrentCompanyId();
        Automation existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Automation not found"));
        if (!Objects.equals(existing.getCompanyId(), companyId)) {
            throw new RuntimeException("Forbidden");
        }
        if (patch.getName() != null) existing.setName(patch.getName());
        if (patch.getColumnId() != null) existing.setColumnId(patch.getColumnId());
        if (patch.getTrigger() != null) existing.setTrigger(patch.getTrigger());
        if (patch.getActionsJson() != null) existing.setActionsJson(patch.getActionsJson());
        if (patch.getActive() != null) existing.setActive(patch.getActive());
        if (patch.getDelay() != null) existing.setDelay(patch.getDelay());
        if (patch.getFunnelId() != null) existing.setFunnelId(patch.getFunnelId());
        return repository.save(existing);
    }

    public void delete(String id) {
        String companyId = tenantResolver.getCurrentCompanyId();
        repository.findById(id).ifPresent(a -> {
            if (Objects.equals(a.getCompanyId(), companyId)) repository.delete(a);
        });
    }

    public Automation toggle(String id, boolean active) {
        String companyId = tenantResolver.getCurrentCompanyId();
        Automation existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Automation not found"));
        if (!Objects.equals(existing.getCompanyId(), companyId)) {
            throw new RuntimeException("Forbidden");
        }
        existing.setActive(active);
        return repository.save(existing);
    }
}

