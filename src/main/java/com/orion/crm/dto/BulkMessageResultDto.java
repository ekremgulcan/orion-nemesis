package com.orion.crm.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BulkMessageResultDto {
    private int gonderilenSayisi;
    private String mesaj;

    public BulkMessageResultDto() {
    }

    public BulkMessageResultDto(int gonderilenSayisi, String mesaj) {
        this.gonderilenSayisi = gonderilenSayisi;
        this.mesaj = mesaj;
    }
}
