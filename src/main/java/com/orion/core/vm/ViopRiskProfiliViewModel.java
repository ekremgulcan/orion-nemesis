package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.ViopRiskProfile;
import com.orion.core.service.ViopRiskProfileService;
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
 * "Hesap Bazinda VIOP Risk Profili Tanim" (viop-risk-profili.zul) icin
 * ViewModel. Arama ve Ekle/Duzenle/Sil islemlerini barindirir.
 */
public class ViopRiskProfiliViewModel {

    private final ViopRiskProfileService viopRiskProfileService =
            SpringContextHolder.getBean(ViopRiskProfileService.class);

    private List<ViopRiskProfile> profiller;
    private String aramaMetni;

    private Long duzenlenenId;
    private String hesapNo;
    private String profilAdi;
    private BigDecimal carpan;

    @Init
    public void init() {
        profiller = viopRiskProfileService.getAll();
    }

    public List<ViopRiskProfile> getProfiller() {
        return profiller;
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

    public String getHesapNo() {
        return hesapNo;
    }

    public void setHesapNo(String hesapNo) {
        this.hesapNo = hesapNo;
    }

    public String getProfilAdi() {
        return profilAdi;
    }

    public void setProfilAdi(String profilAdi) {
        this.profilAdi = profilAdi;
    }

    public BigDecimal getCarpan() {
        return carpan;
    }

    public void setCarpan(BigDecimal carpan) {
        this.carpan = carpan;
    }

    @Command
    @NotifyChange("profiller")
    public void ara() {
        profiller = viopRiskProfileService.search(aramaMetni);
    }

    @Command
    @NotifyChange({"hesapNo", "profilAdi", "carpan", "duzenlenenId"})
    public void yeniProfil() {
        temizle();
    }

    @Command
    @NotifyChange({"hesapNo", "profilAdi", "carpan", "duzenlenenId"})
    public void duzenle(@BindingParam("item") ViopRiskProfile item) {
        duzenlenenId = item.getId();
        hesapNo = item.getAccount().getHesapNo();
        profilAdi = item.getProfilAdi();
        carpan = item.getCarpan();
    }

    @Command
    @NotifyChange({"profiller", "hesapNo", "profilAdi", "carpan", "duzenlenenId"})
    public void kaydet() {
        try {
            viopRiskProfileService.kaydet(duzenlenenId, hesapNo, profilAdi, carpan);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        } catch (Exception ex) {
            Messagebox.show("Kayit sirasinda hata olustu: " + ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        profiller = viopRiskProfileService.search(aramaMetni);
        Messagebox.show("Profil kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("profiller")
    public void sil(@BindingParam("item") ViopRiskProfile item) {
        Messagebox.show("Profil silinsin mi: " + item.getProfilAdi() + " (" + item.getAccount().getHesapNo() + ")?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            viopRiskProfileService.sil(item.getId());
                            profiller = viopRiskProfileService.search(aramaMetni);
                            Clients.showNotification("Profil silindi.");
                            BindUtils.postNotifyChange(null, null, this, "profiller");
                        } catch (IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        hesapNo = null;
        profilAdi = null;
        carpan = null;
    }
}
