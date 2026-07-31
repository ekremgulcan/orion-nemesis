package com.orion.credit.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.credit.domain.CreditOptimizationResult;
import com.orion.credit.domain.CreditOptimizationRun;
import com.orion.credit.service.CreditOptimizationService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani" (kredi-optimizasyon.zul)
 * icin ViewModel.
 */
public class KrediOptimizasyonViewModel {

    private final CreditOptimizationService creditOptimizationService =
            SpringContextHolder.getBean(CreditOptimizationService.class);

    private BigDecimal ozkaynakOrani = BigDecimal.valueOf(35.0);
    private CreditOptimizationRun currentRun;
    private List<CreditOptimizationResult> uygunHaleGelenler = new ArrayList<>();
    private List<CreditOptimizationResult> uygunHaleGelmeyenler = new ArrayList<>();

    @Init
    public void init() {
        // Ekran acilinca bos gelir - kullanici butona basana kadar "No Rows To Show" gorunur.
    }

    public BigDecimal getOzkaynakOrani() {
        return ozkaynakOrani;
    }

    public void setOzkaynakOrani(BigDecimal ozkaynakOrani) {
        this.ozkaynakOrani = ozkaynakOrani;
    }

    public List<CreditOptimizationResult> getUygunHaleGelenler() {
        return uygunHaleGelenler;
    }

    public List<CreditOptimizationResult> getUygunHaleGelmeyenler() {
        return uygunHaleGelmeyenler;
    }

    public String getUygunHaleGelenlerBaslik() {
        return "Uygun Hale Gelenler (" + uygunHaleGelenler.size() + ")";
    }

    public String getUygunHaleGelmeyenlerBaslik() {
        return "Uygun Hale Gelmeyenler (" + uygunHaleGelmeyenler.size() + ")";
    }

    @Command
    @NotifyChange({"uygunHaleGelenler", "uygunHaleGelmeyenler", "uygunHaleGelenlerBaslik", "uygunHaleGelmeyenlerBaslik"})
    public void gunbasiBaslat() {
        try {
            currentRun = creditOptimizationService.startRun("GUNBASI", ozkaynakOrani, "system");
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        yenile();
        Messagebox.show("Gunbasi optimizasyonu tamamlandi (" + uygunHaleGelenler.size() + " hesap uygun hale geldi)",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange({"uygunHaleGelenler", "uygunHaleGelmeyenler", "uygunHaleGelenlerBaslik", "uygunHaleGelmeyenlerBaslik"})
    public void guniciBaslat() {
        try {
            currentRun = creditOptimizationService.startRun("GUNICI", ozkaynakOrani, "system");
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        yenile();
        Messagebox.show("Gunici optimizasyonu tamamlandi (" + uygunHaleGelenler.size() + " hesap uygun hale geldi)",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange({"uygunHaleGelenler", "uygunHaleGelmeyenler", "uygunHaleGelenlerBaslik", "uygunHaleGelmeyenlerBaslik"})
    public void secimiTemizle() {
        currentRun = null;
        uygunHaleGelenler = new ArrayList<>();
        uygunHaleGelmeyenler = new ArrayList<>();
    }

    public String getSurecBaslatEtiketi() {
        return "Secilenler icin Surec Baslat (" + uygunHaleGelmeyenler.size() + ")";
    }

    @Command
    @NotifyChange({"uygunHaleGelenler", "uygunHaleGelmeyenler", "uygunHaleGelenlerBaslik",
            "uygunHaleGelmeyenlerBaslik", "surecBaslatEtiketi"})
    public void surecBaslat() {
        if (currentRun == null || uygunHaleGelmeyenler.isEmpty()) {
            Messagebox.show("Once bir optimizasyon calistirin, uygulanacak UYGUN_DEGIL sonuc bulunmuyor",
                    "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
            return;
        }
        int uygulanan = creditOptimizationService.surecBaslat(currentRun.getId());
        yenile();
        Messagebox.show(uygulanan + " kredi hesabi icin kredi bakiyesi hedef ozkaynak oranina gore guncellendi",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    private void yenile() {
        if (currentRun == null) {
            uygunHaleGelenler = new ArrayList<>();
            uygunHaleGelmeyenler = new ArrayList<>();
            return;
        }
        uygunHaleGelenler = creditOptimizationService.getUygunSonuclar(currentRun.getId());
        uygunHaleGelmeyenler = creditOptimizationService.getUygunDegilSonuclar(currentRun.getId());
    }
}
