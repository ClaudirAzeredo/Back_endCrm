package crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "refresh_tokens",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_refresh_tokens_user", columnNames = {"user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    // Código público sequencial (1,2,3,...)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Hash do segredo (nunca guarde o segredo puro)
    @Column(name = "secret_hash", nullable = false, length = 120)
    private String secretHash;

    // user_id permanece String porque User.getId() é String (UUID)
    @Column(name = "user_id", nullable = false, unique = true, length = 64)
    private String userId;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private Instant revokedAt;
}