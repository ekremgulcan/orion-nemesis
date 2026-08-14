package com.orion.notification.domain;

/**
 * Bildirim gonderim kanallari. "Bildirim Ayarlari" ekraninda bir bildirim
 * tipi + kanal kombinasyonu icin sablon, deneme sayisi, tekrar deneme
 * suresi ve kanal bazli durum ayarlari yonetilecek - bu kanal secimi
 * bugun icin sadece secim amaclidir, kanal bazli ayar paneli henuz
 * uygulanmadi (bkz. BildirimAyarlariViewModel javadoc).
 */
public enum BildirimKanali {
    PUSH("Push"),
    SMS("SMS"),
    EPOSTA("E-Posta");

    private final String etiket;

    BildirimKanali(String etiket) {
        this.etiket = etiket;
    }

    public String getEtiket() {
        return etiket;
    }
}
