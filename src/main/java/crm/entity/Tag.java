package crm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {
    @Id
    private String id;

    private String name;
    private String color;
    private String description;

    @Column(name = "company_id")
    private String companyId;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
