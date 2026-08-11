package com.orion.assistant.service;

import com.orion.assistant.config.AssistantProperties;
import com.orion.assistant.dto.AssistantContextDto;
import com.orion.assistant.dto.AssistantQueryRequest;
import com.orion.assistant.dto.AssistantQueryResponse;
import com.orion.assistant.dto.AssistantStatusDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssistantOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(AssistantOrchestratorService.class);

    private final AssistantProperties properties;
    private final AssistantKnowledgeService knowledgeService;
    private final GeminiAssistantClient geminiClient;
    private final MockAssistantResponder mockResponder;

    public AssistantOrchestratorService(AssistantProperties properties,
                                           AssistantKnowledgeService knowledgeService,
                                           GeminiAssistantClient geminiClient,
                                           MockAssistantResponder mockResponder) {
        this.properties = properties;
        this.knowledgeService = knowledgeService;
        this.geminiClient = geminiClient;
        this.mockResponder = mockResponder;
    }

    public AssistantQueryResponse query(AssistantQueryRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("Mesaj bos olamaz");
        }

        String systemPrompt = buildSystemPrompt();
        AssistantContextDto context = request.getContext();

        if (properties.isGeminiConfigured()) {
            try {
                GeminiAssistantClient.GeminiResult gemini = geminiClient.chat(
                        systemPrompt,
                        request.getMessage(),
                        context,
                        request.getHistory());

                if (gemini.isSuccess()) {
                    AssistantQueryResponse response = new AssistantQueryResponse();
                    response.setAnswer(gemini.getAnswer());
                    response.setMockMode(false);
                    response.setProvider("gemini:" + properties.getModel());
                    response.setToolCalls(gemini.getToolCalls());
                    response.setSuggestedFollowUps(suggestFollowUps(context));
                    return response;
                }
                log.warn("Gemini failed, falling back to mock: {}", gemini.getError());
            } catch (Exception e) {
                log.warn("Gemini error, falling back to mock: {}", e.getMessage());
            }
        }

        MockAssistantResponder.MockResult mock = mockResponder.respond(request.getMessage(), context);
        AssistantQueryResponse response = new AssistantQueryResponse();
        response.setAnswer(mock.getAnswer());
        response.setMockMode(true);
        response.setProvider(properties.isGeminiConfigured() ? "mock-fallback" : "mock");
        response.setToolCalls(mock.getToolCalls());
        response.setSuggestedFollowUps(mock.getSuggestedFollowUps());
        return response;
    }

    public AssistantStatusDto status() {
        AssistantStatusDto dto = new AssistantStatusDto();
        dto.setEnabled(properties.isEnabled());
        dto.setGeminiConfigured(properties.isGeminiConfigured());
        dto.setModel(properties.getModel());
        dto.setMode(properties.isGeminiConfigured() ? "gemini" : "mock");
        return dto;
    }

    private String buildSystemPrompt() {
        return """
                Sen Orion v3 Nemesis araci kurum back-office platformunun OPERASYON DANISMANISIN.

                KRITIK KURALLAR:
                - SADECE danismanlik yap: hangi ekrana gidilecegi, hangi butona basilacagi, hangi tabloda ne oldugunu acikla.
                - Hicbir kayit olusturma, guncelleme, silme veya onaylama YAPMA. "Ben sizin icin yaptim" DEME.
                - Canli veri gerekiyorsa tool cagir; tool sonucu disinda veri uydurma.
                - Turkce, net, adim adim yaz. Kisa paragraflar ve madde isaretleri kullan.
                - Yazma islemleri icin kullaniciyi ilgili React ekranindaki butona yonlendir.

                ASAGIDAKI PLATFORM BILGI TABANI:

                """
                + knowledgeService.getKnowledgeBase();
    }

    private List<String> suggestFollowUps(AssistantContextDto context) {
        if (context != null && context.getPathname() != null) {
            if (context.getPathname().contains("collateral")) {
                return List.of("Bekleyen teminat transferleri?", "Onay kurallari neler?");
            }
            if (context.getPathname().contains("yonetim")) {
                return List.of("Rolleri listele", "Yeni kullanici nasil eklenir?");
            }
        }
        return List.of(
                "Kullanici yetkisini nasil duzenlerim?",
                "Bekleyen teminat transferleri?");
    }
}
