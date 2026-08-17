package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
@Getter
@Setter
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long id;

    @Column(name = "musteri_no", nullable = false, unique = true)
    private String musteriNo;

    @Column(name = "ad_soyad_unvan", nullable = false)
    private String adSoyadUnvan;

    @Column(name = "musteri_tipi", nullable = false)
    private String musteriTipi; // BIREYSEL / KURUMSAL

    @Column(name = "tckn_vkn", nullable = false, unique = true)
    private String tcknVkn;

    @Column(name = "risk_grubu", nullable = false)
    private String riskGrubu; // DUSUK / ORTA / YUKSEK

    @Column(name = "telefon")
    private String telefon;

    @Column(name = "email")
    private String email;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    private LocalDateTime olusturmaTarihi;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @Column(name = "yatirimci_no")
    private Long yatirimciNo;

    @Column(name = "isim")
    private String isim;

    @Column(name = "soyisim")
    private String soyisim;

    @Column(name = "baba_adi")
    private String babaAdi;

    @Column(name = "cinsiyet")
    private String cinsiyet;

    @Column(name = "dogum_yeri")
    private String dogumYeri;

    @Column(name = "dogum_tarihi")
    private LocalDate dogumTarihi;

    @Column(name = "uyruk")
    private String uyruk;

    @Column(name = "sube")
    private String sube;

    @Column(name = "yatirimci_lokasyon_tipi")
    private String yatirimciLokasyonTipi;

    @Column(name = "vergi_mukellefiyeti")
    private String vergiMukellefiyeti;

    @Column(name = "vergi_numarasi")
    private String vergiNumarasi;

    @Column(name = "vergi_dairesi")
    private String vergiDairesi;

    @Column(name = "yurtdisi_vergi_numarasi")
    private String yurtdisiVergiNumarasi;

    @Column(name = "yabanci_vergi_ulkesi")
    private String yabanciVergiUlkesi;

    @Column(name = "musteri_siniflandirmasi")
    private String musteriSiniflandirmasi;

    @Column(name = "ikinci_yabanci_vergi_ulkesi")
    private String ikinciYabanciVergiUlkesi;

    @Column(name = "green_card", nullable = false)
    private boolean greenCard;

    @Column(name = "ucuncu_yabanci_vergi_ulkesi")
    private String ucuncuYabanciVergiUlkesi;

    @Column(name = "ikinci_vkn_zorunlu_degil", nullable = false)
    private boolean ikinciVknZorunluDegil;

    @Column(name = "web_mailer_raporlari", nullable = false)
    private boolean webMailerRaporlari;

    @Column(name = "hesaplanan_yp")
    private String hesaplananYp;

    @Column(name = "kisinin_meslegi")
    private String kisininMeslegi;

    @Column(name = "musteri_tanimi_tipi")
    private String musteriTanimiTipi;

    @Column(name = "mkk_sicil_no")
    private String mkkSicilNo;

    @Column(name = "takasbank_sicil_no")
    private String takasbankSicilNo;

    @Column(name = "yatirimci_tipi")
    private String yatirimciTipi;

    @Column(name = "yatirimci_durumu")
    private String yatirimciDurumu;

    @Column(name = "ikinci_vatandaslik_ulkesi")
    private String ikinciVatandaslikUlkesi;

    @Column(name = "dogum_ulkesi")
    private String dogumUlkesi;

    @Column(name = "abd_vergi_mukellefi", nullable = false)
    private boolean abdVergiMukellefi;

    @Column(name = "ikinci_yurtdisi_vergi_numarasi")
    private String ikinciYurtdisiVergiNumarasi;

    @Column(name = "yabanci_vkn_zorunlu_degil", nullable = false)
    private boolean yabanciVknZorunluDegil;

    @Column(name = "ucuncu_yurtdisi_vergi_numarasi")
    private String ucuncuYurtdisiVergiNumarasi;

    @Column(name = "ucuncu_vkn_zorunlu_degil", nullable = false)
    private boolean ucuncuVknZorunluDegil;

    @Column(name = "nitelikli_yatirimci", nullable = false)
    private boolean nitelikliYatirimci;

    @Column(name = "atanan_yp")
    private String atananYp;

    @Column(name = "iys_arama_izni")
    private String iysAramaIzni;

    @Column(name = "nitelikli_yatirimci_dusuk_tutar", nullable = false)
    private boolean nitelikliYatirimciDusukTutar;

    @Column(name = "yatirimci_profili")
    private String yatirimciProfili;

    @Column(name = "iys_eposta_izni")
    private String iysEpostaIzni;

    @Column(name = "interaktif_kullanici", nullable = false)
    private boolean interaktifKullanici;

    @Column(name = "yatirimci_segmenti")
    private String yatirimciSegmenti;

    @Column(name = "iys_sms_izni")
    private String iysSmsIzni;

    @OneToMany(mappedBy = "customer")
    private List<Account> hesaplar = new ArrayList<>();
}
