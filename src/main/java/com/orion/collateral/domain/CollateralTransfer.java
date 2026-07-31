package com.orion.collateral.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.Instrument;
import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "collateral_transfers")
@Getter
@Setter
public class CollateralTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "piyasa", nullable = false)
    private String piyasa;

    @Column(name = "saklamaci", nullable = false)
    private String saklamaci;

    @Column(name = "teminat_tipi", nullable = false)
    private String teminatTipi; // NAKIT_DOVIZ / PAY_SENEDI / BORCLANMA_ARACI / FON

    @Column(name = "kaynak_depo", nullable = false)
    private String kaynakDepo; // SERBEST / TEMINAT

    @Column(name = "hedef_depo", nullable = false)
    private String hedefDepo; // TEMINAT / SERBEST

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private Instrument instrument;

    @Column(name = "para_birimi")
    private String paraBirimi;

    @Column(name = "miktar", nullable = false)
    private BigDecimal miktar;

    @Column(name = "dosyali_mi", nullable = false)
    private boolean dosyaliMi;

    @Column(name = "durum", nullable = false)
    private String durum; // BEKLEMEDE/TAMAMLANDI/IPTAL/PROBLEM/REVIZYONDA/HAVUZDA/TAKAS_HATALI

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "talep_eden_kullanici_id")
    private User talepEdenKullanici;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onaylayan_kullanici_id")
    private User onaylayanKullanici;

    @Column(name = "talep_tarihi", nullable = false)
    private LocalDateTime talepTarihi;

    @Column(name = "onay_tarihi")
    private LocalDateTime onayTarihi;

    @Column(name = "aciklama")
    private String aciklama;
}
