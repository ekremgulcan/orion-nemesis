package com.orion.collateral.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * "Teminat Onay Ekrani" (teminat-onay.zul) REST API'sinin JSON gövdesi.
 * {@link com.orion.collateral.domain.CollateralTransfer} entity'sinin
 * lazy iliskilerini duz alanlara indirger - hicbir lazy entity referansi
 * disariya sizmaz.
 */
@Getter
@Setter
public class CollateralTransferDto {

    private Long id;
    private String hesapNo;
    private String customerName;
    private String piyasa;
    private String saklamaci;
    private String teminatTipi;
    private String kaynakDepo;
    private String hedefDepo;
    private String instrumentSymbol;
    private String paraBirimi;
    private BigDecimal miktar;
    private boolean dosyaliMi;
    private String durum;
    private String talepEdenKullaniciAdi;
    private String onaylayanKullaniciAdi;
    private LocalDateTime talepTarihi;
    private LocalDateTime onayTarihi;
    private String aciklama;
}
