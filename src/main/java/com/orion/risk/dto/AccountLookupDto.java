package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * "Yeni Ekle" akisinda Hesap No girildikten sonra "Bul" butonunun donusu -
 * bkz. HisseRiskParametreleriService#bulAccountByHesapNo.
 */
@Getter
@Setter
public class AccountLookupDto {
    private String musteriNo;
    private String musteriAdi;
    private String hesapTipi;
}
