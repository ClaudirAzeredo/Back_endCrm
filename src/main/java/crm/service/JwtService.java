package crm.service;

import crm.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Serviço JWT simples baseado em HS256.
 * - Secret deve ser BASE64 (32 bytes+ após decodificação para HS256).
 * - Gera token com subject = email do usuário e algumas claims úteis.
 */
@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret; // Secret string (must be >= 32 bytes)

    @Value("${app.jwt.expiration-ms:3600000}") // 1 hora padrão (ajuste conforme necessidade)
    private long jwtExpirationMs;

    public String generateToken(User user) {
        Map<String, Object> extra = new HashMap<>();
        // Inclua o que fizer sentido no seu domínio (evite dados sensíveis)
        extra.put("uid", user.getId());
        extra.put("role", user.getRole());
        if (user.getCompanyId() != null) {
            extra.put("companyId", user.getCompanyId());
        }
        
        return generateToken(extra, user.getEmail());
    }

    public String generateToken(Map<String, Object> extraClaims, String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Valida o token (assinatura e expiração).
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isTokenValid(String token, String expectedSubject) {
        final String subject = extractUsername(token);
        return subject.equals(expectedSubject) && !isTokenExpired(token);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration != null && expiration.before(new Date());
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSigningKey() {
        // Defensive: avoid NPE/IllegalArgumentException if secret is missing/too short
        String s = secret;
        if (s == null || s.trim().length() < 32) {
            // Fallback dev secret (do not use in production). Prevents 500 during local setup.
            s = "dev-secret-please-change-to-strong-32+chars-key";
        }
        return Keys.hmacShaKeyFor(s.getBytes());
    }
}