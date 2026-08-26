package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * "Hisse Risk Parametreleri" ekraninin (hisse-risk-parametreleri.zul /
 * HisseRiskParametreleriViewModel) REST API karsiligi - nemesis-frontend
 * tarafindan tuketilir. Account/Customer lazy iliskileri burada duz
 * alanlara (hesapNo/hesapTipi/musteriNo/musteriAdi) indirgenir, bkz.
 * HisseRiskParametresiMapper.
 */
@Getter
@Setter
public class HisseRiskParametresiDto {
    private Long id;
    private String kullaniciTipi; // Musteri / Yatirim Danismani
    private String hesapTipi; // account.hesapMusteriTipi
    private String hesapNo;
    private String musteriNo;
    private String musteriAdi;
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
    private boolean aktif;
    private LocalDateTime guncellemeTarihi;
}
