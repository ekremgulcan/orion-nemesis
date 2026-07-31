package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AccountInstrumentControlDto {
    private Long id;
    private String userName;
    private String kullaniciAdi;
    private String hesapNo;
    private String customerName;
    private String instrumentSymbol;
    private boolean alisIzni;
    private boolean satisIzni;
    private boolean acikSatisIzni;
    private LocalDateTime guncellemeTarihi;
}
