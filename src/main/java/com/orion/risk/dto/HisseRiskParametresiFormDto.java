package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * "Risk Profili Guncelleme" formunun (Yeni Ekle / Duzenle) POST/PUT govdesi.
 * Kullanici Tipi/Hesap Tipi/Musteri No/Musteri Adi burada YER ALMAZ - kayit
 * duzenleme akisinda bu alanlar zaten degistirilemez (hesapNo uzerinden
 * hesap tekrar bulunur), yeni kayit akisinda ise hesapNo tek girdi
 * kaynagidir (bkz. HisseRiskParametreleriService#bulAccountByHesapNo).
 */
@Getter
@Setter
public class HisseRiskParametresiFormDto {
    private String hesapNo;
    private String kullaniciTipi;
    private String alisKontrolTipi;
    private String satisKontrolTipi;
    private String acikSatisKontrolTipi;
    private BigDecimal acikTakasLimiti;
    private BigDecimal acigaSatisLimiti;
    private Integer netVarlikLimitCarpani;
    private boolean kredisizGrupAAlisYapabilir;
    private boolean grupBAlisYapabilir;
    private boolean grupCAlisYapabilir;
    private boolean grupDAlisYapabilir;
    private boolean kredisizGrupANakitKontrol;
    private boolean grupBNakitKontrol;
    private boolean grupCNakitKontrol;
    private boolean grupDNakitKontrol;
    private boolean kredisizPaylardaKontrolsuzSatis;
}
