package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Bildirim Ayarlari" ekraninda "Duzenle" ile acilan kanal bazli
 * "Diger Ayarlar" + "Mevcut Sablon" bolumlerinin "Kaydet" ile gonderdigi
 * guncelleme. templateHeader bu ekranda hic gosterilmedigi/duzenlenmedigi
 * icin burada yer almaz - sadece templateBody duzenlenebilir.
 */
@Getter
@Setter
public class KanalAyarlariGuncelleRequest {
    private boolean musteriGorurVeDegistir;
    private int maxRetry;
    private int errorBackoffTime;
    private boolean active;
    private String templateBody;
}
