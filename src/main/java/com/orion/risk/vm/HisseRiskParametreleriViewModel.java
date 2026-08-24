package com.orion.risk.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Account;
import com.orion.risk.domain.HisseRiskParametresi;
import com.orion.risk.service.HisseRiskParametreleriService;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.util.media.AMedia;
import org.zkoss.util.media.Media;
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
import java.util.List;

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
 */
public class HisseRiskParametreleriViewModel {

    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final HisseRiskParametreleriService service = SpringContextHolder.getBean(HisseRiskParametreleriService.class);

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

    @Init
    public void init() {
        parametreler = service.getAll();
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

    @Command
    @NotifyChange({"parametreler", "onizlemeSatirlari", "onizlemeYapildi", "onizlemeTumuGecerli", "topluGuncellemeAcik", "selectedTabIndex"})
    public void onayaGonder() {
        if (onizlemeSatirlari.isEmpty()) {
            return;
        }
        // Buton zaten gecersiz satir varken disabled olur (bkz. onizlemeTumuGecerli), ama
        // komut yine de dogrudan tetiklenirse (orn. programatik) burada ikinci bir kapi var.
        if (!isOnizlemeTumuGecerli()) {
            Messagebox.show("Onizlemede gecersiz satirlar var (hesap/deger hatali). Once Excel dosyasini duzeltip tekrar yukleyin.",
                    "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        int guncellenen = service.topluGuncelle(onizlemeSatirlari);
        parametreler = service.search(aramaMusteriNo, aramaHesapNo, aramaKullaniciTipi);
        onizlemeSatirlari = new ArrayList<>();
        onizlemeYapildi = false;
        topluGuncellemeAcik = false;
        selectedTabIndex = 0;
        Messagebox.show(guncellenen + " risk profili guncellendi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
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
}
