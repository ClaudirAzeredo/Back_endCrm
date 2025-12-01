package crm.tenant;

import crm.controller.LeadController;
import crm.entity.Lead;
import crm.entity.User;
import crm.repository.UserRepository;
import crm.service.LeadService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@SpringBootTest
@Transactional
class MultiTenantIsolationTests {

    @Autowired
    private LeadService leadService;

    @Autowired
    private LeadController leadController;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUpUsers() {
        // Cria dois usuários em empresas distintas
        userA = userRepository.save(User.builder()
                .name("User A")
                .email("userA@example.com")
                .password("pwd")
                .role("employee")
                .companyId("compA")
                .build());

        userB = userRepository.save(User.builder()
                .name("User B")
                .email("userB@example.com")
                .password("pwd")
                .role("employee")
                .companyId("compB")
                .build());
    }

    private void authenticate(String email) {
        var auth = new UsernamePasswordAuthenticationToken(
                email,
                "pwd",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void leadList_isolatedByCompany() {
        // Cria leads para compA
        authenticate(userA.getEmail());
        Lead leadA1 = Lead.builder()
                .title("Empresa A - Oportunidade 1")
                .client("Cliente A")
                .clientType("juridica")
                .source("website")
                .status("novo")
                .funnelId("funnel-1")
                .priority("medium")
                .assignedToUserId(userA.getId())
                .build();
        leadService.save(leadA1);

        // Cria leads para compB
        authenticate(userB.getEmail());
        Lead leadB1 = Lead.builder()
                .title("Empresa B - Oportunidade 1")
                .client("Cliente B")
                .clientType("juridica")
                .source("website")
                .status("novo")
                .funnelId("funnel-1")
                .priority("medium")
                .assignedToUserId(userB.getId())
                .build();
        leadService.save(leadB1);

        // Lista para usuário A: só deve retornar leads de compA
        authenticate(userA.getEmail());
        var leadsA = leadService.listForCurrentTenant(null);
        Assertions.assertTrue(leadsA.stream().allMatch(l -> "compA".equals(l.getCompanyId())));
        Assertions.assertEquals(1, leadsA.size());

        // Lista para usuário B
        authenticate(userB.getEmail());
        var leadsB = leadService.listForCurrentTenant(null);
        Assertions.assertTrue(leadsB.stream().allMatch(l -> "compB".equals(l.getCompanyId())));
        Assertions.assertEquals(1, leadsB.size());
    }

    @Test
    void addInteraction_setsCreatedByAuthenticatedUser_andRespectsTenant() {
        // Criar lead em compA
        authenticate(userA.getEmail());
        Lead leadA = Lead.builder()
                .title("Lead A")
                .client("Cliente A")
                .clientType("juridica")
                .source("website")
                .status("novo")
                .funnelId("funnel-1")
                .priority("medium")
                .assignedToUserId(userA.getId())
                .build();
        leadA = leadService.save(leadA);

        // Tenta enviar 'user' diferente, mas backend deve usar usuário autenticado
        var req = new LeadController.AddInteractionRequest();
        req.type = "note";
        req.date = null; // usa agora
        req.notes = "Contato telefônico";
        req.user = userB.getId(); // deve ser ignorado

        ResponseEntity<?> resp = leadController.addInteraction(leadA.getId(), req);
        Assertions.assertEquals(201, resp.getStatusCode().value());

        // Resposta deve conter createdBy = userA.id
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) resp.getBody();
        Assertions.assertEquals(userA.getId(), body.get("createdBy"));

        // Lead persistido deve ter interação com companyId = compA
        var reloaded = leadService.findByIdForCurrentTenant(leadA.getId());
        Assertions.assertNotNull(reloaded);
        Assertions.assertFalse(reloaded.getInteractions().isEmpty());
        var interaction = reloaded.getInteractions().get(0);
        Assertions.assertEquals("compA", interaction.getCompanyId());
        Assertions.assertEquals(userA.getId(), interaction.getCreatedBy());
    }

    @Test
    void addInteraction_toOtherCompanyLead_returns404() {
        // Cria lead em compA
        authenticate(userA.getEmail());
        Lead leadA = Lead.builder()
                .title("Lead A")
                .client("Cliente A")
                .clientType("juridica")
                .source("website")
                .status("novo")
                .funnelId("funnel-1")
                .priority("medium")
                .assignedToUserId(userA.getId())
                .build();
        leadA = leadService.save(leadA);

        // Usuário B tenta adicionar interação no lead da empresa A
        authenticate(userB.getEmail());
        var req = new LeadController.AddInteractionRequest();
        req.type = "note";
        req.notes = "Tentativa inválida";

        ResponseEntity<?> resp = leadController.addInteraction(leadA.getId(), req);
        Assertions.assertEquals(404, resp.getStatusCode().value());
    }
}