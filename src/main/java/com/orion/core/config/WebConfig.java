package com.orion.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * nemesis-frontend (Vite dev server, http://localhost:5173) icin CORS
 * ayari. Sadece /api/** altina uygulanir - ZK'nin *.zul ve /zkau/*
 * yollari bundan etkilenmez. Kimlik dogrulama henuz eklenmedigi icin
 * (bkz. skill: orion-screen-migration) allowCredentials su an icin
 * kullanilmiyor; JWT eklendiginde header bazli auth kullanilacagi icin
 * de credentials'a gerek kalmayabilir.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
