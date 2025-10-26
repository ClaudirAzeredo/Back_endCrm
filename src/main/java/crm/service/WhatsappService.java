package crm.service;

import crm.model.MensagemRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;


import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsappService {

    private final RestTemplate restTemplate;

    @Value("${zapi.base-url}")
    private String zapiBaseUrl;

    @Value("${zapi.token}")
    private String zapiToken;

    public WhatsappService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void validateConfig() {
        if (zapiBaseUrl == null || zapiBaseUrl.isBlank()) {
            throw new IllegalStateException("zapi.base-url not configured");
        }
        if (zapiToken == null || zapiToken.isBlank()) {
            throw new IllegalStateException("zapi.token not configured");
        }
    }

    public String enviarMensagem(MensagemRequest request) {
        String url = zapiBaseUrl + "/message/text?token=" + zapiToken;

        Map<String, String> body = new HashMap<>();
        body.put("phone", request.getNumero());
        body.put("message", request.getMensagem());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response == null || response.getBody() == null) {
                throw new RestClientException("Empty response from WhatsApp API");
            }
            return response.getBody();
        } catch (RestClientException ex) {
            // logar e re-lançar ou retornar mensagem amigável — ajuste conforme sua política de erros
            throw new RuntimeException("Erro ao enviar mensagem via Z-API: " + ex.getMessage(), ex);
        }
    }
}