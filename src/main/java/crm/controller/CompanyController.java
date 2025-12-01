package crm.controller;

import crm.entity.Company;
import crm.repository.CompanyRepository;
import crm.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Collections;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public CompanyController(CompanyRepository companyRepository, UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Company>> listAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }

        String email = authentication.getName();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado");
        }

        String companyId = userOpt.get().getCompanyId();
        if (companyId == null || companyId.isBlank()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        Optional<Company> company = companyRepository.findById(companyId);
        return ResponseEntity.ok(company.map(Collections::singletonList).orElseGet(Collections::emptyList));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Company> get(@PathVariable String id) {
        return companyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}