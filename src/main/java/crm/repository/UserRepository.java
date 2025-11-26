package crm.repository;

import crm.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> { // ajuste o tipo do ID se o seu User.id for Long

    Optional<User> findByEmail(String email);

    // usado no AuthService.register para checar duplicidade
    boolean existsByEmail(String email);

    // opcional: se preferir checagem case-insensitive, use este no AuthService
    boolean existsByEmailIgnoreCase(String email);

    // Listar usuários por empresa (multi-tenant)
    List<User> findAllByCompanyId(String companyId);
}