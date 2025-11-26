package crm.controller;


import crm.model.MensagemRequest;
import crm.service.WhatsappService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/whatsapp", "/api/whatsapp"})
public class WhatsappController {

    private final WhatsappService whatsappService;

    public WhatsappController(WhatsappService whatsappService) {
        this.whatsappService = whatsappService;
    }

    @PostMapping("/enviar")
    public String enviarMensagem(@RequestBody MensagemRequest request) {
        return whatsappService.enviarMensagem(request);
    }
}
