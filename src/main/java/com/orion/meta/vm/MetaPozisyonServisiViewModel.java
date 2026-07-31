package com.orion.meta.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.meta.domain.PositionShockScenario;
import com.orion.meta.domain.PositionSnapshot;
import com.orion.meta.service.MetaPozisyonService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.util.Clients;
import org.zkoss.zul.Messagebox;

import java.math.BigDecimal;
import java.util.List;

/**
 * "Meta Pozisyon Servisi" ekrani icin ViewModel. Pozisyon anlik
 * goruntulerini arama destekli salt-okunur listeler (turetilmis veri
 * oldugu icin CRUD yapilmaz); currency pair bazinda sok senaryolari icin
 * arama ve Ekle/Duzenle/Sil islemlerini barindirir.
 */
public class MetaPozisyonServisiViewModel {

    private final MetaPozisyonService metaPozisyonService =
            SpringContextHolder.getBean(MetaPozisyonService.class);

    private List<PositionSnapshot> pozisyonlar;
    private String pozisyonAramaMetni;

    private List<PositionShockScenario> sokSenaryolari;
    private String senaryoAramaMetni;

    private Long duzenlenenId;
    private String senaryoAdi;
    private String currencyPair;
    private BigDecimal sokYuzdesi;
    private boolean aktif = true;

    @Init
    public void init() {
        pozisyonlar = metaPozisyonService.getAllPositions();
        sokSenaryolari = metaPozisyonService.getAllScenarios();
    }

    public List<PositionSnapshot> getPozisyonlar() {
        return pozisyonlar;
    }

    public String getPozisyonAramaMetni() {
        return pozisyonAramaMetni;
    }

    public void setPozisyonAramaMetni(String pozisyonAramaMetni) {
        this.pozisyonAramaMetni = pozisyonAramaMetni;
    }

    @Command
    @NotifyChange("pozisyonlar")
    public void pozisyonAra() {
        pozisyonlar = metaPozisyonService.searchPositions(pozisyonAramaMetni);
    }

    public List<PositionShockScenario> getSokSenaryolari() {
        return sokSenaryolari;
    }

    public String getSenaryoAramaMetni() {
        return senaryoAramaMetni;
    }

    public void setSenaryoAramaMetni(String senaryoAramaMetni) {
        this.senaryoAramaMetni = senaryoAramaMetni;
    }

    public Long getDuzenlenenId() {
        return duzenlenenId;
    }

    public String getSenaryoAdi() {
        return senaryoAdi;
    }

    public void setSenaryoAdi(String senaryoAdi) {
        this.senaryoAdi = senaryoAdi;
    }

    public String getCurrencyPair() {
        return currencyPair;
    }

    public void setCurrencyPair(String currencyPair) {
        this.currencyPair = currencyPair;
    }

    public BigDecimal getSokYuzdesi() {
        return sokYuzdesi;
    }

    public void setSokYuzdesi(BigDecimal sokYuzdesi) {
        this.sokYuzdesi = sokYuzdesi;
    }

    public boolean isAktif() {
        return aktif;
    }

    public void setAktif(boolean aktif) {
        this.aktif = aktif;
    }

    @Command
    @NotifyChange("sokSenaryolari")
    public void senaryoAra() {
        sokSenaryolari = metaPozisyonService.searchScenarios(senaryoAramaMetni);
    }

    @Command
    @NotifyChange({"senaryoAdi", "currencyPair", "sokYuzdesi", "aktif", "duzenlenenId"})
    public void yeniSenaryo() {
        temizle();
    }

    @Command
    @NotifyChange({"senaryoAdi", "currencyPair", "sokYuzdesi", "aktif", "duzenlenenId"})
    public void duzenleSenaryo(@BindingParam("item") PositionShockScenario item) {
        duzenlenenId = item.getId();
        senaryoAdi = item.getSenaryoAdi();
        currencyPair = item.getCurrencyPair();
        sokYuzdesi = item.getSokYuzdesi();
        aktif = item.isAktif();
    }

    @Command
    @NotifyChange({"sokSenaryolari", "senaryoAdi", "currencyPair", "sokYuzdesi", "aktif", "duzenlenenId"})
    public void kaydetSenaryo() {
        try {
            metaPozisyonService.kaydetScenario(duzenlenenId, senaryoAdi, currencyPair, sokYuzdesi, aktif);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        sokSenaryolari = metaPozisyonService.searchScenarios(senaryoAramaMetni);
        Messagebox.show("Sok senaryosu kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("sokSenaryolari")
    public void silSenaryo(@BindingParam("item") PositionShockScenario item) {
        Messagebox.show("Senaryo silinsin mi: " + item.getSenaryoAdi() + "?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        metaPozisyonService.silScenario(item.getId());
                        sokSenaryolari = metaPozisyonService.searchScenarios(senaryoAramaMetni);
                        Clients.showNotification("Senaryo silindi.");
                        BindUtils.postNotifyChange(null, null, this, "sokSenaryolari");
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        senaryoAdi = null;
        currencyPair = null;
        sokYuzdesi = null;
        aktif = true;
    }
}
