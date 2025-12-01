package crm.repository;

import crm.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByUserId(String userId);

    List<RefreshToken> findAllByUserId(String userId);

    @Modifying
    @Transactional
    long deleteByUserId(String userId);

    Optional<RefreshToken> findByIdAndRevokedFalse(Long id);
}