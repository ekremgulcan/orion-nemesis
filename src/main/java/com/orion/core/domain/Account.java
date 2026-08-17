package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long id;

    @Column(name = "hesap_no", nullable = false, unique = true)
    private String hesapNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "hesap_tipi", nullable = false)
    private String hesapTipi; // NAKIT / KREDI / VIOP

    @Column(name = "durum", nullable = false)
    private String durum; // AKTIF / DONDURULMUS / KAPALI

    @Column(name = "acilis_tarihi", nullable = false, updatable = false)
    private LocalDateTime acilisTarihi;

    @Column(name = "hesap_sinifi")
    private String hesapSinifi;

    @Column(name = "yatirim_danismani")
    private String yatirimDanismani;

    @Column(name = "profil_tanimi")
    private String profilTanimi;

    @Column(name = "afk_kodu")
    private String afkKodu;

    @Column(name = "mpf_tipi")
    private String mpfTipi;

    @Column(name = "alt_sube")
    private String altSube;

    @Column(name = "hesap_musteri_tipi")
    private String hesapMusteriTipi;

    @Column(name = "acenta")
    private String acenta;

    @Column(name = "hesap_sube")
    private String hesapSube;

    @Column(name = "sik_kullanilan", nullable = false)
    private boolean sikKullanilan;

    @Column(name = "ozel_sozlesme", nullable = false)
    private boolean ozelSozlesme;

    @Column(name = "portfoy_hesabi", nullable = false)
    private boolean portfoyHesabi;

    @Column(name = "kolokasyon_hesabi", nullable = false)
    private boolean kolokasyonHesabi;

    @Column(name = "viop", nullable = false)
    private boolean viop;

    @Column(name = "webmailer_ekstre", nullable = false)
    private boolean webmailerEkstre;

    @Column(name = "lme", nullable = false)
    private boolean lme;

    @Column(name = "ytm_hisse", nullable = false)
    private boolean ytmHisse;

    @Column(name = "ytm_fon", nullable = false)
    private boolean ytmFon;

    @Column(name = "ytm_viop", nullable = false)
    private boolean ytmViop;
}
