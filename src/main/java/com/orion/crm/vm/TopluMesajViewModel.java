package com.orion.crm.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.crm.domain.Campaign;
import com.orion.crm.repository.CampaignRepository;
import com.orion.crm.service.BulkMessageService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "Toplu Mesaj Gonder" (toplu-mesaj-gonder.zul) ekrani icin ViewModel.
 */
public class TopluMesajViewModel {

    private final CampaignRepository campaignRepository =
            SpringContextHolder.getBean(CampaignRepository.class);

    private final BulkMessageService bulkMessageService =
            SpringContextHolder.getBean(BulkMessageService.class);

    private List<Campaign> kampanyalar;
    private Campaign seciliKampanya;

    private String aliciGrubu = "BELIRLI_HESAPLAR"; // HEPSI/ONAYLAYANLAR/ONAYLAMAYANLAR/AKSIYON_ALMAYANLAR/BELIRLI_HESAPLAR
    private String belirliHesaplar = "";
    private String yontem = "SMS"; // EMAIL / SMS
    private String mesajIcerigiTipi = "SABLON"; // SABLON / YENI
    private String yeniMesajIcerigi = "";
    private String sonucMesaji = "";

    @Init
    public void init() {
        kampanyalar = campaignRepository.findAll();
        if (!kampanyalar.isEmpty()) {
            seciliKampanya = kampanyalar.get(0);
        }
    }

    public List<Campaign> getKampanyalar() {
        return kampanyalar;
    }

    public Campaign getSeciliKampanya() {
        return seciliKampanya;
    }

    public void setSeciliKampanya(Campaign seciliKampanya) {
        this.seciliKampanya = seciliKampanya;
    }

    public String getAliciGrubu() {
        return aliciGrubu;
    }

    public void setAliciGrubu(String aliciGrubu) {
        this.aliciGrubu = aliciGrubu;
    }

    public String getBelirliHesaplar() {
        return belirliHesaplar;
    }

    public void setBelirliHesaplar(String belirliHesaplar) {
        this.belirliHesaplar = belirliHesaplar;
    }

    public String getYontem() {
        return yontem;
    }

    public void setYontem(String yontem) {
        this.yontem = yontem;
    }

    public String getMesajIcerigiTipi() {
        return mesajIcerigiTipi;
    }

    public void setMesajIcerigiTipi(String mesajIcerigiTipi) {
        this.mesajIcerigiTipi = mesajIcerigiTipi;
    }

    public String getYeniMesajIcerigi() {
        return yeniMesajIcerigi;
    }

    public void setYeniMesajIcerigi(String yeniMesajIcerigi) {
        this.yeniMesajIcerigi = yeniMesajIcerigi;
    }

    public String getSonucMesaji() {
        return sonucMesaji;
    }

    @Command
    @NotifyChange("sonucMesaji")
    public void gonder() {
        try {
            var gonderilenler = bulkMessageService.gonder(
                    seciliKampanya, aliciGrubu, belirliHesaplar, yontem, mesajIcerigiTipi, yeniMesajIcerigi);
            sonucMesaji = gonderilenler.size() + " hesaba " + yontem + " gonderildi.";

            if (gonderilenler.isEmpty()) {
                Messagebox.show("Secilen kriterlere uyan hesap bulunamadi, mesaj gonderilemedi",
                        "Uyari", Messagebox.OK, Messagebox.EXCLAMATION);
            } else {
                Messagebox.show(sonucMesaji, "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
            }
        } catch (IllegalArgumentException e) {
            Messagebox.show(e.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }
}
