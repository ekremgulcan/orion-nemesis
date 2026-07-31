package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Customer;
import com.orion.core.service.CustomerService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "Musteri Yonetim Sistemi" (musteriler.zul) icin ViewModel. Arama ve
 * Ekle/Duzenle/Sil islemlerini barindirir. (KYC/risk profili detay
 * ekranlari Faz 4+ kapsamindadir.)
 */
public class MusteriListesiViewModel {

    private final CustomerService customerService =
            SpringContextHolder.getBean(CustomerService.class);

    private List<Customer> musteriler;
    private String aramaMetni;

    private Long duzenlenenId;
    private String musteriNo;
    private String adSoyadUnvan;
    private String musteriTipi = "BIREYSEL";
    private String tcknVkn;
    private String riskGrubu = "ORTA";
    private String telefon;
    private String email;
    private boolean aktif = true;

    @Init
    public void init() {
        musteriler = customerService.getAll();
    }

    public List<Customer> getMusteriler() {
        return musteriler;
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

    public String getMusteriNo() {
        return musteriNo;
    }

    public void setMusteriNo(String musteriNo) {
        this.musteriNo = musteriNo;
    }

    public String getAdSoyadUnvan() {
        return adSoyadUnvan;
    }

    public void setAdSoyadUnvan(String adSoyadUnvan) {
        this.adSoyadUnvan = adSoyadUnvan;
    }

    public String getMusteriTipi() {
        return musteriTipi;
    }

    public void setMusteriTipi(String musteriTipi) {
        this.musteriTipi = musteriTipi;
    }

    public String getTcknVkn() {
        return tcknVkn;
    }

    public void setTcknVkn(String tcknVkn) {
        this.tcknVkn = tcknVkn;
    }

    public String getRiskGrubu() {
        return riskGrubu;
    }

    public void setRiskGrubu(String riskGrubu) {
        this.riskGrubu = riskGrubu;
    }

    public String getTelefon() {
        return telefon;
    }

    public void setTelefon(String telefon) {
        this.telefon = telefon;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isAktif() {
        return aktif;
    }

    public void setAktif(boolean aktif) {
        this.aktif = aktif;
    }

    @Command
    @NotifyChange("musteriler")
    public void ara() {
        musteriler = customerService.search(aramaMetni);
    }

    @Command
    @NotifyChange({"musteriNo", "adSoyadUnvan", "musteriTipi", "tcknVkn", "riskGrubu", "telefon", "email", "aktif", "duzenlenenId"})
    public void yeniMusteri() {
        temizle();
    }

    @Command
    @NotifyChange({"musteriNo", "adSoyadUnvan", "musteriTipi", "tcknVkn", "riskGrubu", "telefon", "email", "aktif", "duzenlenenId"})
    public void duzenle(@BindingParam("item") Customer item) {
        duzenlenenId = item.getId();
        musteriNo = item.getMusteriNo();
        adSoyadUnvan = item.getAdSoyadUnvan();
        musteriTipi = item.getMusteriTipi();
        tcknVkn = item.getTcknVkn();
        riskGrubu = item.getRiskGrubu();
        telefon = item.getTelefon();
        email = item.getEmail();
        aktif = item.isAktif();
    }

    @Command
    @NotifyChange({"musteriler", "musteriNo", "adSoyadUnvan", "musteriTipi", "tcknVkn", "riskGrubu", "telefon", "email", "aktif", "duzenlenenId"})
    public void kaydet() {
        try {
            customerService.kaydet(duzenlenenId, musteriNo, adSoyadUnvan, musteriTipi, tcknVkn, riskGrubu, telefon, email, aktif);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        musteriler = customerService.search(aramaMetni);
        Messagebox.show("Musteri kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("musteriler")
    public void sil(@BindingParam("item") Customer item) {
        Messagebox.show("Musteri silinsin mi: " + item.getAdSoyadUnvan() + " (" + item.getMusteriNo() + ")?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            customerService.sil(item.getId());
                            musteriler = customerService.search(aramaMetni);
                            BindUtils.postNotifyChange(null, null, this, "musteriler");
                        } catch (IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        musteriNo = null;
        adSoyadUnvan = null;
        musteriTipi = "BIREYSEL";
        tcknVkn = null;
        riskGrubu = "ORTA";
        telefon = null;
        email = null;
        aktif = true;
    }
}
