package com.orion.report.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.report.domain.ReportDefinition;
import com.orion.report.service.ReportDefinitionService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "Rapor Tanimlari" ekrani icin ViewModel. Rapor Ekle/Duzenle modal
 * yerine ayni sayfada basit bir form kullanilir.
 */
public class RaporTanimlariViewModel {

    private final ReportDefinitionService reportDefinitionService =
            SpringContextHolder.getBean(ReportDefinitionService.class);

    private List<ReportDefinition> raporlar;
    private String aramaMetni;

    private Long duzenlenenId;
    private String raporAdi;
    private String raporSinifi;
    private String zamanlama = "MANUEL";
    private boolean mailGonder;
    private String icerik;

    @Init
    public void init() {
        raporlar = reportDefinitionService.getAll();
    }

    public List<ReportDefinition> getRaporlar() {
        return raporlar;
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    @Command
    @NotifyChange("raporlar")
    public void ara() {
        raporlar = reportDefinitionService.search(aramaMetni);
    }

    @Command
    @NotifyChange("raporlar")
    public void sil(@BindingParam("item") ReportDefinition item) {
        Messagebox.show("Rapor silinsin mi: " + item.getRaporAdi() + "?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        reportDefinitionService.sil(item.getId());
                        raporlar = reportDefinitionService.search(aramaMetni);
                        BindUtils.postNotifyChange(null, null, this, "raporlar");
                    }
                });
    }

    public String getRaporAdi() {
        return raporAdi;
    }

    public void setRaporAdi(String raporAdi) {
        this.raporAdi = raporAdi;
    }

    public String getRaporSinifi() {
        return raporSinifi;
    }

    public void setRaporSinifi(String raporSinifi) {
        this.raporSinifi = raporSinifi;
    }

    public String getZamanlama() {
        return zamanlama;
    }

    public void setZamanlama(String zamanlama) {
        this.zamanlama = zamanlama;
    }

    public boolean isMailGonder() {
        return mailGonder;
    }

    public void setMailGonder(boolean mailGonder) {
        this.mailGonder = mailGonder;
    }

    public String getIcerik() {
        return icerik;
    }

    public void setIcerik(String icerik) {
        this.icerik = icerik;
    }

    @Command
    @NotifyChange({"raporlar", "raporAdi", "raporSinifi", "zamanlama", "mailGonder", "icerik", "duzenlenenId"})
    public void kaydet() {
        try {
            reportDefinitionService.kaydet(duzenlenenId, raporAdi, raporSinifi, zamanlama, mailGonder, icerik);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        String kaydedilenAd = raporAdi;
        temizle();
        raporlar = reportDefinitionService.search(aramaMetni);
        Messagebox.show("Rapor kaydedildi: " + kaydedilenAd, "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange({"raporAdi", "raporSinifi", "zamanlama", "mailGonder", "icerik", "duzenlenenId"})
    public void duzenle(@BindingParam("item") ReportDefinition item) {
        duzenlenenId = item.getId();
        raporAdi = item.getRaporAdi();
        raporSinifi = item.getRaporSinifi();
        zamanlama = item.getZamanlama();
        mailGonder = item.isMailGonder();
        icerik = item.getIcerik();
    }

    @Command
    @NotifyChange({"raporAdi", "raporSinifi", "zamanlama", "mailGonder", "icerik", "duzenlenenId"})
    public void yeniRapor() {
        temizle();
    }

    private void temizle() {
        duzenlenenId = null;
        raporAdi = null;
        raporSinifi = null;
        zamanlama = "MANUEL";
        mailGonder = false;
        icerik = null;
    }
}
