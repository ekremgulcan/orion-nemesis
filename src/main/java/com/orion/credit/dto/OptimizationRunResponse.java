package com.orion.credit.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * "Gunbasi/Gunici Islemlerini Baslat ve Listeyi Getir" butonlarinin ve
 * "Secilenler icin Surec Baslat" butonunun ortak yanit sekli - ZK
 * ViewModel'deki yenile() sonrasi hem uygunHaleGelenler hem de
 * uygunHaleGelmeyenler listelerini tek cevapta doner (frontend tek
 * istekle her iki tabloyu da guncelleyebilsin diye).
 */
@Getter
@Setter
public class OptimizationRunResponse {
    private CreditOptimizationRunDto run;
    private List<CreditOptimizationResultDto> uygunHaleGelenler;
    private List<CreditOptimizationResultDto> uygunHaleGelmeyenler;
    private Integer uygulananSayisi; // sadece surec-baslat cevabinda dolu
}
