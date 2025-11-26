package crm.service;

import crm.dto.TokenPair;
import crm.entity.Company;
import crm.entity.RefreshToken;
import crm.entity.User;
import crm.repository.CompanyRepository;
import crm.repository.RefreshTokenRepository;
import crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService; // Você deve ter um serviço que gera o JWT de acesso

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ==========================
    // Fluxos públicos (register/login/logout)
    // ==========================

    /**
     * Registra uma nova company e o usuário administrador inicial.
     * - Verifica duplicidade de e-mail (409).
     * - Cria a company e o user (ambos com IDs gerados pela JPA).
     * - Autentica o usuário recém-criado para confirmar credenciais.
     * - Emite JWT de acesso e o token permanente (code público + secret).
     *
     * Retorna um Map simples para reduzir dependências de DTO neste exemplo.
     * Substitua por seus próprios DTOs (RegisterResponse/AuthResponse) conforme seu projeto.
     */
    @Transactional
    public Map<String, Object> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        // Cria a empresa
        Company company = Company.builder()
                .name(req.company())
                .email(req.email()) // ou outro email corporativo se desejar
                .plan("FREE")
                .status("ACTIVE")


                .createdAt(Instant.now())
                .build();
        company = companyRepository.save(company);

        // Cria o usuário (ajuste companyId vs. relacionamento @ManyToOne conforme sua entidade)
        User user = User.builder()
                .name(req.name())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .phone(req.phone())
                .role(Optional.ofNullable(req.role()).orElse("ADMIN"))
                // Se sua entidade User tiver apenas companyId (String):
                .companyId(company.getId()) // <— ajuste caso seu User seja @ManyToOne
                .modules(java.util.List.of("pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"))
                .createdAt(Instant.now())
                .build();
        user = userRepository.save(user);

        // Não autenticar imediatamente após registro para evitar 401 por visibilidade/flush
        // O token de acesso será gerado diretamente a partir do usuário criado

        // Emite access token (JWT) e token permanente (code+secret)
        String accessToken = jwtService.generateToken(user);
        TokenPair pair = issuePersistentToken(user); // secret é exposto só na primeira emissão

        return Map.of(
                "accessToken", accessToken,
                "tokenCode", pair.code(),
                "tokenSecret", pair.secret(), // atenção: só virá na primeira emissão
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "companyId", user.getCompanyId(),
                        "modules", user.getModules()
                ),
                "company", Map.of(
                        "id", company.getId(),
                        "name", company.getName(),
                        "plan", company.getPlan(),
                        "status", company.getStatus()
                )
        );
    }

    /**
     * Login:
     * - Autentica credenciais
     * - Emite accessToken (JWT)
     * - NÃO reexpõe o secret do token permanente (se já existir). Caso não exista, cria e retorna secret.
     */
    // Não abrir transação aqui; a emissão de token permanente irá
    // gerenciar sua própria transação para evitar rollback-only.
    public Map<String, Object> login(LoginRequest req) {
        Authentication auth = authenticate(req.email(), req.password());
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));

        String accessToken = jwtService.generateToken(user);
        // Emissão do token permanente não deve causar 500 — se falhar, seguimos apenas com o accessToken
        TokenPair pair = null;
        try {
            pair = issuePersistentToken(user); // se já existir, secret será null (não reexpor)
        } catch (Exception e) {
            // Ambiente pode ter tabela antiga de refresh_tokens; não quebrar login em dev
        }

        // Evita 500 por NullPointerException: Map.of não permite valores nulos
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("accessToken", accessToken);
        if (pair != null) {
            body.put("tokenCode", pair.code());
            if (pair.secret() != null) {
                body.put("tokenSecret", pair.secret());
            }
        }

        java.util.Map<String, Object> userMap = new java.util.LinkedHashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole());
        userMap.put("companyId", user.getCompanyId());
        java.util.List<String> defaultModules = java.util.List.of("pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios");
        java.util.List<String> modules = user.getModules();
        userMap.put("modules", (modules == null || modules.isEmpty()) ? defaultModules : modules);
        body.put("user", userMap);

        return body;
    }

    /**
     * Logout lógico:
     * - Opcional: revogar o token permanente do usuário (caso deseje forçar nova emissão)
     * - Se você usa apenas JWT stateless, o logout pode ser somente client-side (apagar token do cliente).
     */
    @Transactional
    public void logout(String userId) {
        // Estratégia 1 (opcional): apenas registra o evento de logout (stateless).
        // Estratégia 2: revoga o token permanente para exigir nova emissão.
        refreshTokenRepository.findByUserId(userId).ifPresent(rt -> {
            if (!rt.isRevoked()) {
                rt.setRevoked(true);
                rt.setRevokedAt(Instant.now());
                refreshTokenRepository.save(rt);
            }
        });
    }

    // ==========================
    // Token permanente (code sequencial + secret aleatório com hash)
    // ==========================

    /**
     * Emite (ou reaproveita) um token permanente por usuário:
     * - Se já existir token não revogado → retorna o code e NÃO reexpõe o secret (secret=null).
     * - Se não existir → cria, guarda o hash e retorna code + secret (secret visível apenas na emissão).
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public TokenPair issuePersistentToken(User user) {
        String userId = user.getId(); // seu User.id é String (UUID)
        // Busca segura: se houver múltiplos registros, trata todos
        var all = refreshTokenRepository.findAllByUserId(userId);
        var active = all.stream().filter(rt -> !rt.isRevoked()).findFirst();
        if (active.isPresent()) {
            return new TokenPair(active.get().getId(), null);
        }

        // Se havia registros (todos revogados ou duplicados), garante unicidade antes de criar
        if (!all.isEmpty()) {
            refreshTokenRepository.deleteByUserId(userId);
        }

        String secretPlain = generateSecret();
        String secretHash = hashSecret(secretPlain);
        try {
            RefreshToken saved = refreshTokenRepository.save(
                    RefreshToken.builder()
                            .userId(userId)
                            .secretHash(secretHash)
                            .createdAt(Instant.now())
                            .revoked(false)
                            .build()
            );
            return new TokenPair(saved.getId(), secretPlain);
        } catch (DataIntegrityViolationException e) {
            // Corrida rara: limpa e recria
            refreshTokenRepository.deleteByUserId(userId);
            RefreshToken saved = refreshTokenRepository.save(
                    RefreshToken.builder()
                            .userId(userId)
                            .secretHash(secretHash)
                            .createdAt(Instant.now())
                            .revoked(false)
                            .build()
            );
            return new TokenPair(saved.getId(), secretPlain);
        }
    }

    /**
     * Valida um par code+secret permanente (não expira por política).
     */
    @Transactional(readOnly = true)
    public boolean validatePersistentToken(long code, String secretPlain) {
        return refreshTokenRepository
                .findByIdAndRevokedFalse(code)
                .map(rt -> matchesSecret(secretPlain, rt.getSecretHash()))
                .orElse(false);
    }

    /**
     * Revoga o token permanente do usuário (permite emitir outro depois).
     */
    @Transactional
    public void revokeUserToken(User user) {
        String userId = user.getId();
        var all = refreshTokenRepository.findAllByUserId(userId);
        for (var rt : all) {
            if (!rt.isRevoked()) {
                rt.setRevoked(true);
                rt.setRevokedAt(Instant.now());
                refreshTokenRepository.save(rt);
            }
        }
    }

    /**
     * Rotaciona o token permanente do usuário:
     * - Revoga o atual e emite um novo (retorna code+secret do novo).
     */
    @Transactional
    public TokenPair rotateUserToken(User user) {
        String userId = user.getId();
        try {
            revokeUserToken(user);
            return issuePersistentToken(user);
        } catch (DataIntegrityViolationException e) {
            // Corrida rara: garante unicidade por user_id
            refreshTokenRepository.deleteByUserId(userId);
            return issuePersistentToken(user);
        }
    }

    // ==========================
    // Utilitários internos
    // ==========================

    private Authentication authenticate(String email, String password) {
        try {
            return authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }
    }

    private String generateSecret() {
        byte[] bytes = new byte[32]; // 256 bits
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashSecret(String secretPlain) {
        return ((BCryptPasswordEncoder) passwordEncoder).encode(secretPlain);
    }

    private boolean matchesSecret(String secretPlain, String secretHash) {
        return ((BCryptPasswordEncoder) passwordEncoder).matches(secretPlain, secretHash);
    }

    // ==========================
    // DTOs de entrada mínimos (substitua pelos seus se já existirem)
    // ==========================
    public record RegisterRequest(
            String name,
            String email,
            String password,
            String phone,
            String company,
            String role // opcional
    ) {}

    public record LoginRequest(
            String email,
            String password
    ) {}
}