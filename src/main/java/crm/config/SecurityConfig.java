package crm.config;

import crm.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Value("${frontend.origin:http://localhost:3000}")
    private String frontendOrigin;

    @Value("${public.origin:}")
    private String publicOrigin;

    // Coloque este método temporariamente em src/main/java/crm/config/SecurityConfig.java
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // WhatsApp PUBLIC endpoints
                        .requestMatchers("/api/whatsapp/qr").permitAll()
                        .requestMatchers("/api/whatsapp/qr/image").permitAll()
                        .requestMatchers("/whatsapp/qr").permitAll()
                        .requestMatchers("/whatsapp/qr/image").permitAll()
                        .requestMatchers("/api/whatsapp/status").permitAll()
                        .requestMatchers("/api/whatsapp/stream").permitAll()
                        .requestMatchers("/api/whatsapp/webhook").permitAll()
                        .requestMatchers("/whatsapp/webhook").permitAll()

                        // WhatsApp read-only endpoints (dev convenience)
                        .requestMatchers("/api/whatsapp/conversations").permitAll()
                        .requestMatchers("/api/whatsapp/contacts").permitAll()
                        .requestMatchers("/api/whatsapp/messages/**").permitAll()
                        .requestMatchers("/whatsapp/conversations").permitAll()
                        .requestMatchers("/whatsapp/contacts").permitAll()
                        .requestMatchers("/whatsapp/messages/**").permitAll()

                        // WhatsApp basic actions (dev)
                        .requestMatchers("/api/whatsapp/send-message").permitAll()
                        .requestMatchers("/api/whatsapp/modify-chat").permitAll()
                        .requestMatchers("/whatsapp/send-message").permitAll()
                        .requestMatchers("/whatsapp/modify-chat").permitAll()

                        // Other WhatsApp endpoints require auth
                        .requestMatchers("/api/whatsapp/**").authenticated()

                        .anyRequest().permitAll()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public OncePerRequestFilter webhookLoggingFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
                String path = request.getRequestURI();
                if (path != null && path.contains("/whatsapp/webhook")) {
                    String ct = request.getContentType();
                    org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger("WEBHOOK-FILTER");
                    logger.info("[WEBHOOK FILTER] path={} contentType={}", path, ct);
                    ContentCachingRequestWrapper wrapped = new ContentCachingRequestWrapper(request);
                    filterChain.doFilter(wrapped, response);
                    byte[] buf = wrapped.getContentAsByteArray();
                    String body = (buf != null && buf.length > 0) ? new String(buf, StandardCharsets.UTF_8) : "";
                    String preview = body;
                    logger.info("[WEBHOOK FILTER] raw preview: {}", preview.substring(0, Math.min(1000, preview.length())));
                    return;
                }
                filterChain.doFilter(request, response);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Allow dev environments: any localhost port + configured origins
        java.util.List<String> originPatterns = new java.util.ArrayList<>(List.of("http://localhost:*", "http://127.0.0.1:*", frontendOrigin));
        if (publicOrigin != null && !publicOrigin.isBlank()) {
            originPatterns.add(publicOrigin);
        }
        config.setAllowedOriginPatterns(originPatterns);
        config.setAllowCredentials(true);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "ngrok-skip-browser-warning"));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
