package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

/**
 * "Yonetim Paneli" ekranindaki Ekle/Duzenle formunun REST karsiligi.
 * Ayni DTO hem POST (yeni kullanici) hem PUT (guncelleme) icin kullanilir;
 * id, path degiskeninden gelir, govdede tekrar edilmez.
 */
@Getter
@Setter
public class UserFormDto {
    private String kullaniciAdi;
    private String adSoyad;
    private String email;
    private boolean aktif = true;
    private Set<Long> rolIds;
}
