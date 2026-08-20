package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_external_bank_accounts")
@Getter
@Setter
public class CustomerExternalBankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ext_account_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "referans_kurum")
    private String referansKurum;

    @Column(name = "sube_adi")
    private String subeAdi;

    @Column(name = "hesap_no")
    private String hesapNo;

    @Column(name = "iban")
    private String iban;

    @Column(name = "para_birimi")
    private String paraBirimi;

    @Column(name = "gvt_var", nullable = false)
    private boolean gvtVar;

    @Column(name = "hesap_sahibi")
    private String hesapSahibi;

    @Column(name = "hesap_tipi")
    private String hesapTipi;
}
