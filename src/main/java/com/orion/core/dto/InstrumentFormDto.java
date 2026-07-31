package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Piyasa Veri Yonetimi" ekraninin POST/PUT body'si -
 * InstrumentService.kaydet parametreleriyle birebir eslesir (id haric,
 * o path'ten gelir).
 */
@Getter
@Setter
public class InstrumentFormDto {
    private String isin;
    private String sembol;
    private String ad;
    private String tip;
    private String borsa;
    private boolean aktif;
}
