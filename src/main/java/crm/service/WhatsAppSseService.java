package crm.service;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class WhatsAppSseService {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String clientKey) {
        String key = clientKey == null || clientKey.isBlank() ? "global" : clientKey.trim();
        SseEmitter emitter = new SseEmitter(0L);
        emitter.onCompletion(() -> removeEmitter(key, emitter));
        emitter.onTimeout(() -> removeEmitter(key, emitter));
        emitter.onError((ex) -> removeEmitter(key, emitter));
        emitters.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>()).add(emitter);
        try {
            SseEmitter.SseEventBuilder evt = SseEmitter.event()
                    .name("init")
                    .data(Map.of("ok", true, "ts", Instant.now().toString()))
                    .id(String.valueOf(System.nanoTime()))
                    .reconnectTime(3000);
            emitter.send(evt);
        } catch (IOException ignore) {}
        return emitter;
    }

    public void publish(String clientKey, Object data) {
        String key = clientKey == null || clientKey.isBlank() ? "global" : clientKey.trim();
        List<SseEmitter> list = emitters.get(key);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter em : list) {
            try {
                em.send(SseEmitter.event()
                        .name("message")
                        .data(data, MediaType.APPLICATION_JSON)
                        .id(String.valueOf(System.nanoTime()))
                        .reconnectTime(3000));
            } catch (IOException ex) {
                removeEmitter(key, em);
            }
        }
    }

    private void removeEmitter(String key, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(key);
        if (list != null) list.remove(emitter);
    }
}

