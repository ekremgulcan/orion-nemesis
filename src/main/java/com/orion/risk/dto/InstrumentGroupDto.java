package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class InstrumentGroupDto {
    private Long id;
    private String grupKodu;
    private String aciklama;
    private boolean aktif;
    private List<InstrumentRefDto> uyeler;

    @Getter
    @Setter
    public static class InstrumentRefDto {
        private Long id;
        private String sembol;
    }
}
