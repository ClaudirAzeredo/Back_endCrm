package crm.migration;

import crm.entity.Company;
import crm.entity.User;
import crm.repository.CompanyRepository;
import crm.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class CreateAdminUserRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public CreateAdminUserRunner(UserRepository userRepository, CompanyRepository companyRepository) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        String email = "dev.tester@example.com";
        if (userRepository.existsByEmail(email)) {
            System.out.println("[CreateAdminUserRunner] User " + email + " already exists.");
            return;
        }

        System.out.println("[CreateAdminUserRunner] Creating admin user: " + email);

        Company company = Company.builder()
                .name("UniCRM Demo")
                .email("contact@unicrm.com")
                .plan("PRO")
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build();
        company = companyRepository.save(company);

        User user = User.builder()
                .name("Developer Tester")
                .email(email)
                .password(passwordEncoder.encode("Passw0rd!"))
                .role("ADMIN")
                .companyId(company.getId())
                .modules(List.of("pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"))
                .createdAt(Instant.now())
                .build();
        userRepository.save(user);

        System.out.println("[CreateAdminUserRunner] User created successfully.");
    }
}
