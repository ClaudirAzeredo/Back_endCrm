package crm.tenant;

import crm.entity.User;
import crm.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class TenantResolver {

    private final UserRepository userRepository;

    public TenantResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String getCurrentCompanyId() {
        User user = getCurrentUser();
        String companyId = user.getCompanyId();
        if (companyId == null || companyId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuário sem empresa associada");
        }
        return companyId;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));
    }

    // Futuro: trocar schema dinamicamente (Hibernate Multi-Tenancy / DataSource)
    // Exemplo: jdbc:postgresql://.../unicrm?currentSchema=crm_empresaX
    public String getCurrentSchemaName() {
        // Placeholder lógico; não altera schema por ora
        String companyId = getCurrentCompanyId();
        return "crm_" + companyId; // convenção futura
    }
}