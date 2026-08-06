package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "Musteri Bildirim Tercihleri" ekraninin GET/POST cevabi: musteri ozet
 * bilgisi + bildirim tipi bazinda tercih listesi. `sonGuncelleme`,
 * musterinin tum tercih satirlari arasindaki en guncel `son_guncelleme`
 * degeridir (Customer entity'sinde bu alan yok, kasitli - bkz. db/README.md).
 */
@Getter
@Setter
public class MusteriBildirimTercihleriDto {
    private String musteriNo;
    private String musteriAdi;
    private String tcknVkn;
    private String durum;
    private LocalDateTime sonGuncelleme;
    private List<BildirimTercihiDto> tercihler;
}
