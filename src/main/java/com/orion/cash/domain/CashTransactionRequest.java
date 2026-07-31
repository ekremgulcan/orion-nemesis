package com.orion.cash.domain;

import com.orion.core.domain.Account;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cash_transaction_requests")
@Getter
@Setter
public class CashTransactionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "talep_kanali", nullable = false)
    private String talepKanali; // SUBE / INTERNET / TRADEMASTER / CAGRI_MERKEZI

    @Column(name = "emir_veren", nullable = false)
    private String emirVeren;

    @Column(name = "valor_tarihi", nullable = false)
    private LocalDate valorTarihi;

    @Column(name = "tutar", nullable = false)
    private BigDecimal tutar;

    @Column(name = "para_birimi", nullable = false)
    private String paraBirimi;

    @Column(name = "islem_yonu", nullable = false)
    private String islemYonu; // ODEME / TAHSILAT

    @Column(name = "yontem", nullable = false)
    private String yontem; // IBAN / HESAP / YINELE_GVT

    @Column(name = "iban")
    private String iban;

    @Column(name = "karsi_hesap_no")
    private String karsiHesapNo;

    @Column(name = "iym_banka_hesabi")
    private String iymBankaHesabi;

    @Column(name = "durum", nullable = false)
    private String durum; // BEKLEMEDE/ONAYLANDI/REDDEDILDI/TAMAMLANDI

    @Column(name = "aciklama")
    private String aciklama;

    @Column(name = "olusturma_tarihi", nullable = false)
    private LocalDateTime olusturmaTarihi;
}
