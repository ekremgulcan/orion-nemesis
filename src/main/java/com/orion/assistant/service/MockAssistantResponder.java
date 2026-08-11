package com.orion.assistant.service;

import com.orion.assistant.dto.AssistantContextDto;
import com.orion.assistant.dto.AssistantHistoryMessageDto;
import com.orion.assistant.dto.ToolCallRecordDto;
import com.orion.assistant.tool.AssistantToolService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
        String lower = message.toLowerCase(Locale.forLanguageTag("tr"));
        List<ToolCallRecordDto> toolCalls = new ArrayList<>();

        if (containsAny(lower, "yetki", "rol", "kullanici", "kullanıcı", "yonetim", "yönetim")) {
            return MockResult.ok(buildUserPermissionAnswer(), toolCalls, List.of(
                    "Sistemde hangi roller tanimli?",
                    "Aktif kullanicilari listele"));
        }

        if (containsAny(lower, "teminat", "transfer", "collateral", "onay")) {
            Long id = extractId(message, context);
            if (id != null) {
                AssistantToolService.ToolExecutionResult r = toolService.execute(
                        "getCollateralTransferById", Map.of("id", id));
                toolCalls.add(record("getCollateralTransferById", Map.of("id", id), r));
                if (r.isSuccess() && r.getRecordCount() > 0) {
                    return MockResult.ok(
                            "Transfer #" + id + " icin canli veri cekildi.\n\n"
                                    + "**Durum kurallari:** Sadece `BEKLEMEDE` talepler onaylanabilir.\n"
                                    + "Onay icin **Teminat Onay Ekrani** (`/collateral/onay`) → satiri sec → **Onayla**.\n\n"
                                    + "Tool sonucu (ozet): " + truncate(r.getJsonPayload(), 800),
                            toolCalls,
                            List.of("Bekleyen tum teminat transferleri?", "Bu transferi neden reddedemem?"));
                }
            }
            AssistantToolService.ToolExecutionResult pending = toolService.execute(
                    "listCollateralTransfers", Map.of("durum", "BEKLEMEDE"));
            toolCalls.add(record("listCollateralTransfers", Map.of("durum", "BEKLEMEDE"), pending));
            return MockResult.ok(
                    "**Teminat akisi:** Teminat Islemleri'nde talep olusturulur → `BEKLEMEDE` → Teminat Onay Ekrani'nda onaylanir.\n\n"
                            + "Su an **" + pending.getRecordCount() + "** adet BEKLEMEDE transfer var.\n"
                            + "Detay icin transfer ID yazin veya Onay ekranina gidin.",
                    toolCalls,
                    List.of("12345 nolu transferin durumu?", "Onay ekrani hangi butonlar?"));
        }

        if (containsAny(lower, "nakit", "cash")) {
            AssistantToolService.ToolExecutionResult r = toolService.execute(
                    "listCashTransactionRequests", Map.of("durum", "BEKLEMEDE"));
            toolCalls.add(record("listCashTransactionRequests", Map.of("durum", "BEKLEMEDE"), r));
            return MockResult.ok(
                    "**Nakit Islem Giris** ekrani: `/cash/islem-giris`\n"
                            + "Tablo: `cash_transaction_requests`. BEKLEMEDE talep sayisi: **"
                            + r.getRecordCount() + "**.\n"
                            + "Yeni talep: formu doldur → kaydet. Onay akisi ekrandaki ilgili butonlardan.",
                    toolCalls,
                    List.of("Nakit talep durumlari neler?"));
        }

        if (containsAny(lower, "gorev", "görev", "workflow", "surec", "süreç")) {
            AssistantToolService.ToolExecutionResult r = toolService.execute("listOpenWorkflowTasks", Map.of());
            toolCalls.add(record("listOpenWorkflowTasks", Map.of(), r));
            return MockResult.ok(
                    "**Gorev Listesi:** `/workflow/gorev-listesi`\n"
                            + "Acik gorev sayisi (demo kullanici admin): **" + r.getRecordCount() + "**.",
                    toolCalls,
                    List.of("CashTransfer sureci nedir?"));
        }

        return MockResult.ok(
                "Orion operasyon danismaniyim — **salt okuma/rehberlik** modundayim; kayit degistiremem.\n\n"
                        + "Ornek sorular:\n"
                        + "- Kullanici yetkisini nasil duzenlerim?\n"
                        + "- Bekleyen teminat transferleri var mi?\n"
                        + "- Nakit islem talebi nasil acilir?\n\n"
                        + "Gemini API key tanimlanirsa (`ORION_GEMINI_API_KEY`) daha zengin cevaplar uretirim.",
                toolCalls,
                List.of("Kullanici yetkisini nasil duzenlerim?", "Bekleyen teminat transferleri?"));
    }

    private String buildUserPermissionAnswer() {
        return """
                **Kullanici yetkisi / rol duzenleme**

                1. Sol menuden **Yonetim Paneli**'ne gidin (`/core/yonetim-paneli`)
                2. Tabloda kullaniciyi bulun (arama kutusu kullanabilirsiniz)
                3. **Duzenle** butonuna tiklayin
                4. **Roller** bolumunden ilgili rol kutucuklarini isaretleyin veya kaldirin
                5. **Kaydet** ile onaylayin

                **Veritabani:** `users` + `user_roles` + `roles` tablolari

                **Not:** Kanal bazli yetki icin **TradeMaster Yetkilendirme** ekrani (`/core/trademaster-yetkilendirme`, tablo `channel_authorizations`).

                Ben sizin adiniza degisiklik yapmam; yukaridaki adimlari UI uzerinden uygulayin.
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

    private boolean containsAny(String text, String... keywords) {
        for (String k : keywords) {
            if (text.contains(k)) {
                return true;
            }
        }
        return false;
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
