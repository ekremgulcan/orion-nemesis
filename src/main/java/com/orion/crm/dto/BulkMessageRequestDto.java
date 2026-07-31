package com.orion.crm.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Toplu Mesaj Gonder" ekraninin POST body'si. ZK TopluMesajViewModel'deki
 * alanlarla birebir eslesir.
 */
@Getter
@Setter
public class BulkMessageRequestDto {
    private Long campaignId;
    private String aliciGrubu; // HEPSI/ONAYLAYANLAR/ONAYLAMAYANLAR/AKSIYON_ALMAYANLAR/BELIRLI_HESAPLAR
    private String belirliHesaplar; // virgul/satir ile ayrilmis hesap no listesi (serbest metin)
    private String yontem; // EMAIL / SMS
    private String mesajIcerigiTipi; // SABLON / YENI
    private String yeniMesajIcerigi;
}
