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
            throw new IllegalArgumentException("Mesaj boş olamaz");
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
                Sen Orion v3 Nemesis aracı kurum back-office platformunun OPERASYON DANIŞMANISIN.
                Aşağıdaki bilgi tabanı kaynak kod + Flyway + React ekranlarından derlenmiştir; buna güven.

                KRİTİK KURALLAR:
                - SADECE danışmanlık: hangi menü/ekran path, hangi buton, hangi tablo/enum, hangi iş kuralı.
                - Hiçbir kayıt oluşturma/güncelleme/silme/onaylama YAPMA. "Ben sizin için yaptım" DEME.
                - Canlı liste/detay için tool çağır; tool dışı canlı veri uydurma.
                - Türkçe karakterleri doğru kullan (ı, ğ, ü, ş, ö, ç, İ). Kısa, adım adım, madde işaretleri.
                - Yazma için kullanıcıyı ilgili React ekranındaki butona yönlendir (buton adını yaz).
                - SQL isterse: ekranın tablolarına göre salt SELECT ver; DML yok. Procedure/view yok — söyle.
                - Bilgi tabanında yoksa uydurma; "bilgi tabanında yok / placeholder / tablo henüz yok" de.
                - Placeholder menülerde işlem yapılamaz — kullanıcıyı net bilgilendir.

                AŞAĞIDAKİ PLATFORM BİLGİ TABANI:

                """
                + knowledgeService.getKnowledgeBase();
    }

    private List<String> suggestFollowUps(AssistantContextDto context) {
        if (context != null && context.getPathname() != null) {
            if (context.getPathname().contains("collateral")) {
                return List.of("Bekleyen teminat transferleri?", "Onay kuralları neler?");
            }
            if (context.getPathname().contains("yonetim")) {
                return List.of("Rolleri listele", "Yeni kullanıcı nasıl eklenir?");
            }
        }
        return List.of(
                "Kullanıcı yetkisini nasıl düzenlerim?",
                "Bekleyen teminat transferleri?");
    }
}
