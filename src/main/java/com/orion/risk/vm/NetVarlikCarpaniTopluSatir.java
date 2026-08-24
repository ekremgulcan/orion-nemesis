package com.orion.risk.vm;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * "Net Varlik Limit Carpani Toplu Guncelleme" ic tabinin onizleme tablosu
 * satiri - Excel'deki HER Hesap No satiri icin TEK bir onizleme satiri
 * (kullanici arayuzunde Musteri No/Musteri Adi/Kullanici Tipi gosterilmesine
 * gerek olmadigi icin, bkz. ekran gorseli geri bildirimi). Bir Hesap No'ya
 * bagli birden fazla hisse_risk_parametreleri kaydi olabilir (Musteri +
 * Yatirim Danismani) - hepsi {@link #parametreIdListesi} icinde tutulur ve
 * "Onaya Gonder" hepsini birden gunceller, bkz.
 * HisseRiskParametreleriService#excelOnizle / #topluGuncelle.
 */
@Getter
@Setter
public class NetVarlikCarpaniTopluSatir {

    private String hesapNo;
    private Integer eskiDeger;
    private Integer yeniDeger;

    /** Guncellenecek hisse_risk_parametreleri kayitlarinin id listesi - hesap/parametre bulunamadiysa bos. */
    private List<Long> parametreIdListesi = new ArrayList<>();

    /** true ise "Onaya Gonder" bu satiri gercekten gunceller. */
    private boolean gecerli;

    /** Onizleme tablosunda gosterilen durum aciklamasi (orn. "Guncellenecek", "Hesap Bulunamadi"). */
    private String durum;
}
