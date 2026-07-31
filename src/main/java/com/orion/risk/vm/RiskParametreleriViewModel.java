package com.orion.risk.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.risk.domain.RiskProfile;
import com.orion.risk.domain.UserLimit;
import com.orion.risk.service.RiskProfileService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

import java.util.List;

/**
 * "Risk Parametreleri" ekrani icin ViewModel. PDF'teki "Hisse Risk
 * Parametreleri" ve "Sabit Getiri Risk Tanimlama" ekranlari, enstruman
 * tipi filtresi (HISSE/SGMK) ile tek ekranda birlestirildi. Kullanici
 * adi/hesap no bazinda arama da bu filtreyle birlikte calisir.
 */
public class RiskParametreleriViewModel {

    private final RiskProfileService riskProfileService = SpringContextHolder.getBean(RiskProfileService.class);

    private String secilenTip = "HISSE";
    private String aramaMetni;
    private List<RiskProfile> riskProfilleri;
    private List<UserLimit> kullaniciLimitleri;

    @Init
    public void init() {
        yenile();
    }

    public String getSecilenTip() {
        return secilenTip;
    }

    public void setSecilenTip(String secilenTip) {
        this.secilenTip = secilenTip;
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    public List<RiskProfile> getRiskProfilleri() {
        return riskProfilleri;
    }

    public List<UserLimit> getKullaniciLimitleri() {
        return kullaniciLimitleri;
    }

    @Command
    @NotifyChange({"riskProfilleri", "kullaniciLimitleri"})
    public void tipDegisti() {
        yenile();
    }

    @Command
    @NotifyChange({"riskProfilleri", "kullaniciLimitleri"})
    public void ara() {
        riskProfilleri = riskProfileService.searchRiskProfiles(secilenTip, aramaMetni);
        kullaniciLimitleri = riskProfileService.searchUserLimits(secilenTip, aramaMetni);
    }

    private void yenile() {
        riskProfilleri = riskProfileService.getRiskProfiles(secilenTip);
        kullaniciLimitleri = riskProfileService.getUserLimits(secilenTip);
    }
}
