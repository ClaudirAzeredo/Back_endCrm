package crm.debug;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestBodyLoggingFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(RequestBodyLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        if (!(servletRequest instanceof HttpServletRequest req)) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }

        ContentCachingRequestWrapper wrapped = new ContentCachingRequestWrapper(req);
        try {
            String path = req.getRequestURI();
            String method = req.getMethod();
            log.info("[REQ-DBG] incoming {} {}", method, path);

            StringBuilder headers = new StringBuilder();
            Enumeration<String> names = req.getHeaderNames();
            while (names != null && names.hasMoreElements()) {
                String name = names.nextElement();
                headers.append(name).append("=");
                headers.append(req.getHeader(name)).append("; ");
            }
            log.debug("[REQ-DBG] headers: {}", headers.toString());

            filterChain.doFilter(wrapped, servletResponse);
        } finally {
            byte[] buf = wrapped.getContentAsByteArray();
            if (buf != null && buf.length > 0) {
                String payload = new String(buf, StandardCharsets.UTF_8);
                log.debug("[REQ-DBG] body.preview: {}", payload.length() > 2000 ? payload.substring(0, 2000) : payload);
            } else {
                log.debug("[REQ-DBG] body.preview: <empty>");
            }
        }
    }
}

