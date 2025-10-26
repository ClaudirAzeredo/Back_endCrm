package crm.service;


import crm.model.MensagemRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsappService {

    private final RestTemplate restTemplate;

    // Pegando dados do application.properties
    @Value("${zapi.base-url}")
    private String zapiBaseUrl;

    @Value("${zapi.token}")
    private String zapiToken;

    public WhatsappService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String enviarMensagem(MensagemRequest request) {
        String url = zapiBaseUrl + "/message/text?token=" + zapiToken;

        Map<String, String> body = new HashMap<>();
        body.put("phone", request.getNumero());
        body.put("message", request.getMensagem());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        return response.getBody();
    }
}
