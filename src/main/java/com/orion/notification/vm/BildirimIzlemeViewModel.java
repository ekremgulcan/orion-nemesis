package com.orion.notification.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.notification.domain.NotificationEvent;
import com.orion.notification.service.NotificationEventService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.util.media.AMedia;
import org.zkoss.zk.ui.util.Clients;
import org.zkoss.zul.Filedownload;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

/**
 * "Bildirim Izleme" (notification/bildirim-izleme.zul) icin ViewModel.
 * Iki tab: "Bugunku Bildirimler" (sadece bugunun kayitlarini, filtresiz
 * gosterir) ve "Gecmis Bildirimler" (tarih araligi + serbest metin
 * filtreleriyle gecmis tum kayitlari gosterir). Her iki liste de ZK'nin
 * kendi `mold="paging"` listbox'i ile istemci tarafinda sayfalanir -
 * projedeki her ekranla ayni desen (bkz. NotificationEventService.list).
 */
public class BildirimIzlemeViewModel {

    private final NotificationEventService notificationEventService =
            SpringContextHolder.getBean(NotificationEventService.class);

    private List<NotificationEvent> bugunkuBildirimler;
    private List<NotificationEvent> gecmisBildirimler;

    private Date baslangicTarihi = new Date();
    private Date bitisTarihi = new Date();
    private String yatirimciNo;
    private String kullaniciAdi;
    private String durum;
    private String bildirimTipi;
    private int sayfaBasinaSatir = 20;

    @Init
    public void init() {
        LocalDate today = LocalDate.now();
        bugunkuBildirimler = notificationEventService.list(null, today, today, null, null, null);
        listele();
    }

    public List<NotificationEvent> getBugunkuBildirimler() {
        return bugunkuBildirimler;
    }

    public List<NotificationEvent> getGecmisBildirimler() {
        return gecmisBildirimler;
    }

    public String getGecmisBildirimlerBaslik() {
        return "Gecmis Bildirimler (" + (gecmisBildirimler == null ? 0 : gecmisBildirimler.size()) + ")";
    }

    public Date getBaslangicTarihi() {
        return baslangicTarihi;
    }

    public void setBaslangicTarihi(Date baslangicTarihi) {
        this.baslangicTarihi = baslangicTarihi;
    }

    public Date getBitisTarihi() {
        return bitisTarihi;
    }

    public void setBitisTarihi(Date bitisTarihi) {
        this.bitisTarihi = bitisTarihi;
    }

    public String getYatirimciNo() {
        return yatirimciNo;
    }

    public void setYatirimciNo(String yatirimciNo) {
        this.yatirimciNo = yatirimciNo;
    }

    public String getKullaniciAdi() {
        return kullaniciAdi;
    }

    public void setKullaniciAdi(String kullaniciAdi) {
        this.kullaniciAdi = kullaniciAdi;
    }

    public String getDurum() {
        return durum;
    }

    public void setDurum(String durum) {
        this.durum = durum;
    }

    public String getBildirimTipi() {
        return bildirimTipi;
    }

    public void setBildirimTipi(String bildirimTipi) {
        this.bildirimTipi = bildirimTipi;
    }

    public int getSayfaBasinaSatir() {
        return sayfaBasinaSatir;
    }

    public void setSayfaBasinaSatir(int sayfaBasinaSatir) {
        this.sayfaBasinaSatir = sayfaBasinaSatir;
    }

    @Command
    @NotifyChange({"gecmisBildirimler", "gecmisBildirimlerBaslik"})
    public void listele() {
        gecmisBildirimler = notificationEventService.list(
                durum,
                toLocalDate(baslangicTarihi),
                toLocalDate(bitisTarihi),
                yatirimciNo,
                kullaniciAdi,
                bildirimTipi);
    }

    @Command
    @NotifyChange({"baslangicTarihi", "bitisTarihi", "yatirimciNo", "kullaniciAdi", "durum", "bildirimTipi",
            "gecmisBildirimler", "gecmisBildirimlerBaslik"})
    public void temizle() {
        baslangicTarihi = new Date();
        bitisTarihi = new Date();
        yatirimciNo = null;
        kullaniciAdi = null;
        durum = null;
        bildirimTipi = null;
        listele();
    }

    @Command
    public void raporOlustur() {
        byte[] xlsx = notificationEventService.exportToExcel(
                durum,
                toLocalDate(baslangicTarihi),
                toLocalDate(bitisTarihi),
                yatirimciNo,
                kullaniciAdi,
                bildirimTipi);
        AMedia media = new AMedia("bildirim-izleme.xlsx", "xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsx);
        Filedownload.save(media);
        Clients.showNotification("Rapor olusturuldu.");
    }

    private LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }

    /** ZUL grid'de Tarih/Saat kolonlarini ayri gostermek icin yardimci metotlar. */
    public String getTarih(NotificationEvent event) {
        return event.getLogDate().toString();
    }

    public String getSaat(NotificationEvent event) {
        return event.getCreated().toLocalTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss.SSS"));
    }
}
