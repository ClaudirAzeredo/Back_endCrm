package crm.service;

import crm.entity.Lead;
import crm.entity.LeadContact;
import crm.entity.LeadInteraction;
import crm.repository.LeadRepository;
import crm.repository.UserRepository;
import crm.tenant.TenantResolver;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LeadService {
    public final LeadRepository leadRepository;
    public final UserRepository userRepository;
    public final TenantResolver tenantResolver;

    public LeadService(LeadRepository leadRepository, UserRepository userRepository, TenantResolver tenantResolver) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.tenantResolver = tenantResolver;
    }

    public Lead save(Lead lead) {
        // Define empresa_id de forma automática com base no usuário atual
        String companyId = tenantResolver.getCurrentCompanyId();
        lead.setCompanyId(companyId);

        // Propaga empresa_id para contatos e interações do lead
        if (lead.getContacts() != null) {
            for (LeadContact c : lead.getContacts()) {
                c.setCompanyId(companyId);
                c.setLead(lead);
            }
        }
        if (lead.getInteractions() != null) {
            for (LeadInteraction i : lead.getInteractions()) {
                i.setCompanyId(companyId);
                i.setLead(lead);
            }
        }

        return leadRepository.save(lead);
    }

    public Lead findById(String id) {
        Optional<Lead> lead = leadRepository.findById(id);
        return lead.orElse(null);
    }

    public Lead findByIdForCurrentTenant(String id) {
        Optional<Lead> leadOpt = leadRepository.findById(id);
        if (leadOpt.isEmpty()) return null;
        String companyId = tenantResolver.getCurrentCompanyId();
        Lead lead = leadOpt.get();
        if (lead.getCompanyId() == null || !lead.getCompanyId().equals(companyId)) {
            // Não expõe leads de outras empresas
            return null;
        }
        return lead;
    }

    public List<Lead> listForCurrentTenant(String funnelId) {
        String companyId = tenantResolver.getCurrentCompanyId();
        if (funnelId == null || funnelId.isBlank()) {
            return leadRepository.findAllByCompanyId(companyId);
        }
        return leadRepository.findAllByCompanyIdAndFunnelId(companyId, funnelId);
    }
}