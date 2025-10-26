package crm.controller;

import crm.model.AIRequest;
import crm.model.AIResponse;
import crm.service.AIService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ia")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/sugerirResposta")
    public AIResponse sugerirResposta(@RequestBody AIRequest request) {
        return aiService.gerarResposta(request);
    }
}
