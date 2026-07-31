package com.orion.cash.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * "Nakit Yonetimi > Islem Giris" REST API'sinin JSON gövdesi (liste
 * gorunumu). {@link com.orion.cash.domain.CashTransactionRequest}
 * entity'sinin lazy iliskilerini duz alanlara indirger.
 */
@Getter
@Setter
public class CashTransactionRequestDto {

    private Long id;
    private String hesapNo;
    private String customerName;
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
    private String durum;
    private String aciklama;
    private LocalDateTime olusturmaTarihi;
}
