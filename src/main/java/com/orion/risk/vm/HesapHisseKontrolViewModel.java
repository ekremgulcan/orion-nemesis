package com.orion.risk.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.risk.domain.AccountInstrumentControl;
import com.orion.risk.service.RiskProfileService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "Kullanici/Hesap/Hisse Bazinda Kontrol" ekrani icin ViewModel. Arama ve
 * Ekle/Duzenle/Sil islemlerini barindirir.
 */
public class HesapHisseKontrolViewModel {

    private final RiskProfileService riskProfileService = SpringContextHolder.getBean(RiskProfileService.class);

    private List<AccountInstrumentControl> kontroller;
    private String aramaMetni;

    private Long duzenlenenId;
    private String kullaniciAdi;
    private String hesapNo;
    private String enstrumanSembol;
    private boolean alisIzni;
    private boolean satisIzni;
    private boolean acikSatisIzni;

    @Init
    public void init() {
        kontroller = riskProfileService.getAccountInstrumentControls();
    }

    public List<AccountInstrumentControl> getKontroller() {
        return kontroller;
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

    public String getEnstrumanSembol() {
        return enstrumanSembol;
    }

    public void setEnstrumanSembol(String enstrumanSembol) {
        this.enstrumanSembol = enstrumanSembol;
    }

    public boolean isAlisIzni() {
        return alisIzni;
    }

    public void setAlisIzni(boolean alisIzni) {
        this.alisIzni = alisIzni;
    }

    public boolean isSatisIzni() {
        return satisIzni;
    }

    public void setSatisIzni(boolean satisIzni) {
        this.satisIzni = satisIzni;
    }

    public boolean isAcikSatisIzni() {
        return acikSatisIzni;
    }

    public void setAcikSatisIzni(boolean acikSatisIzni) {
        this.acikSatisIzni = acikSatisIzni;
    }

    @Command
    @NotifyChange("kontroller")
    public void ara() {
        kontroller = riskProfileService.searchAccountInstrumentControls(aramaMetni);
    }

    @Command
    @NotifyChange({"kullaniciAdi", "hesapNo", "enstrumanSembol", "alisIzni", "satisIzni", "acikSatisIzni", "duzenlenenId"})
    public void yeniKontrol() {
        temizle();
    }

    @Command
    @NotifyChange({"kullaniciAdi", "hesapNo", "enstrumanSembol", "alisIzni", "satisIzni", "acikSatisIzni", "duzenlenenId"})
    public void duzenle(@BindingParam("item") AccountInstrumentControl item) {
        duzenlenenId = item.getId();
        kullaniciAdi = item.getUser().getKullaniciAdi();
        hesapNo = item.getAccount().getHesapNo();
        enstrumanSembol = item.getInstrument().getSembol();
        alisIzni = item.isAlisIzni();
        satisIzni = item.isSatisIzni();
        acikSatisIzni = item.isAcikSatisIzni();
    }

    @Command
    @NotifyChange({"kontroller", "kullaniciAdi", "hesapNo", "enstrumanSembol", "alisIzni", "satisIzni", "acikSatisIzni", "duzenlenenId"})
    public void kaydet() {
        try {
            riskProfileService.kaydetAccountInstrumentControl(duzenlenenId, kullaniciAdi, hesapNo, enstrumanSembol,
                    alisIzni, satisIzni, acikSatisIzni);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        kontroller = riskProfileService.searchAccountInstrumentControls(aramaMetni);
        Messagebox.show("Kontrol kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("kontroller")
    public void sil(@BindingParam("item") AccountInstrumentControl item) {
        Messagebox.show("Kontrol silinsin mi: " + item.getUser().getAdSoyad() + " / " + item.getAccount().getHesapNo()
                        + " / " + item.getInstrument().getSembol() + "?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            riskProfileService.silAccountInstrumentControl(item.getId());
                            kontroller = riskProfileService.searchAccountInstrumentControls(aramaMetni);
                            BindUtils.postNotifyChange(null, null, this, "kontroller");
                        } catch (IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        kullaniciAdi = null;
        hesapNo = null;
        enstrumanSembol = null;
        alisIzni = false;
        satisIzni = false;
        acikSatisIzni = false;
    }
}
