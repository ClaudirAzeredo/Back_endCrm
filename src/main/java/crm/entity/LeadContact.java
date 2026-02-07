package crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "lead_contacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadContact {

    @Id
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Lead lead;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;

    @Column(name = "is_principal", nullable = false)
    @Builder.Default
    private boolean isPrincipal = false;

    // Multi-tenant: Empresa proprietária do contato (Company.id)
    // Tornado opcional temporariamente para permitir migração e backfill
    @Column(name = "company_id")
    private String companyId;

    @PrePersist
    public void ensureId() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }
}