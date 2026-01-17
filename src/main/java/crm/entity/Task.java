package crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    // pending | in_progress | completed | cancelled
    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    // low | medium | high | urgent
    @Column(nullable = false)
    @Builder.Default
    private String priority = "medium";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @Column(name = "assigned_to_user_id")
    private String assignedToUserId;

    @Column(name = "company_id")
    private String companyId;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "created_by_user_id")
    private String createdByUserId;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    public void ensureDefaults() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
        if (status == null || status.isBlank()) status = "pending";
        if (priority == null || priority.isBlank()) priority = "medium";
    }
}
