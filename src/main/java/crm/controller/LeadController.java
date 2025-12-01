package crm.controller;

import crm.entity.Lead;
import crm.entity.LeadContact;
import crm.entity.LeadInteraction;
import crm.service.LeadService;
import crm.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/leads")
public class LeadController {

    private final LeadService leadService;
    private final UserRepository userRepository;

    public LeadController(LeadService leadService, UserRepository userRepository) {
        this.leadService = leadService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> listLeads(@RequestParam(value = "funnelId", required = false) String funnelId) {
        // Multi-tenant: lista apenas leads da empresa do usuário atual
        List<Lead> leads = leadService.listForCurrentTenant(funnelId);

        List<Map<String, Object>> body = new ArrayList<>();
        for (Lead l : leads) {
            Map<String, Object> assignedTo;
            if (l.getAssignedToUserId() != null && !l.getAssignedToUserId().isBlank()) {
                var userOpt = userRepository.findById(l.getAssignedToUserId());
                if (userOpt.isPresent()) {
                    var u = userOpt.get();
                    assignedTo = new HashMap<>();
                    assignedTo.put("id", u.getId());
                    assignedTo.put("name", Optional.ofNullable(u.getName()).orElse(""));
                    assignedTo.put("email", Optional.ofNullable(u.getEmail()).orElse(""));
                } else {
                    assignedTo = Map.of("id", l.getAssignedToUserId());
                }
            } else {
                assignedTo = Map.of();
            }

            List<Map<String, Object>> contacts = new ArrayList<>();
            if (l.getContacts() != null) {
                for (LeadContact c : l.getContacts()) {
                    Map<String, Object> cm = new HashMap<>();
                    cm.put("id", c.getId());
                    cm.put("name", Optional.ofNullable(c.getName()).orElse(""));
                    cm.put("email", Optional.ofNullable(c.getEmail()).orElse(""));
                    cm.put("phone", Optional.ofNullable(c.getPhone()).orElse(""));
                    cm.put("isPrincipal", Boolean.TRUE.equals(c.isPrincipal()));
                    contacts.add(cm);
                }
            }

            // Interactions
            List<Map<String, Object>> interactions = new ArrayList<>();
            if (l.getInteractions() != null) {
                for (LeadInteraction i : l.getInteractions()) {
                    Map<String, Object> im = new HashMap<>();
                    im.put("id", i.getId());
                    im.put("type", i.getType());
                    im.put("description", Optional.ofNullable(i.getDescription()).orElse(""));
                    im.put("date", i.getDate() == null ? Instant.now().toString() : i.getDate().toString());
                    im.put("createdBy", Optional.ofNullable(i.getCreatedBy()).orElse(""));
                    im.put("feedbackType", i.getFeedbackType());
                    im.put("rating", i.getRating());
                    interactions.add(im);
                }
            }

            Map<String, Object> m = new HashMap<>();
            m.put("id", l.getId());
            m.put("title", l.getTitle());
            m.put("client", l.getClient());
            m.put("clientEmail", l.getClientEmail());
            m.put("clientPhone", l.getClientPhone());
            m.put("clientAddress", l.getClientAddress());
            m.put("clientType", l.getClientType());
            m.put("clientCPF", l.getClientCPF());
            m.put("clientCNPJ", l.getClientCNPJ());
            m.put("source", l.getSource());
            m.put("status", l.getStatus());
            m.put("priority", l.getPriority());
            m.put("funnelId", l.getFunnelId());
            m.put("estimatedValue", l.getEstimatedValueCents() == null ? null : (l.getEstimatedValueCents() / 100.0));
            m.put("expectedCloseDate", l.getExpectedCloseDate() == null ? null : l.getExpectedCloseDate().toString());
            m.put("notes", l.getNotes());
            m.put("tags", l.getTags());
            m.put("createdAt", l.getCreatedAt() == null ? null : l.getCreatedAt().toString());
            m.put("assignedTo", assignedTo);
            m.put("contacts", contacts);
            m.put("interactions", interactions);
            body.add(m);
        }

        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<?> createLead(@RequestBody CreateLeadRequest req) {
        // Validations per technical spec
        List<String> errors = new ArrayList<>();

        if (req.contacts == null || req.contacts.isEmpty()) {
            errors.add("Pelo menos um contato é obrigatório");
        } else {
            boolean anyNamed = req.contacts.stream().anyMatch(c -> c.name != null && !c.name.isBlank());
            if (!anyNamed) errors.add("Pelo menos um contato deve ter nome");
            Optional<ContactDto> principal = req.contacts.stream().filter(c -> Boolean.TRUE.equals(c.isPrincipal)).findFirst();
            if (principal.isEmpty()) {
                errors.add("Contato principal (isPrincipal=true) é obrigatório");
            } else {
                if (principal.get().name == null || principal.get().name.isBlank()) {
                    errors.add("Contato principal deve ter nome");
                }
                if (principal.get().phone == null || principal.get().phone.isBlank()) {
                    errors.add("Contato principal deve ter telefone");
                }
            }
        }

        if (req.clientType == null || !("fisica".equalsIgnoreCase(req.clientType) || "juridica".equalsIgnoreCase(req.clientType))) {
            errors.add("Tipo de cliente inválido: deve ser 'fisica' ou 'juridica'");
        }
        if ("juridica".equalsIgnoreCase(req.clientType)) {
            if (req.title == null || req.title.isBlank()) {
                errors.add("Nome da empresa (title) é obrigatório para pessoa jurídica");
            }
        }

        if (req.clientCNPJ != null && !req.clientCNPJ.isBlank()) {
            String digits = req.clientCNPJ.replaceAll("\\D", "");
            if (digits.length() != 14) {
                errors.add("CNPJ deve ter exatamente 14 dígitos");
            } else {
                req.clientCNPJ = digits;
            }
        }

        Set<String> allowedSources = Set.of("website", "google_ads", "facebook_ads", "linkedin", "referral", "phone", "email", "event", "other");
        if (req.source == null || !allowedSources.contains(req.source)) {
            errors.add("Origem inválida");
        }

        if (req.status == null || req.status.isBlank()) {
            errors.add("Status (coluna do pipeline) é obrigatório");
        }

        if (req.assignedTo == null || req.assignedTo.id == null || req.assignedTo.id.isBlank()) {
            errors.add("Responsável (assignedTo.id) é obrigatório");
        } else if (userRepository.findById(req.assignedTo.id).isEmpty()) {
            errors.add("Usuário responsável não encontrado");
        }

        if (req.priority != null) {
            Set<String> allowedPriorities = Set.of("low", "medium", "high", "urgent");
            if (!allowedPriorities.contains(req.priority)) {
                errors.add("Prioridade inválida");
            }
        }

        LocalDate expectedClose = null;
        if (req.expectedCloseDate != null && !req.expectedCloseDate.isBlank()) {
            try {
                expectedClose = LocalDate.parse(req.expectedCloseDate);
            } catch (DateTimeParseException e) {
                errors.add("Data de fechamento esperada deve estar em formato ISO (YYYY-MM-DD)");
            }
        }

        if (req.notes != null && req.notes.length() > 5000) {
            errors.add("Observações devem ter no máximo 5000 caracteres");
        }

        if (req.funnelId == null || req.funnelId.isBlank()) {
            errors.add("funnelId é obrigatório");
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "errors", errors));
        }

        // Build entity
        Lead lead = Lead.builder()
                .title(Optional.ofNullable(req.title).orElse(req.client))
                .client(req.client)
                .clientEmail(req.clientEmail)
                .clientPhone(req.clientPhone)
                .clientAddress(req.clientAddress)
                .clientType(req.clientType)
                .clientCPF(req.clientCPF)
                .clientCNPJ(req.clientCNPJ)
                .source(req.source)
                .status(req.status)
                .funnelId(req.funnelId)
                .priority(Optional.ofNullable(req.priority).orElse("medium"))
                .expectedCloseDate(expectedClose)
                .notes(req.notes)
                .tags(req.tags == null ? List.of() : req.tags)
                .assignedToUserId(req.assignedTo.id)
                .build();

        if (req.estimatedValue != null && req.estimatedValue > 0) {
            long cents = Math.round(req.estimatedValue * 100);
            lead.setEstimatedValueCents(cents);
        }

        // Contacts
        for (ContactDto c : req.contacts) {
            if (c.name == null || c.name.isBlank()) continue; // apenas salvar contatos com nome
            LeadContact lc = LeadContact.builder()
                    .lead(lead)
                    .name(c.name)
                    .email(c.email)
                    .phone(c.phone)
                    .isPrincipal(Boolean.TRUE.equals(c.isPrincipal))
                    .build();
            lead.getContacts().add(lc);
        }

        // Persist
        Lead saved = leadService.save(lead);

        // Map response
        Map<String, Object> assignedTo = Map.of(
                "id", req.assignedTo.id,
                "name", Optional.ofNullable(req.assignedTo.name).orElse(""),
                "email", Optional.ofNullable(req.assignedTo.email).orElse("")
        );

        Map<String, Object> body = new HashMap<>();
        body.put("id", saved.getId());
        body.put("title", saved.getTitle());
        body.put("client", saved.getClient());
        body.put("clientEmail", saved.getClientEmail());
        body.put("clientPhone", saved.getClientPhone());
        body.put("clientAddress", saved.getClientAddress());
        body.put("clientType", saved.getClientType());
        body.put("clientCPF", saved.getClientCPF());
        body.put("clientCNPJ", saved.getClientCNPJ());
        body.put("source", saved.getSource());
        body.put("status", saved.getStatus());
        body.put("priority", saved.getPriority());
        body.put("funnelId", saved.getFunnelId());
        body.put("estimatedValue", saved.getEstimatedValueCents() == null ? null : (saved.getEstimatedValueCents() / 100.0));
        body.put("expectedCloseDate", saved.getExpectedCloseDate() == null ? null : saved.getExpectedCloseDate().toString());
        body.put("notes", saved.getNotes());
        body.put("tags", saved.getTags());
        body.put("createdAt", saved.getCreatedAt().toString());
        body.put("assignedTo", assignedTo);

        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteLead(@PathVariable("id") String id) {
        // Multi-tenant: garante que o lead pertence à empresa do usuário
        Lead lead = leadService.findByIdForCurrentTenant(id);
        if (lead == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Lead não encontrado"));
        }

        // Cascade remove contatos e interações (orphanRemoval=true no entity)
        leadService.leadRepository.delete(lead);

        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLead(@PathVariable("id") String id, @RequestBody UpdateLeadRequest req) {
        // Multi-tenant: garante que o lead pertence à empresa do usuário
        Lead lead = leadService.findByIdForCurrentTenant(id);
        if (lead == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Lead não encontrado"));
        }

        // Atualizações parciais permitidas
        List<String> errors = new ArrayList<>();

        if (req.funnelId != null) {
            if (req.funnelId.isBlank()) {
                errors.add("funnelId não pode ser vazio");
            } else {
                lead.setFunnelId(req.funnelId);
            }
        }

        if (req.status != null) {
            if (req.status.isBlank()) {
                errors.add("status não pode ser vazio");
            } else {
                lead.setStatus(req.status);
            }
        }

        if (req.priority != null) {
            lead.setPriority(req.priority);
        }

        if (req.expectedCloseDate != null) {
            try {
                lead.setExpectedCloseDate(req.expectedCloseDate.isBlank() ? null : java.time.LocalDate.parse(req.expectedCloseDate));
            } catch (Exception e) {
                errors.add("expectedCloseDate deve estar em formato ISO (YYYY-MM-DD)");
            }
        }

        if (req.notes != null) {
            if (req.notes.length() > 5000) {
                errors.add("Observações devem ter no máximo 5000 caracteres");
            } else {
                lead.setNotes(req.notes);
            }
        }

        if (req.tags != null) {
            lead.setTags(req.tags);
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "errors", errors));
        }

        Lead saved = leadService.save(lead);

        Map<String, Object> body = new HashMap<>();
        body.put("id", saved.getId());
        body.put("title", saved.getTitle());
        body.put("client", saved.getClient());
        body.put("status", saved.getStatus());
        body.put("priority", saved.getPriority());
        body.put("funnelId", saved.getFunnelId());
        body.put("expectedCloseDate", saved.getExpectedCloseDate() == null ? null : saved.getExpectedCloseDate().toString());
        body.put("notes", saved.getNotes());
        body.put("tags", saved.getTags());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/interactions")
    public ResponseEntity<?> addInteraction(@PathVariable("id") String leadId, @RequestBody AddInteractionRequest req) {
        // Multi-tenant: garante que o lead pertence à empresa do usuário
        Lead lead = leadService.findByIdForCurrentTenant(leadId);
        if (lead == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Lead não encontrado"));
        }

        // Basic validations
        Set<String> allowedTypes = Set.of("call", "email", "meeting", "note", "feedback");
        if (req.type == null || !allowedTypes.contains(req.type)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Tipo de interação inválido"));
        }
        if (req.notes == null || req.notes.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Descrição da interação é obrigatória"));
        }
        if ("feedback".equals(req.type)) {
            if (req.rating != null && (req.rating < 1 || req.rating > 10)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Avaliação deve estar entre 1 e 10"));
            }
        }

        Instant date;
        try {
            date = (req.date == null || req.date.isBlank()) ? Instant.now() : Instant.parse(req.date);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Data deve estar em formato ISO-8601"));
        }

        // Define createdBy com base no usuário autenticado; ignora payload 'user' do frontend
        String currentUserId;
        try {
            currentUserId = leadService.tenantResolver.getCurrentUser().getId();
        } catch (Exception e) {
            // fallback: mantém responsável do lead caso contexto de segurança não esteja disponível
            currentUserId = lead.getAssignedToUserId();
        }

        LeadInteraction interaction = LeadInteraction.builder()
                .lead(lead)
                .type(req.type)
                .description(req.notes)
                .date(date)
                .createdBy(currentUserId)
                .feedbackType(req.feedbackType)
                .rating(req.rating)
                .build();

        lead.getInteractions().add(interaction);
        leadService.save(lead);

        Map<String, Object> response = new HashMap<>();
        response.put("id", interaction.getId());
        response.put("type", interaction.getType());
        response.put("description", interaction.getDescription());
        response.put("date", interaction.getDate().toString());
        response.put("createdBy", Optional.ofNullable(interaction.getCreatedBy()).orElse(""));
        response.put("feedbackType", interaction.getFeedbackType());
        response.put("rating", interaction.getRating());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("id") String leadId, @RequestBody UpdateStatusRequest req) {
        // Multi-tenant: garante que o lead pertence à empresa do usuário
        Lead lead = leadService.findByIdForCurrentTenant(leadId);
        if (lead == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Lead não encontrado"));
        }

        if (req == null || req.status == null || req.status.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Status é obrigatório"));
        }

        // Atualiza apenas o status (coluna do pipeline). Notas podem ser ignoradas ou usadas futuramente.
        lead.setStatus(req.status);

        Lead saved = leadService.save(lead);

        Map<String, Object> body = new HashMap<>();
        body.put("id", saved.getId());
        body.put("status", saved.getStatus());
        body.put("funnelId", saved.getFunnelId());
        return ResponseEntity.ok(body);
    }

    // DTOs
    public static class CreateLeadRequest {
        public String title;
        public String client;
        public String clientEmail;
        public String clientPhone;
        public String clientAddress;
        public String clientType; // "fisica" | "juridica"
        public String clientCPF;
        public String clientCNPJ;
        public String source;
        public String status;
        public AssignedToDto assignedTo;
        public List<PersonDto> people; // opcional
        public String funnelId;
        public String priority; // low | medium | high | urgent
        public Double estimatedValue; // reais
        public String expectedCloseDate; // YYYY-MM-DD
        public String notes;
        public List<String> tags;
        public List<ContactDto> contacts;
    }

    public static class ContactDto {
        public String id;
        public String name;
        public String email;
        public String phone;
        public Boolean isPrincipal;
    }

    public static class AssignedToDto {
        public String id;
        public String name;
        public String email;
    }

    public static class PersonDto {
        public String id;
        public String name;
        public String avatar;
        public String email;
        public String phone;
    }

    // Request DTOs
    public static class AddInteractionRequest {
        public String type; // call | email | meeting | note | feedback
        public String date; // ISO-8601
        public String notes; // description
        public String user; // optional user id
        public String feedbackType; // positive | negative | neutral | important
        public Integer rating; // 1..10
    }

    public static class UpdateStatusRequest {
        public String status;
        public String notes;
    }

    public static class UpdateLeadRequest {
        public String status;
        public String funnelId;
        public String priority; // low | medium | high | urgent
        public String expectedCloseDate; // YYYY-MM-DD
        public String notes;
        public List<String> tags;
    }
}