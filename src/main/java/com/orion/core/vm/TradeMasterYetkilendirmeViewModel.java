package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.ChannelAuthorization;
import com.orion.core.service.ChannelAuthorizationService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "TradeMaster Yetkilendirme" (trademaster-yetkilendirme.zul) icin
 * ViewModel. Arama ve Ekle/Duzenle/Sil islemlerini barindirir.
 */
public class TradeMasterYetkilendirmeViewModel {

    private final ChannelAuthorizationService channelAuthorizationService =
            SpringContextHolder.getBean(ChannelAuthorizationService.class);

    private List<ChannelAuthorization> yetkiler;
    private String aramaMetni;

    private Long duzenlenenId;
    private String kullaniciAdi;
    private String hesapNo;
    private String kanal = "TRADEMASTER";
    private String yetkiDurumu = "AKTIF";

    @Init
    public void init() {
        yetkiler = channelAuthorizationService.getAll();
    }

    public List<ChannelAuthorization> getYetkiler() {
        return yetkiler;
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    public Long getDuzenlenenId() {
        return duzenlenenId;
    }

    public String getKullaniciAdi() {
        return kullaniciAdi;
    }

    public void setKullaniciAdi(String kullaniciAdi) {
        this.kullaniciAdi = kullaniciAdi;
    }

    public String getHesapNo() {
        return hesapNo;
    }

    public void setHesapNo(String hesapNo) {
        this.hesapNo = hesapNo;
    }

    public String getKanal() {
        return kanal;
    }

    public void setKanal(String kanal) {
        this.kanal = kanal;
    }

    public String getYetkiDurumu() {
        return yetkiDurumu;
    }

    public void setYetkiDurumu(String yetkiDurumu) {
        this.yetkiDurumu = yetkiDurumu;
    }

    @Command
    @NotifyChange("yetkiler")
    public void ara() {
        yetkiler = channelAuthorizationService.search(aramaMetni);
    }

    @Command
    @NotifyChange({"kullaniciAdi", "hesapNo", "kanal", "yetkiDurumu", "duzenlenenId"})
    public void yeniYetki() {
        temizle();
    }

    @Command
    @NotifyChange({"kullaniciAdi", "hesapNo", "kanal", "yetkiDurumu", "duzenlenenId"})
    public void duzenle(@BindingParam("item") ChannelAuthorization item) {
        duzenlenenId = item.getId();
        kullaniciAdi = item.getUser().getKullaniciAdi();
        hesapNo = item.getAccount().getHesapNo();
        kanal = item.getKanal();
        yetkiDurumu = item.getYetkiDurumu();
    }

    @Command
    @NotifyChange({"yetkiler", "kullaniciAdi", "hesapNo", "kanal", "yetkiDurumu", "duzenlenenId"})
    public void kaydet() {
        try {
            channelAuthorizationService.kaydet(duzenlenenId, kullaniciAdi, hesapNo, kanal, yetkiDurumu);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        } catch (Exception ex) {
            Messagebox.show("Kayit sirasinda hata olustu: " + ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        yetkiler = channelAuthorizationService.search(aramaMetni);
        Messagebox.show("Yetki kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("yetkiler")
    public void sil(@BindingParam("item") ChannelAuthorization item) {
        Messagebox.show("Yetki silinsin mi: " + item.getUser().getAdSoyad() + " / " + item.getAccount().getHesapNo() + "?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        channelAuthorizationService.sil(item.getId());
                        yetkiler = channelAuthorizationService.search(aramaMetni);
                        BindUtils.postNotifyChange(null, null, this, "yetkiler");
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        kullaniciAdi = null;
        hesapNo = null;
        kanal = "TRADEMASTER";
        yetkiDurumu = "AKTIF";
    }
}
