package crm.service;

import crm.entity.WhatsAppConfig;
import crm.repository.WhatsAppConfigRepository;
import crm.security.CryptoUtil;
import crm.tenant.TenantResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WhatsappServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private WhatsAppConfigRepository repository;

    @Mock
    private CryptoUtil cryptoUtil;

    @Mock
    private TenantResolver tenantResolver;

    @InjectMocks
    private WhatsappService whatsappService;

    private WhatsAppConfig config;

    @BeforeEach
    void setUp() {
        config = new WhatsAppConfig();
        config.setInstanceId("instance123");
        config.setInstanceTokenEncrypted("encrypted_token");
        config.setApiKeyEncrypted("encrypted_api_key");
        config.setBaseUrl("https://api.z-api.io/instances/instance123");
    }

    @Test
    void testModifyChat_Success() {
        // Given
        when(tenantResolver.getCurrentCompanyId()).thenReturn("company123");
        when(repository.findByCompanyId("company123")).thenReturn(Optional.of(config));
        when(cryptoUtil.decrypt("encrypted_token")).thenReturn("token123");
        when(cryptoUtil.decrypt("encrypted_api_key")).thenReturn("api_key123");
        
        String responseBody = "{\"value\": true}";
        ResponseEntity<String> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        boolean result = whatsappService.modifyChat("5544999999999", "read");

        // Then
        assertTrue(result);
        verify(restTemplate).postForEntity(
                eq("https://api.z-api.io/instances/instance123/token/token123/modify-chat"),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void testModifyChat_Failure() {
        // Given
        when(tenantResolver.getCurrentCompanyId()).thenReturn("company123");
        when(repository.findByCompanyId("company123")).thenReturn(Optional.of(config));
        when(cryptoUtil.decrypt("encrypted_token")).thenReturn("token123");
        when(cryptoUtil.decrypt("encrypted_api_key")).thenReturn("api_key123");
        
        String responseBody = "{\"value\": false}";
        ResponseEntity<String> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        boolean result = whatsappService.modifyChat("5544999999999", "read");

        // Then
        assertFalse(result);
    }

    @Test
    void testUpdateWebhookChatPresence_Success() {
        // Given
        when(tenantResolver.getCurrentCompanyId()).thenReturn("company123");
        when(repository.findByCompanyId("company123")).thenReturn(Optional.of(config));
        when(cryptoUtil.decrypt("encrypted_token")).thenReturn("token123");
        when(cryptoUtil.decrypt("encrypted_api_key")).thenReturn("api_key123");
        
        ResponseEntity<String> responseEntity = new ResponseEntity<>("", HttpStatus.OK);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.PUT), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        boolean result = whatsappService.updateWebhookChatPresence("https://example.com/webhook");

        // Then
        assertTrue(result);
        verify(restTemplate).exchange(
                eq("https://api.z-api.io/instances/instance123/token/token123/update-webhook-chat-presence"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void testUpdateWebhookMessageStatus_Success() {
        // Given
        when(tenantResolver.getCurrentCompanyId()).thenReturn("company123");
        when(repository.findByCompanyId("company123")).thenReturn(Optional.of(config));
        when(cryptoUtil.decrypt("encrypted_token")).thenReturn("token123");
        when(cryptoUtil.decrypt("encrypted_api_key")).thenReturn("api_key123");
        
        ResponseEntity<String> responseEntity = new ResponseEntity<>("", HttpStatus.OK);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.PUT), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        boolean result = whatsappService.updateWebhookMessageStatus("https://example.com/webhook");

        // Then
        assertTrue(result);
        verify(restTemplate).exchange(
                eq("https://api.z-api.io/instances/instance123/token/token123/update-webhook-status"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void testModifyChat_ConfigNotFound() {
        // Given
        when(tenantResolver.getCurrentCompanyId()).thenReturn("company123");
        when(repository.findByCompanyId("company123")).thenReturn(Optional.empty());

        // When/Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            whatsappService.modifyChat("5544999999999", "read");
        });
        assertEquals("Config not found for company", exception.getMessage());
    }
}