package crm.controller;

import crm.dto.TokenPair;
import crm.entity.User;
import crm.repository.UserRepository;
import crm.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    // POST /auth/register
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody AuthService.RegisterRequest req) {
        Map<String, Object> body = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    // POST /auth/login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthService.LoginRequest req) {
        Map<String, Object> body = authService.login(req);

        // Set HttpOnly cookie with access token for browser sessions
        Object tokenObj = body.get("accessToken");
        if (tokenObj instanceof String token && !token.isBlank()) {
            ResponseCookie cookie = ResponseCookie.from("accessToken", token)
                    .httpOnly(true)
                    .secure(false) // set true in production over HTTPS
                    .path("/api")
                    .sameSite("Lax")
                    .build(); // session cookie (no maxAge)

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(body);
        }

        return ResponseEntity.ok(body);
    }

    // GET /auth/me — retorna o usuário autenticado
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        User user = getCurrentUserOrThrow();
        // Monta resposta com os campos esperados pelo frontend
        java.util.List<String> defaultModules = java.util.List.of("pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios");
        java.util.List<String> modules = (user.getModules() == null || user.getModules().isEmpty()) ? defaultModules : user.getModules();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "companyId", user.getCompanyId(),
                        "modules", modules
                )
        ));
    }

    // POST /auth/token — emite (ou reaproveita) o token permanente para o usuário autenticado
    @PostMapping("/token")
    public ResponseEntity<TokenPair> issueToken() {
        User user = getCurrentUserOrThrow();
        TokenPair pair = authService.issuePersistentToken(user);
        return ResponseEntity.ok(pair);
    }

    // POST /auth/token/validate — valida par code+secret (bool)
    @PostMapping("/token/validate")
    public ResponseEntity<Map<String, Object>> validateToken(
            @RequestParam("code") long code,
            @RequestParam("secret") String secret
    ) {
        boolean valid = authService.validatePersistentToken(code, secret);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    // POST /auth/token/revoke — revoga o token permanente do usuário autenticado
    @PostMapping("/token/revoke")
    public ResponseEntity<Void> revokeToken() {
        User user = getCurrentUserOrThrow();
        authService.revokeUserToken(user);
        return ResponseEntity.noContent().build();
    }

    // POST /auth/logout — endpoint idempotente para logout
    // Não exige autenticação estrita: se houver usuário autenticado, registra/logout lógico; sempre retorna 204.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                userRepository.findByEmail(email).ifPresent(user -> authService.logout(user.getId()));
            }
        } catch (Exception ignored) {
            // Qualquer erro é ignorado para manter logout idempotente
        }
        // Clear auth cookie
        ResponseCookie clearCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api")
                .sameSite("Lax")
                .maxAge(0)
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    // Utilitário para obter o usuário atual pelo email (subject do JWT)
    private User getCurrentUserOrThrow() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));
    }
}