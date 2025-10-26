package crm.service;


import crm.model.AIRequest;
import crm.model.AIResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIService {

    private final RestTemplate restTemplate;

    @Value("${gptmaker.base-url}")
    private String gptBaseUrl;

    @Value("${gptmaker.token}")
    private String gptToken;

    public AIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AIResponse gerarResposta(AIRequest request) {
        String url = gptBaseUrl + "/generate";

        Map<String, String> body = new HashMap<>();
        body.put("prompt", request.getPergunta());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + gptToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        String resposta = response.getBody().get("text").toString();
        return new AIResponse(resposta);
    }
}
