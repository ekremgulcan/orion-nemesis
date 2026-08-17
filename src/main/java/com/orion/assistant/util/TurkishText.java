package com.orion.assistant.util;

import java.util.Locale;

/**
 * Türkçe metin arama ve asistan çıktıları için yardımcılar.
 * Kullanıcı "duzenle" veya "düzenle" yazsa da eşleşme çalışsın diye
 * anahtar kelime karşılaştırmasında ASCII-normalize edilir; cevaplar
 * her zaman doğru Türkçe karakterlerle üretilir.
 */
public final class TurkishText {

    private TurkishText() {
    }

    public static String normalizeForSearch(String text) {
        if (text == null) {
            return "";
        }
        String lower = text.toLowerCase(Locale.forLanguageTag("tr-TR"));
        return lower
                .replace('ı', 'i')
                .replace('ğ', 'g')
                .replace('ü', 'u')
                .replace('ş', 's')
                .replace('ö', 'o')
                .replace('ç', 'c');
    }

    public static boolean containsAnyNormalized(String text, String... keywords) {
        String normalized = normalizeForSearch(text);
        for (String keyword : keywords) {
            if (normalized.contains(normalizeForSearch(keyword))) {
                return true;
            }
        }
        return false;
    }
}
