package com.orion.assistant.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class AssistantKnowledgeService {

    private static final String KNOWLEDGE_PATH = "assistant/orion-knowledge.md";

    private volatile String cachedKnowledge;

    public String getKnowledgeBase() {
        if (cachedKnowledge == null) {
            synchronized (this) {
                if (cachedKnowledge == null) {
                    cachedKnowledge = loadKnowledge();
                }
            }
        }
        return cachedKnowledge;
    }

    private String loadKnowledge() {
        try {
            ClassPathResource resource = new ClassPathResource(KNOWLEDGE_PATH);
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "Orion v3 Nemesis back-office platformu. Bilgi tabani yuklenemedi.";
        }
    }
}
