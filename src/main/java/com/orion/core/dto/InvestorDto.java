package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class InvestorDto {
    private Long id;
    private String musteriNo;
    private String adSoyadUnvan;
    private String musteriTipi;
    private String tcknVkn;
    private String riskGrubu;
    private String telefon;
    private String email;
    private boolean aktif;
    private LocalDateTime olusturmaTarihi;
    private Long yatirimciNo;
    private String isim;
    private String soyisim;
    private String babaAdi;
    private String cinsiyet;
    private String dogumYeri;
    private LocalDate dogumTarihi;
    private String uyruk;
    private String sube;
    private String yatirimciLokasyonTipi;
    private String vergiMukellefiyeti;
    private String vergiNumarasi;
    private String vergiDairesi;
    private String yurtdisiVergiNumarasi;
    private String yabanciVergiUlkesi;
    private String musteriSiniflandirmasi;
    private String ikinciYabanciVergiUlkesi;
    private boolean greenCard;
    private String ucuncuYabanciVergiUlkesi;
    private boolean ikinciVknZorunluDegil;
    private boolean webMailerRaporlari;
    private String hesaplananYp;
    private String kisininMeslegi;
    private String musteriTanimiTipi;
    private String mkkSicilNo;
    private String takasbankSicilNo;
    private String yatirimciTipi;
    private String yatirimciDurumu;
    private String ikinciVatandaslikUlkesi;
    private String dogumUlkesi;
    private boolean abdVergiMukellefi;
    private String ikinciYurtdisiVergiNumarasi;
    private boolean yabanciVknZorunluDegil;
    private String ucuncuYurtdisiVergiNumarasi;
    private boolean ucuncuVknZorunluDegil;
    private boolean nitelikliYatirimci;
    private String atananYp;
    private String iysAramaIzni;
    private boolean nitelikliYatirimciDusukTutar;
    private String yatirimciProfili;
    private String iysEpostaIzni;
    private boolean interaktifKullanici;
    private String yatirimciSegmenti;
    private String iysSmsIzni;
}
