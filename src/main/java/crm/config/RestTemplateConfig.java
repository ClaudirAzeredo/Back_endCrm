package crm.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    // Bean nomeado usado especificamente pelo AIService via @Qualifier("iaRestTemplate")
    // NÃO marcamos como @Primary aqui para evitar conflito com restTemplate
    @Bean("iaRestTemplate")
    @ConditionalOnMissingBean(name = "iaRestTemplate")
    public RestTemplate iaRestTemplate() {
        return new RestTemplate();
    }
}