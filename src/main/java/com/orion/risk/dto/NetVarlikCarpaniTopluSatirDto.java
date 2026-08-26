package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * "Net Varlik Limit Carpani Toplu Guncelleme" onizleme satirinin REST
 * karsiligi - com.orion.risk.vm.NetVarlikCarpaniTopluSatir ile birebir
 * ayni alanlari tasir. Iki yonlu kullanilir: Excel onizleme endpoint'i bu
 * sekli DONDURUR, "Onaya Gonder" endpoint'i ise React'in elindeki (zaten
 * onizlemede gosterilmis) satirlari ayni sekilde GERI GONDERIR - sunucu
 * tarafinda ayrica state tutulmaz (bkz. HisseRiskParametreleriController).
 */
@Getter
@Setter
public class NetVarlikCarpaniTopluSatirDto {
    private String hesapNo;
    private Integer eskiDeger;
    private Integer yeniDeger;
    private List<Long> parametreIdListesi = new ArrayList<>();
    private boolean gecerli;
    private String durum;
}
