package crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lead_interactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadInteraction {

    @Id
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Lead lead;

    // call | email | meeting | note | feedback
    @Column(nullable = false)
    private String type;

    @Column(length = 2000)
    private String description;

    @Column(name = "event_date", nullable = false)
    private Instant date;

    @Column(name = "created_by_user_id")
    private String createdBy;

    // Multi-tenant: Empresa proprietária da interação (Company.id)
    // Tornado opcional temporariamente para permitir migração e backfill
    @Column(name = "company_id")
    private String companyId;

    // positive | negative | neutral | important
    private String feedbackType;

    private Integer rating;

    @PrePersist
    public void ensureDefaults() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (date == null) {
            date = Instant.now();
        }
    }
}