package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class InvestorAccountDto {
    private Long id;
    private String hesapNo;
    private String hesapTipi;
    private String durum;
    private LocalDateTime acilisTarihi;
    private String hesapSinifi;
    private String yatirimDanismani;
    private String profilTanimi;
    private String afkKodu;
    private String mpfTipi;
    private String altSube;
    private String hesapMusteriTipi;
    private String acenta;
    private String hesapSube;
    private boolean sikKullanilan;
    private boolean ozelSozlesme;
    private boolean portfoyHesabi;
    private boolean kolokasyonHesabi;
    private boolean viop;
    private boolean webmailerEkstre;
    private boolean lme;
    private boolean ytmHisse;
    private boolean ytmFon;
    private boolean ytmViop;
}
