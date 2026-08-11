package com.orion.assistant.service;

import com.orion.assistant.config.AssistantProperties;
import com.orion.assistant.dto.AssistantConfirmRequest;
import com.orion.assistant.dto.AssistantConfirmResponse;
import com.orion.assistant.dto.AssistantContextDto;
import com.orion.assistant.dto.AssistantQueryRequest;
import com.orion.assistant.dto.AssistantQueryResponse;
import com.orion.assistant.dto.AssistantStatusDto;
import com.orion.assistant.tool.AssistantToolService;
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
    private final PendingActionStore pendingActionStore;
    private final AssistantToolService toolService;

    public AssistantOrchestratorService(AssistantProperties properties,
                                           AssistantKnowledgeService knowledgeService,
                                           GeminiAssistantClient geminiClient,
                                           MockAssistantResponder mockResponder,
                                           PendingActionStore pendingActionStore,
                                           AssistantToolService toolService) {
        this.properties = properties;
        this.knowledgeService = knowledgeService;
        this.geminiClient = geminiClient;
        this.mockResponder = mockResponder;
        this.pendingActionStore = pendingActionStore;
        this.toolService = toolService;
    }

    public AssistantQueryResponse query(AssistantQueryRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("Mesaj boş olamaz");
        }

        boolean executor = request.isExecutor();
        String systemPrompt = buildSystemPrompt(executor);
        AssistantContextDto context = request.getContext();

        if (properties.isGeminiConfigured()) {
            try {
                GeminiAssistantClient.GeminiResult gemini = geminiClient.chat(
                        systemPrompt,
                        request.getMessage(),
                        context,
                        request.getHistory(),
                        executor);

                if (gemini.isSuccess()) {
                    AssistantQueryResponse response = new AssistantQueryResponse();
                    response.setAnswer(gemini.getAnswer());
                    response.setMockMode(false);
                    response.setProvider("gemini:" + properties.getModel());
                    response.setAssistantMode(request.resolvedMode());
                    response.setToolCalls(gemini.getToolCalls());
                    response.setPendingAction(gemini.getPendingAction());
                    response.setSuggestedFollowUps(suggestFollowUps(context, executor));
                    return response;
                }
                log.warn("Gemini failed, falling back to mock: {}", gemini.getError());
                if (executor) {
                    return executorGeminiFailure(gemini.getError());
                }
            } catch (Exception e) {
                log.warn("Gemini error, falling back to mock: {}", e.getMessage());
                if (executor) {
                    return executorGeminiFailure(e.getMessage());
                }
            }
        }

        if (executor) {
            return executorGeminiFailure(null);
        }

        MockAssistantResponder.MockResult mock = mockResponder.respond(request.getMessage(), context);
        AssistantQueryResponse response = new AssistantQueryResponse();
        response.setAnswer(mock.getAnswer());
        response.setMockMode(true);
        response.setProvider(properties.isGeminiConfigured() ? "mock-fallback" : "mock");
        response.setAssistantMode("advisor");
        response.setToolCalls(mock.getToolCalls());
        response.setSuggestedFollowUps(mock.getSuggestedFollowUps());
        return response;
    }

    public AssistantConfirmResponse confirm(AssistantConfirmRequest request) {
        if (request.getActionId() == null || request.getActionId().isBlank()) {
            throw new IllegalArgumentException("actionId gerekli");
        }

        AssistantConfirmResponse response = new AssistantConfirmResponse();

        if (!request.isConfirmed()) {
            pendingActionStore.remove(request.getActionId());
            response.setExecuted(false);
            response.setSuccess(true);
            response.setMessage("İşlem iptal edildi.");
            return response;
        }

        var entryOpt = pendingActionStore.remove(request.getActionId());
        if (entryOpt.isEmpty()) {
            response.setExecuted(false);
            response.setSuccess(false);
            response.setMessage("Onay süresi dolmuş veya işlem bulunamadı. Lütfen isteği yeniden gönderin.");
            return response;
        }

        PendingActionStore.PendingEntry entry = entryOpt.get();
        response.setTool(entry.tool());
        AssistantToolService.ToolExecutionResult result = toolService.executeWrite(entry.tool(), entry.args());
        response.setExecuted(true);
        response.setSuccess(result.isSuccess());
        if (result.isSuccess()) {
            response.setMessage("İşlem tamamlandı: " + entry.summary()
                    + (result.getJsonPayload() != null ? "\nSonuç: " + result.getJsonPayload() : ""));
        } else {
            response.setMessage("İşlem başarısız: " + result.getError());
        }
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

    private String buildSystemPrompt(boolean executor) {
        if (executor) {
            return """
                    Sen Orion v3 Nemesis aracı kurum back-office platformunun OPERASYON YÜRÜTÜCÜSÜSÜN.
                    Aşağıdaki bilgi tabanı kaynak kod + Flyway + React ekranlarından derlenmiştir; buna güven.

                    MOD: YÜRÜTÜCÜ
                    - Kullanıcı yazma istediğinde ilgili yazma tool'unu çağır (approve/cancel/revise/pool teminat; approve/reject nakit).
                    - Yazma tool çağrısı UI onay kartına düşer; sen "ben yaptım" deme — "onay kartını kullanın" de.
                    - ID belirsizse önce read tool ile listele veya kullanıcıdan ID iste.
                    - Yalnızca v1 yazma tool'ları var; kullanıcı/CRUD oluşturma yok — o işlerde ekrana yönlendir.
                    - Canlı liste için read tool kullan; uydurma.
                    - Türkçe karakterleri doğru kullan. Kısa, net cevap ver.
                    - SQL isterse salt SELECT ver; DML yok.

                    AŞAĞIDAKİ PLATFORM BİLGİ TABANI:

                    """
                    + knowledgeService.getKnowledgeBase();
        }

        return """
                Sen Orion v3 Nemesis aracı kurum back-office platformunun OPERASYON DANIŞMANISIN.
                Aşağıdaki bilgi tabanı kaynak kod + Flyway + React ekranlarından derlenmiştir; buna güven.

                MOD: DANIŞMAN
                - SADECE danışmanlık: hangi menü/ekran path, hangi buton, hangi tablo/enum, hangi iş kuralı.
                - Hiçbir kayıt oluşturma/güncelleme/silme/onaylama YAPMA. Yazma tool'u çağırma.
                - Canlı liste/detay için read tool çağır; tool dışı canlı veri uydurma.
                - Türkçe karakterleri doğru kullan (ı, ğ, ü, ş, ö, ç, İ). Kısa, adım adım, madde işaretleri.
                - Yazma için kullanıcıyı ilgili React ekranındaki butona yönlendir VEYA Yürütücü moda geçmesini söyle.
                - SQL isterse: salt SELECT ver; DML yok. Procedure/view yok — söyle.
                - Bilgi tabanında yoksa uydurma; placeholder menülerde işlem yapılamaz.

                AŞAĞIDAKİ PLATFORM BİLGİ TABANI:

                """
                + knowledgeService.getKnowledgeBase();
    }

    private AssistantQueryResponse executorGeminiFailure(String detail) {
        AssistantQueryResponse blocked = new AssistantQueryResponse();
        StringBuilder sb = new StringBuilder();
        if (!properties.isGeminiConfigured()) {
            sb.append("Yürütücü mod için Gemini API key gerekli (`ORION_GEMINI_API_KEY`). ");
        } else {
            sb.append("Gemini şu an yanıt veremedi; Yürütücü yazma işlemleri durdu. ");
            if (detail != null && !detail.isBlank()) {
                sb.append("(").append(shortError(detail)).append(") ");
            }
        }
        sb.append("Danışman moda geçip rehberlik alabilir veya bir süre sonra tekrar deneyebilirsiniz.");
        blocked.setAnswer(sb.toString());
        blocked.setMockMode(true);
        blocked.setProvider(properties.isGeminiConfigured() ? "mock-fallback" : "mock");
        blocked.setAssistantMode("executor");
        blocked.setSuggestedFollowUps(List.of("Danışman moda geç", "Bekleyen teminat transferleri?"));
        return blocked;
    }

    private static String shortError(String detail) {
        String d = detail.replace('\n', ' ').trim();
        if (d.length() > 160) {
            return d.substring(0, 160) + "…";
        }
        return d;
    }

    private List<String> suggestFollowUps(AssistantContextDto context, boolean executor) {
        if (executor) {
            if (context != null && context.getPathname() != null && context.getPathname().contains("collateral")) {
                return List.of("BEKLEMEDE teminatları listele", "Transfer 1'i onayla");
            }
            return List.of("Bekleyen teminat transferleri?", "Bekleyen nakit talepleri?");
        }
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
