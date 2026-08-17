package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InvestorIdentityDto {
    private Long id;
    private String seriNo;
    private String medeniHali;
    private String anneAdi;
    private String verildigiYer;
    private LocalDate verildigiTarih;
    private String il;
    private String ilce;
    private String mahalleKoy;
    private String ciltNo;
    private String aileSiraNo;
    private String siraNo;
    private LocalDate sonGecerlilik;
    private String esTckn;
    private String surucuBelgeNo;
    private String surucuSinif;
    private LocalDate surucuVerilisTarih;
    private LocalDate surucuGecerlilik;
    private String pasaportNo;
    private LocalDate pasaportVerilis;
    private LocalDate pasaportGecerlilik;
    private String pasaportYeri;
}
