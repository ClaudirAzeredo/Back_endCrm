package crm.controller;

import crm.model.ModifyChatRequest;
import crm.model.WebhookUpdateRequest;
import crm.dto.ChatPresenceDTO;
import crm.dto.MessageStatusDTO;
import crm.service.WhatsappService;
import crm.service.WhatsAppSseService;
import crm.service.WhatsAppConfigService;
import crm.service.WhatsAppMessageService;
import crm.service.WhatsAppContactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WhatsAppWebhookControllerTest {

    @Mock
    private WhatsappService whatsappService;

    @Mock
    private WhatsAppSseService sseService;

    @Mock
    private WhatsAppConfigService configService;

    @Mock
    private WhatsAppMessageService messageService;

    @Mock
    private WhatsAppContactService contactService;

    @Mock
    private WhatsAppWebhookControllerRawPersistPatch webhookDebugPersist;

    @InjectMocks
    private WhatsAppWebhookController controller;

    private ModifyChatRequest modifyChatRequest;
    private WebhookUpdateRequest webhookUpdateRequest;

    @BeforeEach
    void setUp() {
        modifyChatRequest = new ModifyChatRequest();
        modifyChatRequest.setPhone("5544999999999");
        modifyChatRequest.setAction("read");

        webhookUpdateRequest = new WebhookUpdateRequest();
        webhookUpdateRequest.setValue("https://example.com/webhook");
    }

    @Test
    void testModifyChat_Success() {
        // Given
        when(whatsappService.modifyChat(any(String.class), any(String.class))).thenReturn(true);

        // When
        ResponseEntity<?> response = controller.modifyChat(modifyChatRequest);

        // Then
        assertEquals(200, response.getStatusCodeValue());
        assertTrue((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        assertTrue((Boolean) ((Map<String, Object>) response.getBody()).get("value"));
        verify(whatsappService).modifyChat("5544999999999", "read");
    }

    @Test
    void testModifyChat_InvalidAction() {
        // Given
        modifyChatRequest.setAction("invalid");

        // When
        ResponseEntity<?> response = controller.modifyChat(modifyChatRequest);

        // Then
        assertEquals(400, response.getStatusCodeValue());
        assertFalse((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        assertEquals("Action deve ser 'read', 'unread' ou 'delete'", 
                    ((Map<String, Object>) response.getBody()).get("error"));
    }

    @Test
    void testModifyChat_MissingPhone() {
        // Given
        modifyChatRequest.setPhone(null);

        // When
        ResponseEntity<?> response = controller.modifyChat(modifyChatRequest);

        // Then
        assertEquals(400, response.getStatusCodeValue());
        assertFalse((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        assertEquals("Phone é obrigatório", 
                    ((Map<String, Object>) response.getBody()).get("error"));
    }

    @Test
    void testUpdateWebhookChatPresence_Success() {
        // Given
        when(whatsappService.updateWebhookChatPresence(any(String.class))).thenReturn(true);

        // When
        ResponseEntity<?> response = controller.updateWebhookChatPresence(webhookUpdateRequest);

        // Then
        assertEquals(200, response.getStatusCodeValue());
        assertTrue((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        verify(whatsappService).updateWebhookChatPresence("https://example.com/webhook");
    }

    @Test
    void testUpdateWebhookMessageStatus_Success() {
        // Given
        when(whatsappService.updateWebhookMessageStatus(any(String.class))).thenReturn(true);

        // When
        ResponseEntity<?> response = controller.updateWebhookMessageStatus(webhookUpdateRequest);

        // Then
        assertEquals(200, response.getStatusCodeValue());
        assertTrue((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        verify(whatsappService).updateWebhookMessageStatus("https://example.com/webhook");
    }

    @Test
    void testHandleChatPresenceWebhook_Success() {
        // Given
        ChatPresenceDTO presence = new ChatPresenceDTO();
        presence.setType("PresenceChatCallback");
        presence.setPhone("5544999999999");
        presence.setStatus("AVAILABLE");
        presence.setInstanceId("instance123");

        // When
        ResponseEntity<?> response = controller.handleChatPresenceWebhook(presence);

        // Then
        assertEquals(200, response.getStatusCodeValue());
        assertTrue((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        verify(sseService).publish(any(String.class), any(Map.class));
    }

    @Test
    void testHandleMessageStatusWebhook_Success() {
        // Given
        MessageStatusDTO status = new MessageStatusDTO();
        status.setType("MessageStatusCallback");
        status.setPhone("5544999999999");
        status.setStatus("READ");
        status.setIds(new String[]{"msg123"});
        status.setInstanceId("instance123");
        status.setIsGroup(false);

        // When
        ResponseEntity<?> response = controller.handleMessageStatusWebhook(status);

        // Then
        assertEquals(200, response.getStatusCodeValue());
        assertTrue((Boolean) ((Map<String, Object>) response.getBody()).get("success"));
        verify(sseService).publish(any(String.class), any(Map.class));
    }
}