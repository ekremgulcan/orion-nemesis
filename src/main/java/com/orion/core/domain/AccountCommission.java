package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "account_commissions")
@Getter
@Setter
public class AccountCommission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "commission_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "islem")
    private String islem;

    @Column(name = "masraf_aciklamasi")
    private String masrafAciklamasi;

    @Column(name = "parametre_adi")
    private String parametreAdi;

    @Column(name = "para_birimi")
    private String paraBirimi;

    @Column(name = "piyasa_adi")
    private String piyasaAdi;

    @Column(name = "komisyon_degeri")
    private BigDecimal komisyonDegeri;
}
