package com.orion.collateral.vm;

import com.orion.collateral.domain.CollateralTransfer;
import com.orion.collateral.service.CollateralService;
import com.orion.core.config.SpringContextHolder;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.List;

/**
 * "Teminat Onay Ekrani" (teminat-onay.zul) icin ViewModel. Farkli durum
 * tab'larinda (Transfer Talepleri, Dosyali/Dosyasiz Islemler, Takas
 * WebServis Hatali Talepler, Tamamlanmis/Iptal Edilmis Transferler,
 * Problem Yonetimindeki Transferler) listeleme + aksiyon (onayla/iptal/
 * revizyona gonder/havuza gonder) saglar.
 */
public class TeminatOnayViewModel {

    private final CollateralService collateralService = SpringContextHolder.getBean(CollateralService.class);

    private List<CollateralTransfer> bekleyenTalepler;
    private List<CollateralTransfer> dosyaliIslemler;
    private List<CollateralTransfer> takasHatalilar;
    private List<CollateralTransfer> tamamlananlar;
    private List<CollateralTransfer> problemliler;
    private CollateralTransfer secili;

    @Init
    public void init() {
        yenile();
    }

    public List<CollateralTransfer> getBekleyenTalepler() {
        return bekleyenTalepler;
    }

    public List<CollateralTransfer> getDosyaliIslemler() {
        return dosyaliIslemler;
    }

    public List<CollateralTransfer> getTakasHatalilar() {
        return takasHatalilar;
    }

    public List<CollateralTransfer> getTamamlananlar() {
        return tamamlananlar;
    }

    public List<CollateralTransfer> getProblemliler() {
        return problemliler;
    }

    public CollateralTransfer getSecili() {
        return secili;
    }

    public void setSecili(CollateralTransfer secili) {
        this.secili = secili;
    }

    @Command
    @NotifyChange({"bekleyenTalepler", "dosyaliIslemler", "takasHatalilar", "tamamlananlar", "problemliler", "secili"})
    public void onayla(@BindingParam("item") CollateralTransfer item) {
        try {
            collateralService.onayla(item.getId(), 1L);
            yenile();
            Messagebox.show("Transfer onaylandi (Hesap: " + item.getAccount().getHesapNo() + ")",
                    "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (Exception e) {
            Messagebox.show("Onaylama sirasinda hata olustu: " + e.getMessage(),
                    "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange({"bekleyenTalepler", "dosyaliIslemler", "takasHatalilar", "tamamlananlar", "problemliler", "secili"})
    public void iptalEt(@BindingParam("item") CollateralTransfer item) {
        try {
            collateralService.iptalEt(item.getId());
            yenile();
            Messagebox.show("Transfer iptal edildi (Hesap: " + item.getAccount().getHesapNo() + ")",
                    "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (Exception e) {
            Messagebox.show("Iptal sirasinda hata olustu: " + e.getMessage(),
                    "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange({"bekleyenTalepler", "dosyaliIslemler", "takasHatalilar", "tamamlananlar", "problemliler", "secili"})
    public void revizyonaGonder(@BindingParam("item") CollateralTransfer item) {
        try {
            collateralService.revizyonaGonder(item.getId());
            yenile();
            Messagebox.show("Talep revizyona gonderildi (Hesap: " + item.getAccount().getHesapNo() + ")",
                    "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (Exception e) {
            Messagebox.show("Revizyona gonderme sirasinda hata olustu: " + e.getMessage(),
                    "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange({"bekleyenTalepler", "dosyaliIslemler", "takasHatalilar", "tamamlananlar", "problemliler", "secili"})
    public void havuzaGonder(@BindingParam("item") CollateralTransfer item) {
        try {
            collateralService.havuzaGonder(item.getId());
            yenile();
            Messagebox.show("Talep havuza gonderildi (Hesap: " + item.getAccount().getHesapNo() + ")",
                    "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (Exception e) {
            Messagebox.show("Havuza gonderme sirasinda hata olustu: " + e.getMessage(),
                    "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    private void yenile() {
        List<CollateralTransfer> hepsi = collateralService.getAllTransfers();
        bekleyenTalepler = collateralService.getTransfersByDurum("BEKLEMEDE");
        dosyaliIslemler = hepsi.stream().filter(CollateralTransfer::isDosyaliMi).collect(java.util.stream.Collectors.toList());
        takasHatalilar = collateralService.getTransfersByDurum("TAKAS_HATALI");
        tamamlananlar = hepsi.stream()
                .filter(t -> "TAMAMLANDI".equals(t.getDurum()) || "IPTAL".equals(t.getDurum()))
                .collect(java.util.stream.Collectors.toList());
        problemliler = hepsi.stream()
                .filter(t -> "PROBLEM".equals(t.getDurum()) || "REVIZYONDA".equals(t.getDurum()) || "HAVUZDA".equals(t.getDurum()))
                .collect(java.util.stream.Collectors.toList());
    }
}
