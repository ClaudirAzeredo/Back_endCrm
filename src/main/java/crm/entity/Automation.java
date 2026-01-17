package crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "automations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Automation {
    @Id
    @Column(length = 255)
    private String id;

    @Column(length = 255, nullable = false)
    private String companyId;

    @Column(length = 255, nullable = false)
    private String name;

    @Column(length = 255, nullable = false)
    private String columnId;

    @Column(length = 50, nullable = false)
    private String trigger; // on_enter | on_exit | on_time_spent | on_deadline | on_response | on_no_response

    @Column(length = 50)
    private String funnelId; // opcional

    @Column(columnDefinition = "TEXT")
    private String actionsJson; // lista de ações em JSON

    @Column(nullable = false)
    private Boolean active;

    @Column
    private Integer delay; // minutos

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}

