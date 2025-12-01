package crm.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret:change-this-to-a-strong-secret-of-at-least-32-chars}")
    private String secret;

    private Key key() {
        // Defensive: ensure secret is present and long enough
        String s = secret;
        if (s == null || s.trim().length() < 32) {
            s = "dev-secret-please-change-to-strong-32+chars-key";
        }
        return Keys.hmacShaKeyFor(s.getBytes());
    }

    public String extractUsername(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // log.debug("Token inválido: {}", ex.getMessage());
            return false;
        }
    }

    public Date extractExpiration(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
        return claims.getExpiration();
    }
}