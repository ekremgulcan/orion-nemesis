package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InstrumentDto {
    private Long id;
    private String isin;
    private String sembol;
    private String ad;
    private String tip;
    private String borsa;
    private boolean aktif;
}
