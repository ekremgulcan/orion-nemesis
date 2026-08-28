package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * PUT /api/v1/core/aktif-kullanici govdesi - aktif (simule edilen) oturum
 * kullanicisini degistirmek icin. Bkz. AktifKullaniciServisi.
 */
@Getter
@Setter
public class AktifKullaniciRequest {
    private String kullaniciAdi;
}
