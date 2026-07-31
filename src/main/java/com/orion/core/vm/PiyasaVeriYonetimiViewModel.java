package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Instrument;
import com.orion.core.service.InstrumentService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.util.Clients;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "Piyasa Veri Yonetimi" (piyasa-veri-yonetimi.zul) icin ViewModel.
 * Referans enstruman (master data) icin arama ve Ekle/Duzenle/Sil
 * islemlerini barindirir. Fiyat besleme/entegrasyon yonetimi Faz 4+
 * kapsamindadir.
 */
public class PiyasaVeriYonetimiViewModel {

    private final InstrumentService instrumentService =
            SpringContextHolder.getBean(InstrumentService.class);

    private List<Instrument> enstrumanlar;
    private String aramaMetni;

    private Long duzenlenenId;
    private String isin;
    private String sembol;
    private String ad;
    private String tip;
    private String borsa;
    private boolean aktif = true;

    @Init
    public void init() {
        enstrumanlar = instrumentService.getAll();
    }

    public List<Instrument> getEnstrumanlar() {
        return enstrumanlar;
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

    public String getIsin() {
        return isin;
    }

    public void setIsin(String isin) {
        this.isin = isin;
    }

    public String getSembol() {
        return sembol;
    }

    public void setSembol(String sembol) {
        this.sembol = sembol;
    }

    public String getAd() {
        return ad;
    }

    public void setAd(String ad) {
        this.ad = ad;
    }

    public String getTip() {
        return tip;
    }

    public void setTip(String tip) {
        this.tip = tip;
    }

    public String getBorsa() {
        return borsa;
    }

    public void setBorsa(String borsa) {
        this.borsa = borsa;
    }

    public boolean isAktif() {
        return aktif;
    }

    public void setAktif(boolean aktif) {
        this.aktif = aktif;
    }

    @Command
    @NotifyChange("enstrumanlar")
    public void ara() {
        enstrumanlar = instrumentService.search(aramaMetni);
    }

    @Command
    @NotifyChange({"isin", "sembol", "ad", "tip", "borsa", "aktif", "duzenlenenId"})
    public void yeniEnstruman() {
        temizle();
    }

    @Command
    @NotifyChange({"isin", "sembol", "ad", "tip", "borsa", "aktif", "duzenlenenId"})
    public void duzenle(@BindingParam("item") Instrument item) {
        duzenlenenId = item.getId();
        isin = item.getIsin();
        sembol = item.getSembol();
        ad = item.getAd();
        tip = item.getTip();
        borsa = item.getBorsa();
        aktif = item.isAktif();
    }

    @Command
    @NotifyChange({"enstrumanlar", "isin", "sembol", "ad", "tip", "borsa", "aktif", "duzenlenenId"})
    public void kaydet() {
        try {
            instrumentService.kaydet(
                    duzenlenenId,
                    isin == null ? null : isin.trim(),
                    sembol == null ? null : sembol.trim().toUpperCase(),
                    ad,
                    tip == null ? null : tip.trim().toUpperCase(),
                    borsa == null ? null : borsa.trim().toUpperCase(),
                    aktif);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        enstrumanlar = instrumentService.search(aramaMetni);
        Messagebox.show("Enstruman kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("enstrumanlar")
    public void sil(@BindingParam("item") Instrument item) {
        Messagebox.show("Enstruman silinsin mi: " + item.getSembol() + "?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            instrumentService.sil(item.getId());
                            enstrumanlar = instrumentService.search(aramaMetni);
                            Clients.showNotification("Enstruman silindi.");
                        } catch (IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                        BindUtils.postNotifyChange(null, null, this, "enstrumanlar");
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        isin = null;
        sembol = null;
        ad = null;
        tip = null;
        borsa = null;
        aktif = true;
    }
}
