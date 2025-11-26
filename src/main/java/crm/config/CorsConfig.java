package crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsConfig {

    @Value("${frontend.origin:http://localhost:3000}")
    private String frontendOrigin;

    @Value("${public.origin:}")
    private String publicOrigin;

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        // para debug você pode usar List.of("*") — não use em produção
        java.util.List<String> origins = new java.util.ArrayList<>();
        if (frontendOrigin != null && !frontendOrigin.isBlank()) {
            for (String o : frontendOrigin.split(",")) {
                String v = o.trim();
                if (!v.isBlank()) origins.add(v);
            }
        }
        if (publicOrigin != null && !publicOrigin.isBlank()) {
            for (String o : publicOrigin.split(",")) {
                String v = o.trim();
                if (!v.isBlank()) origins.add(v);
            }
        }
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "ngrok-skip-browser-warning"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}