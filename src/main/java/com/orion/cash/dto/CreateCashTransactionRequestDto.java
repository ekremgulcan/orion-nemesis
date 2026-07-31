package com.orion.cash.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * "Islem Talebi Olustur" formunun POST govdesi. Alan adlari
 * CashTransactionService.talepOlustur(...) parametreleriyle birebir
 * eslesir.
 */
@Getter
@Setter
public class CreateCashTransactionRequestDto {
    private String hesapNo;
    private String talepKanali;
    private String emirVeren;
    private LocalDate valorTarihi;
    private BigDecimal tutar;
    private String paraBirimi;
    private String islemYonu;
    private String yontem;
    private String iban;
    private String karsiHesapNo;
    private String iymBankaHesabi;
    private String aciklama;
}
