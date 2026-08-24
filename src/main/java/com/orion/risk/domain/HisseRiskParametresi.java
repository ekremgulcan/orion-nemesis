package com.orion.risk.domain;

import com.orion.core.domain.Account;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * "Hisse Risk Parametreleri" ekrani (Yeni Hisse Emir Yonetimi ust menusu).
 * risk_profiles'tan bilerek AYRI: buradaki kontrol tipleri (Alis/Satis/Acik
 * Satis) boolean degil SPK Kontrollu/Nakit Kontrolu/Kontrolsuz uc secenekli,
 * ayrica sayisal limitler ve Net Varlik Limit Carpani (bkz. bulk update
 * ekrani) burada bulunuyor - eski risk_profiles/risk-parametreleri.zul
 * ekranina dokunulmadi.
 *
 * Hesap Tipi / Musteri No / Hesap No / Musteri Adi bu entity'de TEKRAR
 * TUTULMUYOR - hepsi account (ve account.customer) uzerinden okunur.
 */
@Entity
@Table(name = "hisse_risk_parametreleri")
@Getter
@Setter
public class HisseRiskParametresi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hisse_risk_parametre_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kullanici_tipi", nullable = false)
    private String kullaniciTipi; // Musteri / Yatirim Danismani

    @Column(name = "alis_kontrol_tipi", nullable = false)
    private String alisKontrolTipi; // SPK Kontrollu / Nakit Kontrolu / Kontrolsuz

    @Column(name = "satis_kontrol_tipi", nullable = false)
    private String satisKontrolTipi;

    @Column(name = "acik_satis_kontrol_tipi", nullable = false)
    private String acikSatisKontrolTipi;

    @Column(name = "acik_takas_limiti", nullable = false)
    private BigDecimal acikTakasLimiti;

    @Column(name = "aciga_satis_limiti", nullable = false)
    private BigDecimal acigaSatisLimiti;

    @Column(name = "net_varlik_limit_carpani", nullable = false)
    private Integer netVarlikLimitCarpani;

    @Column(name = "kredisiz_grup_a_alis_yapabilir", nullable = false)
    private boolean kredisizGrupAAlisYapabilir;

    @Column(name = "grup_b_alis_yapabilir", nullable = false)
    private boolean grupBAlisYapabilir;

    @Column(name = "grup_c_alis_yapabilir", nullable = false)
    private boolean grupCAlisYapabilir;

    @Column(name = "grup_d_alis_yapabilir", nullable = false)
    private boolean grupDAlisYapabilir;

    @Column(name = "kredisiz_grup_a_nakit_kontrol", nullable = false)
    private boolean kredisizGrupANakitKontrol;

    @Column(name = "grup_b_nakit_kontrol", nullable = false)
    private boolean grupBNakitKontrol;

    @Column(name = "grup_c_nakit_kontrol", nullable = false)
    private boolean grupCNakitKontrol;

    @Column(name = "grup_d_nakit_kontrol", nullable = false)
    private boolean grupDNakitKontrol;

    @Column(name = "kredisiz_paylarda_kontrolsuz_satis", nullable = false)
    private boolean kredisizPaylardaKontrolsuzSatis;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
