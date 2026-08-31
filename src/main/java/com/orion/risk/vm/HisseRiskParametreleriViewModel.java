package com.orion.risk.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Account;
import com.orion.core.domain.User;
import com.orion.core.service.AktifKullaniciServisi;
import com.orion.risk.domain.HisseRiskParametreTalebi;
import com.orion.risk.domain.HisseRiskParametresi;
import com.orion.risk.service.HisseRiskOnayService;
import com.orion.risk.service.HisseRiskParametreleriService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.util.media.AMedia;
import org.zkoss.util.media.Media;
import org.zkoss.zk.ui.Executions;
import org.zkoss.zk.ui.util.Clients;
import org.zkoss.zul.Filedownload;
import org.zkoss.zul.Messagebox;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * "Hisse Risk Parametreleri" ekrani (Yeni Hisse Emir Yonetimi ust menusu).
 * Ic ice uc sabit tab barindirir: "Risk profilleri" (arama + liste),
 * "Risk Profili Guncelleme" (detay formu) ve "Net Varlik Limit Carpani
 * Toplu Guncelleme" (Excel yukle -> onizle -> onaya gonder). index.zul'daki
 * ana OpenTab mekanizmasinin aksine burada sadece sabit sayida ic tab
 * oldugu icin ayri bir genel amacli "InnerTab listesi" kurulmadi -
 * detayAcik/topluGuncellemeAcik/selectedTabIndex yeterli.
 *
 * Satir tiklanip DUZENLEME modunda acildiginda Kullanici Tipi/Musteri
 * No/Hesap Tipi/Hesap No/Musteri Adi salt-okunur olur. "Yeni Ekle" ile
 * YENI KAYIT modunda acildiginda hicbir alan kilitlenmez (kullanicinin
 * talebi) - Hesap No'ya gore "Bul" ile hesap/musteri bilgileri doldurulur
 * ama sonrasinda serbestce degistirilebilir.
 *
 * INCELEME MODU: GorevListesiViewModel'den acildiginda (session attribute
 * "inceleme_process_id" varsa) degisiklik onizleme popup'i gosterilir,
 * kapandiktan sonra ekran salt-okunur olur + Onayla/Reddet butonlari gorunur.
 */
public class HisseRiskParametreleriViewModel {

    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final HisseRiskParametreleriService service = SpringContextHolder.getBean(HisseRiskParametreleriService.class);
    private final HisseRiskOnayService onayService = SpringContextHolder.getBean(HisseRiskOnayService.class);
    private final AktifKullaniciServisi aktifKullaniciServisi = SpringContextHolder.getBean(AktifKullaniciServisi.class);

    // --- Tab 1: Risk profilleri (arama + liste) ---
    private List<HisseRiskParametresi> parametreler;
    private String aramaMusteriNo;
    private String aramaHesapNo;
    private String aramaKullaniciTipi;

    // --- Ic tab yonetimi ---
    private boolean detayAcik;
    private int selectedTabIndex;
    private boolean yeniKayit;

    // --- Tab 3: Net Varlik Limit Carpani Toplu Guncelleme ---
    private boolean topluGuncellemeAcik;
    private List<NetVarlikCarpaniTopluSatir> onizlemeSatirlari = new ArrayList<>();
    private boolean onizlemeYapildi;

    // --- Tab 2: Risk Profili Guncelleme (detay formu) ---
    private Long duzenlenenId;
    private String hesapNo;
    private String musteriNo;
    private String musteriAdi;
    private String hesapTipi;
    private String kullaniciTipi;
    private String alisKontrolTipi;
    private String satisKontrolTipi;
    private String acikSatisKontrolTipi;
    private BigDecimal acikTakasLimiti;
    private BigDecimal acigaSatisLimiti;
    private Integer netVarlikLimitCarpani;
    private boolean kredisizGrupAAlisYapabilir;
    private boolean grupBAlisYapabilir;
    private boolean grupCAlisYapabilir;
    private boolean grupDAlisYapabilir;
    private boolean kredisizGrupANakitKontrol;
    private boolean grupBNakitKontrol;
    private boolean grupCNakitKontrol;
    private boolean grupDNakitKontrol;
    private boolean kredisizPaylardaKontrolsuzSatis;

    // --- Inceleme modu (onay/red akisi) ---
    private boolean incelemeModu;
    private Long incelemeProcessId;
    private boolean diffPopupAcik;
    private List<Map<String, String>> degisiklikListesi = new ArrayList<>();
    /** Inceleme modunda acilan sekmenin zulPath'i — closeReviewAndGoHome icin gerekli. */
    private String incelemeZulPath;

    @Init
    public void init(@org.zkoss.bind.annotation.QueryParam("incelemeProcessId") Long incelemeProcessId) {
        parametreler = service.getAll();

        if (incelemeProcessId != null) {
            this.incelemeProcessId = incelemeProcessId;
            incelemeModuBaslat();
        }
    }

    /**
     * Session'dan okunan process id ile inceleme modunu baslatir:
     * talepleri yukler, diff popup verisi hazirlar, toplu guncelleme
     * tab'ini acar ve diff popup'ini gosterir.
     */
    private void incelemeModuBaslat() {
        List<HisseRiskParametreTalebi> talepler = onayService.getTaleplerForReview(incelemeProcessId);
        if (talepler.isEmpty()) {
            return;
        }

        // Onizleme satirlarini taleplerden olustur
        onizlemeSatirlari = new ArrayList<>();
        degisiklikListesi = new ArrayList<>();
        for (HisseRiskParametreTalebi talep : talepler) {
            NetVarlikCarpaniTopluSatir satir = new NetVarlikCarpaniTopluSatir();
            satir.setHesapNo(talep.getAccount().getHesapNo());
            // Basit JSON parse - eskiDeger ve yeniDeger
            satir.setEskiDeger(parseIntFromJson(talep.getOncekiDegerJson()));
            satir.setYeniDeger(parseIntFromJson(talep.getYeniDegerJson()));
            satir.setGecerli(true);
            satir.setDurum("Onay Bekliyor");
            onizlemeSatirlari.add(satir);

            // Diff popup icin
            Map<String, String> diffRow = new HashMap<>();
            diffRow.put("hesapNo", talep.getAccount().getHesapNo());
            diffRow.put("eskiDeger", String.valueOf(satir.getEskiDeger()));
            diffRow.put("yeniDeger", String.valueOf(satir.getYeniDeger()));
            degisiklikListesi.add(diffRow);
        }

        incelemeModu = true;
        onizlemeYapildi = true;
        diffPopupAcik = true;
        topluGuncellemeAcik = true;
        selectedTabIndex = 2;
        incelemeZulPath = "/risk/hisse-risk-parametreleri.zul";
    }

    // --- Getter/Setter ---

    public List<HisseRiskParametresi> getParametreler() {
        return parametreler;
    }

    public String getAramaMusteriNo() {
        return aramaMusteriNo;
    }

    public void setAramaMusteriNo(String aramaMusteriNo) {
        this.aramaMusteriNo = aramaMusteriNo;
    }

    public String getAramaHesapNo() {
        return aramaHesapNo;
    }

    public void setAramaHesapNo(String aramaHesapNo) {
        this.aramaHesapNo = aramaHesapNo;
    }

    public String getAramaKullaniciTipi() {
        return aramaKullaniciTipi;
    }

    public void setAramaKullaniciTipi(String aramaKullaniciTipi) {
        this.aramaKullaniciTipi = aramaKullaniciTipi;
    }

    public boolean isDetayAcik() {
        return detayAcik;
    }

    public int getSelectedTabIndex() {
        return selectedTabIndex;
    }

    public void setSelectedTabIndex(int selectedTabIndex) {
        this.selectedTabIndex = selectedTabIndex;
    }

    public boolean isYeniKayit() {
        return yeniKayit;
    }

    public boolean isTopluGuncellemeAcik() {
        return topluGuncellemeAcik;
    }

    public List<NetVarlikCarpaniTopluSatir> getOnizlemeSatirlari() {
        return onizlemeSatirlari;
    }

    public boolean isOnizlemeYapildi() {
        return onizlemeYapildi;
    }

    /** "Onaya Gonder" butonunun aktif olup olmadigini belirler - tek bir gecersiz satir bile varsa engellenir. */
    public boolean isOnizlemeTumuGecerli() {
        return !onizlemeSatirlari.isEmpty() && onizlemeSatirlari.stream().allMatch(NetVarlikCarpaniTopluSatir::isGecerli);
    }

    public Long getDuzenlenenId() {
        return duzenlenenId;
    }

    public String getHesapNo() {
        return hesapNo;
    }

    public void setHesapNo(String hesapNo) {
        this.hesapNo = hesapNo;
    }

    public String getMusteriNo() {
        return musteriNo;
    }

    public void setMusteriNo(String musteriNo) {
        this.musteriNo = musteriNo;
    }

    public String getMusteriAdi() {
        return musteriAdi;
    }

    public void setMusteriAdi(String musteriAdi) {
        this.musteriAdi = musteriAdi;
    }

    public String getHesapTipi() {
        return hesapTipi;
    }

    public void setHesapTipi(String hesapTipi) {
        this.hesapTipi = hesapTipi;
    }

    public String getKullaniciTipi() {
        return kullaniciTipi;
    }

    public void setKullaniciTipi(String kullaniciTipi) {
        this.kullaniciTipi = kullaniciTipi;
    }

    public String getAlisKontrolTipi() {
        return alisKontrolTipi;
    }

    public void setAlisKontrolTipi(String alisKontrolTipi) {
        this.alisKontrolTipi = alisKontrolTipi;
    }

    public String getSatisKontrolTipi() {
        return satisKontrolTipi;
    }

    public void setSatisKontrolTipi(String satisKontrolTipi) {
        this.satisKontrolTipi = satisKontrolTipi;
    }

    public String getAcikSatisKontrolTipi() {
        return acikSatisKontrolTipi;
    }

    public void setAcikSatisKontrolTipi(String acikSatisKontrolTipi) {
        this.acikSatisKontrolTipi = acikSatisKontrolTipi;
    }

    public BigDecimal getAcikTakasLimiti() {
        return acikTakasLimiti;
    }

    public void setAcikTakasLimiti(BigDecimal acikTakasLimiti) {
        this.acikTakasLimiti = acikTakasLimiti;
    }

    public BigDecimal getAcigaSatisLimiti() {
        return acigaSatisLimiti;
    }

    public void setAcigaSatisLimiti(BigDecimal acigaSatisLimiti) {
        this.acigaSatisLimiti = acigaSatisLimiti;
    }

    public Integer getNetVarlikLimitCarpani() {
        return netVarlikLimitCarpani;
    }

    public void setNetVarlikLimitCarpani(Integer netVarlikLimitCarpani) {
        this.netVarlikLimitCarpani = netVarlikLimitCarpani;
    }

    public boolean isKredisizGrupAAlisYapabilir() {
        return kredisizGrupAAlisYapabilir;
    }

    public void setKredisizGrupAAlisYapabilir(boolean kredisizGrupAAlisYapabilir) {
        this.kredisizGrupAAlisYapabilir = kredisizGrupAAlisYapabilir;
    }

    public boolean isGrupBAlisYapabilir() {
        return grupBAlisYapabilir;
    }

    public void setGrupBAlisYapabilir(boolean grupBAlisYapabilir) {
        this.grupBAlisYapabilir = grupBAlisYapabilir;
    }

    public boolean isGrupCAlisYapabilir() {
        return grupCAlisYapabilir;
    }

    public void setGrupCAlisYapabilir(boolean grupCAlisYapabilir) {
        this.grupCAlisYapabilir = grupCAlisYapabilir;
    }

    public boolean isGrupDAlisYapabilir() {
        return grupDAlisYapabilir;
    }

    public void setGrupDAlisYapabilir(boolean grupDAlisYapabilir) {
        this.grupDAlisYapabilir = grupDAlisYapabilir;
    }

    public boolean isKredisizGrupANakitKontrol() {
        return kredisizGrupANakitKontrol;
    }

    public void setKredisizGrupANakitKontrol(boolean kredisizGrupANakitKontrol) {
        this.kredisizGrupANakitKontrol = kredisizGrupANakitKontrol;
    }

    public boolean isGrupBNakitKontrol() {
        return grupBNakitKontrol;
    }

    public void setGrupBNakitKontrol(boolean grupBNakitKontrol) {
        this.grupBNakitKontrol = grupBNakitKontrol;
    }

    public boolean isGrupCNakitKontrol() {
        return grupCNakitKontrol;
    }

    public void setGrupCNakitKontrol(boolean grupCNakitKontrol) {
        this.grupCNakitKontrol = grupCNakitKontrol;
    }

    public boolean isGrupDNakitKontrol() {
        return grupDNakitKontrol;
    }

    public void setGrupDNakitKontrol(boolean grupDNakitKontrol) {
        this.grupDNakitKontrol = grupDNakitKontrol;
    }

    public boolean isKredisizPaylardaKontrolsuzSatis() {
        return kredisizPaylardaKontrolsuzSatis;
    }

    public void setKredisizPaylardaKontrolsuzSatis(boolean kredisizPaylardaKontrolsuzSatis) {
        this.kredisizPaylardaKontrolsuzSatis = kredisizPaylardaKontrolsuzSatis;
    }

    // --- Inceleme modu getter'lari ---

    public boolean isIncelemeModu() {
        return incelemeModu;
    }

    public boolean isDiffPopupAcik() {
        return diffPopupAcik;
    }

    public List<Map<String, String>> getDegisiklikListesi() {
        return degisiklikListesi;
    }

    // --- Tab 1 komutlari ---

    @Command
    @NotifyChange("parametreler")
    public void sorgula() {
        parametreler = service.search(aramaMusteriNo, aramaHesapNo, aramaKullaniciTipi);
    }

    @Command
    @NotifyChange({"parametreler", "aramaMusteriNo", "aramaHesapNo", "aramaKullaniciTipi"})
    public void temizle() {
        aramaMusteriNo = null;
        aramaHesapNo = null;
        aramaKullaniciTipi = null;
        parametreler = service.getAll();
    }

    @Command
    @NotifyChange("parametreler")
    public void yenile() {
        parametreler = service.getAll();
    }

    @Command
    public void indir() {
        byte[] xlsx = service.exportToExcel(aramaMusteriNo, aramaHesapNo, aramaKullaniciTipi);
        String filename = "hisse-risk-parametreleri-" + LocalDate.now().format(FILE_DATE) + ".xlsx";
        AMedia media = new AMedia(filename, "xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsx);
        Filedownload.save(media);
        Clients.showNotification("Rapor olusturuldu.");
    }

    @Command
    @NotifyChange("*")
    public void satirSec(@BindingParam("item") HisseRiskParametresi item) {
        yeniKayit = false;
        duzenlenenId = item.getId();
        hesapNo = item.getAccount().getHesapNo();
        musteriNo = item.getAccount().getCustomer().getMusteriNo();
        musteriAdi = item.getAccount().getCustomer().getAdSoyadUnvan();
        hesapTipi = item.getAccount().getHesapMusteriTipi();
        kullaniciTipi = item.getKullaniciTipi();
        alisKontrolTipi = item.getAlisKontrolTipi();
        satisKontrolTipi = item.getSatisKontrolTipi();
        acikSatisKontrolTipi = item.getAcikSatisKontrolTipi();
        acikTakasLimiti = item.getAcikTakasLimiti();
        acigaSatisLimiti = item.getAcigaSatisLimiti();
        netVarlikLimitCarpani = item.getNetVarlikLimitCarpani();
        kredisizGrupAAlisYapabilir = item.isKredisizGrupAAlisYapabilir();
        grupBAlisYapabilir = item.isGrupBAlisYapabilir();
        grupCAlisYapabilir = item.isGrupCAlisYapabilir();
        grupDAlisYapabilir = item.isGrupDAlisYapabilir();
        kredisizGrupANakitKontrol = item.isKredisizGrupANakitKontrol();
        grupBNakitKontrol = item.isGrupBNakitKontrol();
        grupCNakitKontrol = item.isGrupCNakitKontrol();
        grupDNakitKontrol = item.isGrupDNakitKontrol();
        kredisizPaylardaKontrolsuzSatis = item.isKredisizPaylardaKontrolsuzSatis();
        detayAcik = true;
        selectedTabIndex = 1;
    }

    @Command
    @NotifyChange("*")
    public void yeniEkle() {
        temizleDetayFormu();
        yeniKayit = true;
        detayAcik = true;
        selectedTabIndex = 1;
    }

    /** "Yeni Ekle" akisinda Hesap No girildikten sonra "Bul" butonu. */
    @Command
    @NotifyChange({"musteriNo", "musteriAdi", "hesapTipi"})
    public void hesapBul() {
        try {
            Account account = service.bulAccountByHesapNo(hesapNo);
            musteriNo = account.getCustomer().getMusteriNo();
            musteriAdi = account.getCustomer().getAdSoyadUnvan();
            hesapTipi = account.getHesapMusteriTipi();
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange({"parametreler", "detayAcik", "selectedTabIndex"})
    public void kaydet() {
        try {
            service.kaydet(duzenlenenId, hesapNo, kullaniciTipi,
                    alisKontrolTipi, satisKontrolTipi, acikSatisKontrolTipi,
                    acikTakasLimiti, acigaSatisLimiti, netVarlikLimitCarpani,
                    kredisizGrupAAlisYapabilir, grupBAlisYapabilir, grupCAlisYapabilir, grupDAlisYapabilir,
                    kredisizGrupANakitKontrol, grupBNakitKontrol, grupCNakitKontrol, grupDNakitKontrol,
                    kredisizPaylardaKontrolsuzSatis);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        parametreler = service.search(aramaMusteriNo, aramaHesapNo, aramaKullaniciTipi);
        detayAcik = false;
        selectedTabIndex = 0;
        Messagebox.show("Risk profili kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    public void sil() {
        if (duzenlenenId == null) {
            return;
        }
        Messagebox.show("Bu risk profili silinsin mi?", "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        service.sil(duzenlenenId);
                        parametreler = service.search(aramaMusteriNo, aramaHesapNo, aramaKullaniciTipi);
                        detayAcik = false;
                        selectedTabIndex = 0;
                        org.zkoss.bind.BindUtils.postNotifyChange(null, null, this, "parametreler");
                        org.zkoss.bind.BindUtils.postNotifyChange(null, null, this, "detayAcik");
                        org.zkoss.bind.BindUtils.postNotifyChange(null, null, this, "selectedTabIndex");
                    }
                });
    }

    @Command
    @NotifyChange({"detayAcik", "selectedTabIndex"})
    public void detayKapat() {
        detayAcik = false;
        selectedTabIndex = 0;
    }

    // --- Tab 3 komutlari: Net Varlik Limit Carpani Toplu Guncelleme ---

    @Command
    @NotifyChange({"topluGuncellemeAcik", "selectedTabIndex", "onizlemeSatirlari", "onizlemeYapildi", "onizlemeTumuGecerli"})
    public void topluGuncellemeAc() {
        onizlemeSatirlari = new ArrayList<>();
        onizlemeYapildi = false;
        topluGuncellemeAcik = true;
        selectedTabIndex = 2;
    }

    /** Excel yukleme butonunun onUpload event'inden gelen medya - onizleme tablosunu uretir. */
    @Command
    @NotifyChange({"onizlemeSatirlari", "onizlemeYapildi", "onizlemeTumuGecerli"})
    public void dosyaYuklendi(@BindingParam("media") Media media) {
        if (media == null) {
            return;
        }
        try (InputStream in = mediaAkisiAc(media)) {
            onizlemeSatirlari = service.excelOnizle(in);
            onizlemeYapildi = true;
        } catch (IOException | UncheckedIOException ex) {
            Messagebox.show("Dosya okunamadi: " + ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    private static InputStream mediaAkisiAc(Media media) {
        return media.inMemory() ? new ByteArrayInputStream(media.getByteData()) : media.getStreamData();
    }

    @Command
    public void topluSablonIndir() {
        byte[] xlsx = service.topluGuncellemeSablonuOlustur();
        String filename = "net-varlik-limit-carpani-sablon-" + LocalDate.now().format(FILE_DATE) + ".xlsx";
        AMedia media = new AMedia(filename, "xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsx);
        Filedownload.save(media);
    }

    /**
     * "Onaya Gonder" butonu — artik dogrudan DB'ye yazmak yerine
     * HisseRiskOnayService uzerinden onay surecine yonlendirir.
     * Bekleyen surec varsa hata mesaji gosterir.
     */
    @Command
    @NotifyChange({"parametreler", "onizlemeSatirlari", "onizlemeYapildi", "onizlemeTumuGecerli", "topluGuncellemeAcik", "selectedTabIndex"})
    public void onayaGonder() {
        if (onizlemeSatirlari.isEmpty()) {
            return;
        }
        if (!isOnizlemeTumuGecerli()) {
            Messagebox.show("Onizlemede gecersiz satirlar var (hesap/deger hatali). Once Excel dosyasini duzeltip tekrar yukleyin.",
                    "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        try {
            User talepEden = aktifKullaniciServisi.getAktifKullanici();
            onayService.onayaGonder(onizlemeSatirlari, talepEden);
        } catch (IllegalStateException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        onizlemeSatirlari = new ArrayList<>();
        onizlemeYapildi = false;
        topluGuncellemeAcik = false;
        selectedTabIndex = 0;
        Messagebox.show("Onaya gonderilmistir.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange({"onizlemeSatirlari", "onizlemeYapildi", "onizlemeTumuGecerli"})
    public void onizlemeTemizle() {
        onizlemeSatirlari = new ArrayList<>();
        onizlemeYapildi = false;
    }

    @Command
    @NotifyChange({"topluGuncellemeAcik", "selectedTabIndex", "onizlemeSatirlari", "onizlemeYapildi", "onizlemeTumuGecerli"})
    public void topluGuncellemeKapat() {
        topluGuncellemeAcik = false;
        selectedTabIndex = 0;
        onizlemeSatirlari = new ArrayList<>();
        onizlemeYapildi = false;
    }

    // --- Inceleme modu komutlari ---

    @Command
    @NotifyChange("diffPopupAcik")
    public void diffPopupKapat() {
        diffPopupAcik = false;
    }

    /**
     * Inceleme modunda "Onayla" butonu: degisiklikleri uygular, sureci
     * kapatir, IndexViewModel'e "closeReviewAndGoHome" gonderir.
     */
    @Command
    public void onayla() {
        if (!incelemeModu || incelemeProcessId == null) {
            return;
        }
        User kararVeren = aktifKullaniciServisi.getAktifKullanici();
        onayService.onayla(incelemeProcessId, kararVeren);
        Messagebox.show("Onay islemi tamamlandi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION,
                event -> anaSayfayaDon());
    }

    /**
     * Inceleme modunda "Reddet" butonu: degisiklikleri uygulamaz, sureci
     * kapatir, IndexViewModel'e "closeReviewAndGoHome" gonderir.
     */
    @Command
    public void reddet() {
        if (!incelemeModu || incelemeProcessId == null) {
            return;
        }
        User kararVeren = aktifKullaniciServisi.getAktifKullanici();
        onayService.reddet(incelemeProcessId, kararVeren);
        Messagebox.show("Red islemi tamamlandi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION,
                event -> anaSayfayaDon());
    }

    /**
     * Messagebox kapandiktan sonra IndexViewModel'e inceleme sekmesini
     * kapatmasini ve Ana Sayfa'ya donmesini soyler.
     */
    private void anaSayfayaDon() {
        Map<String, Object> args = new HashMap<>();
        args.put("zulPath", incelemeZulPath != null ? incelemeZulPath : "/risk/hisse-risk-parametreleri.zul");
        args.put("incelemeProcessId", incelemeProcessId);
        BindUtils.postGlobalCommand(null, null, "closeReviewAndGoHome", args);
    }

    private void temizleDetayFormu() {
        duzenlenenId = null;
        hesapNo = null;
        musteriNo = null;
        musteriAdi = null;
        hesapTipi = null;
        kullaniciTipi = null;
        alisKontrolTipi = null;
        satisKontrolTipi = null;
        acikSatisKontrolTipi = null;
        acikTakasLimiti = BigDecimal.ZERO;
        acigaSatisLimiti = BigDecimal.ZERO;
        netVarlikLimitCarpani = 1;
        kredisizGrupAAlisYapabilir = false;
        grupBAlisYapabilir = false;
        grupCAlisYapabilir = false;
        grupDAlisYapabilir = false;
        kredisizGrupANakitKontrol = false;
        grupBNakitKontrol = false;
        grupCNakitKontrol = false;
        grupDNakitKontrol = false;
        kredisizPaylardaKontrolsuzSatis = false;
    }

    /**
     * Basit JSON parser — {"netVarlikLimitCarpani":3} formatindan degeri okur.
     */
    private static Integer parseIntFromJson(String json) {
        if (json == null) {
            return null;
        }
        try {
            int idx = json.indexOf("\"netVarlikLimitCarpani\":");
            if (idx < 0) {
                return null;
            }
            String afterKey = json.substring(idx + "\"netVarlikLimitCarpani\":".length());
            StringBuilder sb = new StringBuilder();
            for (char c : afterKey.toCharArray()) {
                if (Character.isDigit(c)) {
                    sb.append(c);
                } else if (sb.length() > 0) {
                    break;
                }
            }
            return sb.length() > 0 ? Integer.parseInt(sb.toString()) : null;
        } catch (Exception e) {
            return null;
        }
    }
}

