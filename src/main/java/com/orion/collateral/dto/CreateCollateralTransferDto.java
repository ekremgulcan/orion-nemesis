package com.orion.collateral.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * "Teminat Islemleri" (teminat-transfer.zul) icin POST body -
 * TeminatTransferViewModel.talepOlustur() parametreleriyle birebir
 * eslesir.
 */
@Getter
@Setter
public class CreateCollateralTransferDto {
    private String hesapNo;
    private String piyasa;
    private String saklamaci;
    private String teminatTipi;
    private String kaynakDepo;
    private String hedefDepo;
    private String paraBirimi;
    private BigDecimal miktar;
    private String aciklama;
}
