package crm.controller;

import crm.entity.RefreshToken;
import crm.entity.User;
import crm.service.AuthService;
import crm.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        var user = authService.register(
                body.get("name"),
                body.get("email"),
                body.get("password"),
                body.get("phone"),
                body.get("company")
        );
        var token = authService.login(user.getEmail(), body.get("password"));
        var refreshToken = authService.createRefreshToken(user.getId());

        return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "user", user,
                "token", token,
                "refreshToken", refreshToken.getToken()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String token = authService.login(body.get("email"), body.get("password"));
        var user = userService.findByEmail(body.get("email"));
        var refreshToken = authService.createRefreshToken(user.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "user", user,
                "token", token,
                "refreshToken", refreshToken.getToken()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Not authenticated"));
        }
        String userId = authentication.getName();
        authService.logout(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Logout realizado com sucesso"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String userId = authentication.getName();
        var user = userService.findById(userId);
        return ResponseEntity.ok(user);
    }
}

