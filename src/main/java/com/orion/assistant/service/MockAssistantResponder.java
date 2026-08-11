package com.orion.assistant.service;

import com.orion.assistant.dto.AssistantContextDto;
import com.orion.assistant.dto.ToolCallRecordDto;
import com.orion.assistant.tool.AssistantToolService;
import com.orion.assistant.util.AssistantSqlHints;
import com.orion.assistant.util.TurkishText;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Keyword + tool fallback when Gemini API key is not configured.
 */
@Service
public class MockAssistantResponder {

    private static final Pattern ID_PATTERN = Pattern.compile("\\b(\\d{1,12})\\b");

    private final AssistantToolService toolService;

    public MockAssistantResponder(AssistantToolService toolService) {
        this.toolService = toolService;
    }

    public MockResult respond(String message, AssistantContextDto context) {
        List<ToolCallRecordDto> toolCalls = new ArrayList<>();

        // SQL isteği UI rehberinden önce ele alınır (ör. "Yönetim Paneli hangi tablolardan..." + sql sorgusu ver)
        if (AssistantSqlHints.isSqlQueryRequest(message)) {
            String pathname = context != null ? context.getPathname() : null;
            return MockResult.ok(
                    AssistantSqlHints.resolve(message, pathname),
                    toolCalls,
                    List.of(
                            "Teminat modülü için örnek SQL ver",
                            "Nakit işlemleri için SELECT sorgusu"));
        }

        if (TurkishText.containsAnyNormalized(message, "yetki", "rol", "kullanıcı", "kullanici", "yönetim", "yonetim")
                && !TurkishText.containsAnyNormalized(message, "sql", "sorgu", "tablo", "veritaban")) {
            return MockResult.ok(buildUserPermissionAnswer(), toolCalls, List.of(
                    "Sistemde hangi roller tanımlı?",
                    "Aktif kullanıcıları listele"));
        }

        if (TurkishText.containsAnyNormalized(message, "teminat", "transfer", "collateral", "onay")) {
            Long id = extractId(message, context);
            if (id != null) {
                AssistantToolService.ToolExecutionResult r = toolService.execute(
                        "getCollateralTransferById", Map.of("id", id));
                toolCalls.add(record("getCollateralTransferById", Map.of("id", id), r));
                if (r.isSuccess() && r.getRecordCount() > 0) {
                    return MockResult.ok(
                            "Transfer #" + id + " için canlı veri çekildi.\n\n"
                                    + "**Durum kuralları:** Sadece `BEKLEMEDE` talepler onaylanabilir.\n"
                                    + "Onay için **Teminat Onay Ekranı** (`/collateral/onay`) → satırı seç → **Onayla**.\n\n"
                                    + "Tool sonucu (özet): " + truncate(r.getJsonPayload(), 800),
                            toolCalls,
                            List.of("Bekleyen tüm teminat transferleri?", "Bu transferi neden reddedemem?"));
                }
            }
            AssistantToolService.ToolExecutionResult pending = toolService.execute(
                    "listCollateralTransfers", Map.of("durum", "BEKLEMEDE"));
            toolCalls.add(record("listCollateralTransfers", Map.of("durum", "BEKLEMEDE"), pending));
            return MockResult.ok(
                    "**Teminat akışı:** Teminat İşlemleri'nde talep oluşturulur → `BEKLEMEDE` → Teminat Onay Ekranı'nda onaylanır.\n\n"
                            + "Şu an **" + pending.getRecordCount() + "** adet BEKLEMEDE transfer var.\n"
                            + "Detay için transfer ID yazın veya Onay ekranına gidin.",
                    toolCalls,
                    List.of("12345 nolu transferin durumu?", "Onay ekranı hangi butonlar?"));
        }

        if (TurkishText.containsAnyNormalized(message, "nakit", "cash")) {
            AssistantToolService.ToolExecutionResult r = toolService.execute(
                    "listCashTransactionRequests", Map.of("durum", "BEKLEMEDE"));
            toolCalls.add(record("listCashTransactionRequests", Map.of("durum", "BEKLEMEDE"), r));
            return MockResult.ok(
                    "**Nakit İşlem Giriş** ekranı: `/cash/islem-giris`\n"
                            + "Tablo: `cash_transaction_requests`. BEKLEMEDE talep sayısı: **"
                            + r.getRecordCount() + "**.\n"
                            + "Yeni talep: formu doldur → kaydet. Onay akışı ekrandaki ilgili butonlardan.",
                    toolCalls,
                    List.of("Nakit talep durumları neler?"));
        }

        if (TurkishText.containsAnyNormalized(message, "görev", "gorev", "workflow", "süreç", "surec")) {
            AssistantToolService.ToolExecutionResult r = toolService.execute("listOpenWorkflowTasks", Map.of());
            toolCalls.add(record("listOpenWorkflowTasks", Map.of(), r));
            return MockResult.ok(
                    "**Görev Listesi:** `/workflow/gorev-listesi`\n"
                            + "Açık görev sayısı (demo kullanıcı admin): **" + r.getRecordCount() + "**.",
                    toolCalls,
                    List.of("CashTransfer süreci nedir?"));
        }

        return MockResult.ok(
                "Orion operasyon danışmanıyım — **salt okuma/rehberlik** modundayım; kayıt değiştiremem.\n\n"
                        + "Örnek sorular:\n"
                        + "- Kullanıcı yetkisini nasıl düzenlerim?\n"
                        + "- Bekleyen teminat transferleri var mı?\n"
                        + "- Nakit işlem talebi nasıl açılır?\n\n"
                        + "Gemini API key tanımlanırsa (`ORION_GEMINI_API_KEY`) daha zengin cevaplar üretirim.",
                toolCalls,
                List.of("Kullanıcı yetkisini nasıl düzenlerim?", "Bekleyen teminat transferleri?"));
    }

    private String buildUserPermissionAnswer() {
        return """
                **Kullanıcı yetkisi / rol düzenleme**

                1. Sol menüden **Yönetim Paneli**'ne gidin (`/core/yonetim-paneli`)
                2. Tabloda kullanıcıyı bulun (arama kutusu kullanabilirsiniz)
                3. **Düzenle** butonuna tıklayın
                4. **Roller** bölümünden ilgili rol kutucuklarını işaretleyin veya kaldırın
                5. **Kaydet** ile onaylayın

                **Veritabanı:** `users` + `user_roles` + `roles` tabloları

                **Not:** Kanal bazlı yetki için **TradeMaster Yetkilendirme** ekranı (`/core/trademaster-yetkilendirme`, tablo `channel_authorizations`).

                Ben sizin adınıza değişiklik yapmam; yukarıdaki adımları UI üzerinden uygulayın.
                """;
    }

    private ToolCallRecordDto record(String tool, Map<String, Object> input,
                                      AssistantToolService.ToolExecutionResult r) {
        ToolCallRecordDto dto = new ToolCallRecordDto();
        dto.setTool(tool);
        dto.setInput(new LinkedHashMap<>(input));
        dto.setRecordCount(r.isSuccess() ? r.getRecordCount() : 0);
        return dto;
    }

    private Long extractId(String message, AssistantContextDto context) {
        if (context != null && context.getSelectedEntityId() != null) {
            return context.getSelectedEntityId();
        }
        Matcher m = ID_PATTERN.matcher(message);
        if (m.find()) {
            try {
                return Long.parseLong(m.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    public static final class MockResult {
        private final String answer;
        private final List<ToolCallRecordDto> toolCalls;
        private final List<String> suggestedFollowUps;

        private MockResult(String answer, List<ToolCallRecordDto> toolCalls, List<String> suggestedFollowUps) {
            this.answer = answer;
            this.toolCalls = toolCalls;
            this.suggestedFollowUps = suggestedFollowUps;
        }

        static MockResult ok(String answer, List<ToolCallRecordDto> toolCalls, List<String> suggestedFollowUps) {
            return new MockResult(answer, toolCalls, suggestedFollowUps);
        }

        public String getAnswer() {
            return answer;
        }

        public List<ToolCallRecordDto> getToolCalls() {
            return toolCalls;
        }

        public List<String> getSuggestedFollowUps() {
            return suggestedFollowUps;
        }
    }
}
