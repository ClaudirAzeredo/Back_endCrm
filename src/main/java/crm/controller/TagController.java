package crm.controller;

import crm.entity.Tag;
import crm.repository.TagRepository;
import crm.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tags")
public class TagController {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    public TagController(TagRepository tagRepository, UserRepository userRepository) {
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
    }

    private String getCurrentCompanyId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(u -> u.getCompanyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));
    }

    @GetMapping
    public ResponseEntity<List<Tag>> listTags() {
        String companyId = getCurrentCompanyId();
        if (companyId == null) {
             return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(tagRepository.findAllByCompanyId(companyId));
    }

    @PostMapping
    public ResponseEntity<?> createTag(@RequestBody Map<String, String> body) {
        String companyId = getCurrentCompanyId();
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        }

        if (tagRepository.findByCompanyIdAndNameIgnoreCase(companyId, name).isPresent()) {
             return ResponseEntity.status(409).body(Map.of("error", "Tag with this name already exists"));
        }

        Tag tag = Tag.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .color(body.getOrDefault("color", "#3b82f6"))
                .description(body.get("description"))
                .companyId(companyId)
                .createdAt(Instant.now())
                .build();
        
        return ResponseEntity.ok(tagRepository.save(tag));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTag(@PathVariable String id, @RequestBody Map<String, String> body) {
        String companyId = getCurrentCompanyId();
        return tagRepository.findById(id).map(tag -> {
            if (companyId != null && !companyId.equals(tag.getCompanyId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (body.containsKey("name")) tag.setName(body.get("name"));
            if (body.containsKey("color")) tag.setColor(body.get("color"));
            if (body.containsKey("description")) tag.setDescription(body.get("description"));
            return ResponseEntity.ok(tagRepository.save(tag));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTag(@PathVariable String id) {
        String companyId = getCurrentCompanyId();
        return tagRepository.findById(id).map(tag -> {
             if (companyId != null && !companyId.equals(tag.getCompanyId())) {
                 return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
             }
            tagRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
