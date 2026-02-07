package crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String client;

    private String clientEmail;
    private String clientPhone;
    private String clientAddress;

    // fisica | juridica
    @Column(nullable = false)
    private String clientType;

    private String clientCPF;
    private String clientCNPJ;

    // website, google_ads, facebook_ads, linkedin, referral, phone, email, event, other
    @Column(nullable = false)
    private String source;

    // Pipeline column id
    @Column(nullable = false)
    private String status;

    // Funil ao qual o lead pertence
    @Column(nullable = false)
    private String funnelId;

    // ID da ação atual que o lead está executando na automação
    private String currentActionId;

    // low | medium | high | urgent (default: medium)
    @Column(nullable = false)
    @Builder.Default
    private String priority = "medium";

    // armazenado em centavos
    private Long estimatedValueCents;

    private LocalDate expectedCloseDate;

    @Column(length = 5000)
    private String notes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lead_tags", joinColumns = @JoinColumn(name = "lead_id"))
    @Column(name = "tag_id")
    private List<String> tags;

    @Builder.Default
    private Instant createdAt = Instant.now();

    // Multi-tenant: Empresa proprietária do lead (Company.id)
    // Tornado opcional temporariamente para permitir migração e backfill
    @Column(name = "company_id")
    private String companyId;

    // Responsável (User.id)
    // Tornado opcional temporariamente para permitir migração e backfill
    @Column(name = "assigned_to_user_id")
    private String assignedToUserId;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LeadContact> contacts = new ArrayList<>();

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LeadInteraction> interactions = new ArrayList<>();

    @PrePersist
    public void ensureDefaults() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (priority == null || priority.isBlank()) {
            priority = "medium";
        }
    }
}