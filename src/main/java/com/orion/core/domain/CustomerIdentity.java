package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "customer_identities")
@Getter
@Setter
public class CustomerIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identity_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "seri_no")
    private String seriNo;

    @Column(name = "medeni_hali")
    private String medeniHali;

    @Column(name = "anne_adi")
    private String anneAdi;

    @Column(name = "verildigi_yer")
    private String verildigiYer;

    @Column(name = "verildigi_tarih")
    private LocalDate verildigiTarih;

    @Column(name = "il")
    private String il;

    @Column(name = "ilce")
    private String ilce;

    @Column(name = "mahalle_koy")
    private String mahalleKoy;

    @Column(name = "cilt_no")
    private String ciltNo;

    @Column(name = "aile_sira_no")
    private String aileSiraNo;

    @Column(name = "sira_no")
    private String siraNo;

    @Column(name = "son_gecerlilik")
    private LocalDate sonGecerlilik;

    @Column(name = "es_tckn")
    private String esTckn;

    @Column(name = "surucu_belge_no")
    private String surucuBelgeNo;

    @Column(name = "surucu_sinif")
    private String surucuSinif;

    @Column(name = "surucu_verilis_tarih")
    private LocalDate surucuVerilisTarih;

    @Column(name = "surucu_gecerlilik")
    private LocalDate surucuGecerlilik;

    @Column(name = "pasaport_no")
    private String pasaportNo;

    @Column(name = "pasaport_verilis")
    private LocalDate pasaportVerilis;

    @Column(name = "pasaport_gecerlilik")
    private LocalDate pasaportGecerlilik;

    @Column(name = "pasaport_yeri")
    private String pasaportYeri;
}
