package com.orion.report.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Rapor Ekle / Duzenle" grubunun POST/PUT body'si -
 * ReportDefinitionService.kaydet parametreleriyle birebir eslesir
 * (id haric, o path'ten gelir).
 */
@Getter
@Setter
public class ReportDefinitionFormDto {
    private String raporAdi;
    private String raporSinifi;
    private String zamanlama;
    private boolean mailGonder;
    private String icerik;
}
