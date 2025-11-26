package crm.controller;

import crm.entity.WhatsAppConfig;
import crm.service.WhatsAppConfigService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

public class WhatsAppConfigControllerTest {

    private WhatsAppConfigController newControllerWithService(WhatsAppConfigService service) throws Exception {
        WhatsAppConfigController controller = new WhatsAppConfigController();
        Field f = WhatsAppConfigController.class.getDeclaredField("service");
        f.setAccessible(true);
        f.set(controller, service);
        return controller;
    }

    private WhatsAppConfig newConfig(String baseUrl, String instanceId) {
        WhatsAppConfig cfg = new WhatsAppConfig();
        cfg.setBaseUrl(baseUrl);
        cfg.setInstanceId(instanceId);
        return cfg;
    }

    @Test
    public void testJsonQrExtractsBase64() throws Exception {
        String baseUrl = "https://api.z-api.io";
        String instanceId = "INSTANCE1";
        String token = "TOKEN1";
        String urlImage = baseUrl + "/instances/" + instanceId + "/token/" + token + "/qr-code/image";

        RestTemplate rt = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.createServer(rt);
        String payload = "{\"qrCode\":\"data:image/png;base64,QUFB\"}"; // base64 of 'AAA' -> QUFB
        server.expect(once(), requestTo(urlImage))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(payload, MediaType.APPLICATION_JSON));

        WhatsAppConfigService svc = Mockito.mock(WhatsAppConfigService.class);
        Mockito.when(svc.getCurrentCompanyConfig()).thenReturn(Optional.of(newConfig(baseUrl, instanceId)));
        Mockito.when(svc.getInstanceToken()).thenReturn(token);
        Mockito.when(svc.getApiKey()).thenReturn(null);
        Mockito.when(svc.getRestTemplate()).thenReturn(rt);

        WhatsAppConfigController controller = newControllerWithService(svc);
        ResponseEntity<String> resp = controller.getQrBytes();
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("data:image/png;base64,QUFB", resp.getBody());
        server.verify();
    }

    @Test
    public void testBinaryImageReturnsBase64() throws Exception {
        String baseUrl = "https://api.z-api.io";
        String instanceId = "INSTANCE2";
        String token = "TOKEN2";
        String urlImage = baseUrl + "/instances/" + instanceId + "/token/" + token + "/qr-code/image";

        RestTemplate rt = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.createServer(rt);
        byte[] imageBytes = new byte[] {0x01, 0x02, 0x03};
        server.expect(once(), requestTo(urlImage))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(imageBytes, MediaType.IMAGE_PNG));

        WhatsAppConfigService svc = Mockito.mock(WhatsAppConfigService.class);
        Mockito.when(svc.getCurrentCompanyConfig()).thenReturn(Optional.of(newConfig(baseUrl, instanceId)));
        Mockito.when(svc.getInstanceToken()).thenReturn(token);
        Mockito.when(svc.getApiKey()).thenReturn(null);
        Mockito.when(svc.getRestTemplate()).thenReturn(rt);

        WhatsAppConfigController controller = newControllerWithService(svc);
        ResponseEntity<String> resp = controller.getQrBytes();
        assertEquals(200, resp.getStatusCode().value());
        String expectedB64 = java.util.Base64.getEncoder().encodeToString(imageBytes);
        assertEquals("data:image/png;base64," + expectedB64, resp.getBody());
        server.verify();
    }

    @Test
    public void testTextPlainBase64ImageReturnsPlain() throws Exception {
        String baseUrl = "https://api.z-api.io";
        String instanceId = "INSTANCE4";
        String token = "TOKEN4";
        String urlImage = baseUrl + "/instances/" + instanceId + "/token/" + token + "/qr-code/image";

        RestTemplate rt = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.createServer(rt);
        String base64 = "QUFB";
        server.expect(once(), requestTo(urlImage))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(base64.getBytes(StandardCharsets.UTF_8), MediaType.TEXT_PLAIN));

        WhatsAppConfigService svc = Mockito.mock(WhatsAppConfigService.class);
        Mockito.when(svc.getCurrentCompanyConfig()).thenReturn(Optional.of(newConfig(baseUrl, instanceId)));
        Mockito.when(svc.getInstanceToken()).thenReturn(token);
        Mockito.when(svc.getApiKey()).thenReturn(null);
        Mockito.when(svc.getRestTemplate()).thenReturn(rt);

        WhatsAppConfigController controller = newControllerWithService(svc);
        ResponseEntity<String> resp = controller.getQrBytes();
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("data:image/png;base64," + base64, resp.getBody());
        server.verify();
    }

    @Test
    public void test403ClientTokenFallbackCallsWithoutHeader() throws Exception {
        String baseUrl = "https://api.z-api.io";
        String instanceId = "INSTANCE3";
        String token = "TOKEN3";
        String urlImage403 = baseUrl + "/instances/" + instanceId + "/token/" + token + "/qr-code/image";

        RestTemplate rt = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.createServer(rt);
        String errBody = "{\"error\":\"Client-Token not allowed\"}";
        server.expect(once(), requestTo(urlImage403))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(org.springframework.http.HttpStatus.FORBIDDEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errBody));

        String okPayload = "{\"base64\":\"QUFB\"}";
        server.expect(once(), requestTo(urlImage403))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(okPayload, MediaType.APPLICATION_JSON));

        WhatsAppConfigService svc = Mockito.mock(WhatsAppConfigService.class);
        Mockito.when(svc.getCurrentCompanyConfig()).thenReturn(Optional.of(newConfig(baseUrl, instanceId)));
        Mockito.when(svc.getInstanceToken()).thenReturn(token);
        Mockito.when(svc.getApiKey()).thenReturn("SOME-API-KEY");
        Mockito.when(svc.getRestTemplate()).thenReturn(rt);

        WhatsAppConfigController controller = newControllerWithService(svc);
        ResponseEntity<String> resp = controller.getQrBytes();
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("data:image/png;base64,QUFB", resp.getBody());
        server.verify();
    }
}
