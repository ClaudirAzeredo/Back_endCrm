package crm.controller;

import crm.entity.User;
import crm.entity.JobTitle;
import crm.service.UserService;
import crm.service.JobTitleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import crm.tenant.TenantResolver;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JobTitleService jobTitleService;
    private final TenantResolver tenantResolver;

    public UserController(UserService userService, PasswordEncoder passwordEncoder, JobTitleService jobTitleService, TenantResolver tenantResolver) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jobTitleService = jobTitleService;
        this.tenantResolver = tenantResolver;
    }

    @GetMapping
    public ResponseEntity<List<User>> listAll(@RequestParam(value = "companyId", required = false) String companyId) {
        // Multi-tenant: sempre lista usuários da empresa do usuário autenticado
        String currentCompanyId = tenantResolver.getCurrentCompanyId();
        List<User> users = userService.userRepository.findAllByCompanyId(currentCompanyId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable String id) {
        var user = userService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/modules")
    public ResponseEntity<Map<String, Object>> updateModules(@PathVariable String id, @RequestBody List<String> modules) {
        var user = userService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();
        user.setModules(modules);
        userService.save(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "jobTitleId", user.getJobTitleId(),
                        "companyId", user.getCompanyId(),
                        "modules", user.getModules()
                )
        ));
    }

    // Criar novo usuário vinculado a uma empresa existente
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody CreateUserRequest req) {
        List<String> errors = new ArrayList<>();
        if (req.name == null || req.name.isBlank()) errors.add("Nome é obrigatório");
        if (req.email == null || req.email.isBlank()) errors.add("Email é obrigatório");
        if (req.password == null || req.password.isBlank()) errors.add("Senha é obrigatória");
        // companyId não deve vir do frontend; será definido pelo backend

        if (!errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "errors", errors));
        }

        if (userService.userRepository.existsByEmailIgnoreCase(req.email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("success", false, "error", "Email já cadastrado"));
        }

        // Resolve role from jobTitle if provided
        String resolvedRole = (req.role == null || req.role.isBlank()) ? "employee" : req.role;
        if (req.jobTitleId != null && !req.jobTitleId.isBlank()) {
            JobTitle jt = jobTitleService.findById(req.jobTitleId);
            if (jt == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Cargo (jobTitleId) não encontrado"));
            }
            String currentCompanyId = tenantResolver.getCurrentCompanyId();
            if (jt.getCompanyId() != null && !jt.getCompanyId().equals(currentCompanyId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Cargo pertence a outra empresa"));
            }
            resolvedRole = jt.getSystemRole();
        }

        String currentCompanyId = tenantResolver.getCurrentCompanyId();
        var user = User.builder()
                .name(req.name)
                .email(req.email)
                .password(passwordEncoder.encode(req.password))
                .phone(req.phone)
                .role(resolvedRole)
                .companyId(currentCompanyId)
                .jobTitleId(req.jobTitleId)
                .modules((req.modules == null || req.modules.isEmpty()) ? List.of("pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios") : req.modules)
                .build();
        userService.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "jobTitleId", user.getJobTitleId(),
                        "companyId", user.getCompanyId(),
                        "modules", user.getModules()
                )
        ));
    }

    // Atualizar campos básicos de um usuário
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable String id, @RequestBody UpdateUserRequest req) {
        var user = userService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();

        if (req.name != null) user.setName(req.name);
        if (req.phone != null) user.setPhone(req.phone);
        if (req.jobTitleId != null && !req.jobTitleId.isBlank()) {
            JobTitle jt = jobTitleService.findById(req.jobTitleId);
            if (jt == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Cargo (jobTitleId) não encontrado"));
            }
            // If user has company, ensure jobTitle company matches
            if (jt.getCompanyId() != null && user.getCompanyId() != null && !jt.getCompanyId().equals(user.getCompanyId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Cargo pertence a outra empresa"));
            }
            user.setJobTitleId(req.jobTitleId);
            user.setRole(jt.getSystemRole());
        } else if (req.role != null) {
            // Allow updating role only when no jobTitleId change is provided
            user.setRole(req.role);
        }
        if (req.modules != null && !req.modules.isEmpty()) user.setModules(req.modules);
        if (req.password != null && !req.password.isBlank()) user.setPassword(passwordEncoder.encode(req.password));

        userService.save(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "jobTitleId", user.getJobTitleId(),
                        "companyId", user.getCompanyId(),
                        "modules", user.getModules()
                )
        ));
    }

    // Excluir usuário
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        var user = userService.findById(id);
        if (user == null) return ResponseEntity.notFound().build();
        userService.userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // DTOs mínimos para criação/atualização
    public static class CreateUserRequest {
        public String name;
        public String email;
        public String password;
        public String phone;
        public String role;
        public String companyId;
        public String jobTitleId;
        public List<String> modules;
    }

    public static class UpdateUserRequest {
        public String name;
        public String password;
        public String phone;
        public String role;
        public String jobTitleId;
        public List<String> modules;
    }
}

