package com.orion.credit.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * "Gunbasi/Gunici Islemlerini Baslat" butonlarinin POST body'si -
 * CreditOptimizationService.startRun parametreleriyle birebir eslesir
 * (kullaniciAdi haric - auth henuz yok, sistem kullanicisi varsayilir).
 */
@Getter
@Setter
public class StartOptimizationRunRequest {
    private BigDecimal hedefOzkaynakOrani;
}
