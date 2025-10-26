package crm.service;

import crm.entity.Company;
import crm.entity.RefreshToken;
import crm.entity.User;
import crm.repository.CompanyRepository;
import crm.repository.RefreshTokenRepository;
import crm.repository.UserRepository;
import crm.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final long refreshTokenTtlMs;

    public AuthService(UserRepository userRepository,
                       CompanyRepository companyRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       AuthenticationManager authenticationManager,
                       @Value("${app.refresh-token.expiration-ms}") long refreshTokenTtlMs) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.refreshTokenTtlMs = refreshTokenTtlMs;
    }

    public User register(String name, String email, String rawPassword, String phone, String companyName) {
        Company company = Company.builder().name(companyName).status("active").build();
        company = companyRepository.save(company);

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .phone(phone)
                .role("owner")
                .companyId(company.getId())
                .build();

        return userRepository.save(user);
    }

    public String login(String email, String password) {
        var userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }
        var user = userOptional.get();

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getId(), password));

        return jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole(), user.getCompanyId());
    }

    public RefreshToken createRefreshToken(String userId) {
        RefreshToken rt = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(userId)
                .expiryDate(Instant.now().plusMillis(refreshTokenTtlMs))
                .build();

        return refreshTokenRepository.save(rt);
    }

    public void logout(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}

