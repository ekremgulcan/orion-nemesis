package com.orion.report.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReportDefinitionDto {
    private Long id;
    private String raporAdi;
    private String raporSinifi;
    private String zamanlama;
    private boolean mailGonder;
    private String icerik;
    private boolean aktif;
    private String olusturanKullaniciAdi;
    private String degistirenKullaniciAdi;
    private LocalDateTime olusturmaTarihi;
    private LocalDateTime guncellemeTarihi;
}
