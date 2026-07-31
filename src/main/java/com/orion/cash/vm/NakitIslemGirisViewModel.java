package com.orion.cash.vm;

import com.orion.cash.domain.CashTransactionRequest;
import com.orion.cash.service.CashTransactionService;
import com.orion.core.config.SpringContextHolder;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.util.Clients;
import org.zkoss.zul.Messagebox;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

/**
 * "Nakit Yonetimi > Islem Giris" ekrani icin ViewModel. Para transfer
 * talebi formu + gecmis taleplerin listesi.
 */
public class NakitIslemGirisViewModel {

    private final CashTransactionService cashTransactionService =
            SpringContextHolder.getBean(CashTransactionService.class);

    private List<CashTransactionRequest> talepler;

    private String hesapNo;
    private String talepKanali = "SUBE";
    private String emirVeren;
    private Date valorTarihi = new Date();
    private BigDecimal tutar;
    private String paraBirimi = "TRY";
    private String islemYonu = "ODEME";
    private String yontem = "IBAN";
    private String iban;
    private String karsiHesapNo;
    private String iymBankaHesabi;
    private String aciklama;
    private String mesaj;

    @Init
    public void init() {
        talepler = cashTransactionService.getAll();
    }

    public List<CashTransactionRequest> getTalepler() {
        return talepler;
    }

    public String getHesapNo() {
        return hesapNo;
    }

    public void setHesapNo(String hesapNo) {
        this.hesapNo = hesapNo;
    }

    public String getTalepKanali() {
        return talepKanali;
    }

    public void setTalepKanali(String talepKanali) {
        this.talepKanali = talepKanali;
    }

    public String getEmirVeren() {
        return emirVeren;
    }

    public void setEmirVeren(String emirVeren) {
        this.emirVeren = emirVeren;
    }

    public Date getValorTarihi() {
        return valorTarihi;
    }

    public void setValorTarihi(Date valorTarihi) {
        this.valorTarihi = valorTarihi;
    }

    public BigDecimal getTutar() {
        return tutar;
    }

    public void setTutar(BigDecimal tutar) {
        this.tutar = tutar;
    }

    public String getParaBirimi() {
        return paraBirimi;
    }

    public void setParaBirimi(String paraBirimi) {
        this.paraBirimi = paraBirimi;
    }

    public String getIslemYonu() {
        return islemYonu;
    }

    public void setIslemYonu(String islemYonu) {
        this.islemYonu = islemYonu;
    }

    public String getYontem() {
        return yontem;
    }

    public void setYontem(String yontem) {
        this.yontem = yontem;
    }

    public String getIban() {
        return iban;
    }

    public void setIban(String iban) {
        this.iban = iban;
    }

    public String getKarsiHesapNo() {
        return karsiHesapNo;
    }

    public void setKarsiHesapNo(String karsiHesapNo) {
        this.karsiHesapNo = karsiHesapNo;
    }

    public String getIymBankaHesabi() {
        return iymBankaHesabi;
    }

    public void setIymBankaHesabi(String iymBankaHesabi) {
        this.iymBankaHesabi = iymBankaHesabi;
    }

    public String getAciklama() {
        return aciklama;
    }

    public void setAciklama(String aciklama) {
        this.aciklama = aciklama;
    }

    public String getMesaj() {
        return mesaj;
    }

    @Command
    @NotifyChange({"talepler", "mesaj"})
    public void talepOlustur() {
        try {
            LocalDate valor = valorTarihi.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            cashTransactionService.talepOlustur(hesapNo, talepKanali, emirVeren, valor, tutar,
                    paraBirimi, islemYonu, yontem, iban, karsiHesapNo, iymBankaHesabi, aciklama);
            mesaj = "Islem talebi olusturuldu (Hesap: " + hesapNo + ", Tutar: " + tutar + " " + paraBirimi + ")";
            talepler = cashTransactionService.getAll();
            Messagebox.show(mesaj, "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (IllegalArgumentException e) {
            mesaj = e.getMessage();
            Messagebox.show(mesaj, "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("talepler")
    public void onaylaVeTamamla(@BindingParam("item") CashTransactionRequest item) {
        Messagebox.show("Talep onaylanip tamamlansin mi? (Hesap: " + item.getAccount().getHesapNo()
                        + ", Tutar: " + item.getTutar() + " " + item.getParaBirimi() + ", Yon: " + item.getIslemYonu() + ")",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            cashTransactionService.onaylaVeTamamla(item.getId());
                            talepler = cashTransactionService.getAll();
                            Clients.showNotification("Talep tamamlandi, bakiye guncellendi.");
                        } catch (IllegalArgumentException | IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                        BindUtils.postNotifyChange(null, null, this, "talepler");
                    }
                });
    }

    @Command
    @NotifyChange("talepler")
    public void reddet(@BindingParam("item") CashTransactionRequest item) {
        Messagebox.show("Talep reddedilsin mi? (Hesap: " + item.getAccount().getHesapNo() + ")",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            cashTransactionService.reddet(item.getId());
                            talepler = cashTransactionService.getAll();
                            Clients.showNotification("Talep reddedildi.");
                        } catch (IllegalArgumentException | IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                        BindUtils.postNotifyChange(null, null, this, "talepler");
                    }
                });
    }
}
