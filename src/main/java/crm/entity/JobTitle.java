package crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "job_titles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobTitle {

    @Id
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String name;

    // admin | manager | supervisor | employee
    @Column(nullable = false)
    private String systemRole;

    @Builder.Default
    private Boolean isSystemDefault = false;

    @Builder.Default
    private Instant createdAt = Instant.now();

    // Company scope (string id to align with Company.id)
    @Column(nullable = false)
    private String companyId;

    // Whether users in same job title can see each other's data
    @Builder.Default
    private Boolean canViewSameRoleData = true;

    @PrePersist
    public void ensureDefaults() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (isSystemDefault == null) {
            isSystemDefault = false;
        }
        if (canViewSameRoleData == null) {
            canViewSameRoleData = true;
        }
    }
}