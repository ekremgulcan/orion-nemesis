package com.orion.collateral.vm;

import com.orion.collateral.domain.Collateral;
import com.orion.collateral.service.CollateralService;
import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Account;
import com.orion.core.repository.AccountRepository;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.math.BigDecimal;
import java.util.List;

/**
 * "Teminat Transfer" ekrani icin ViewModel. Serbest Depo <-> Teminat
 * Deposu arasinda virman talebi olusturur (Nakit/Doviz, Pay Senedi,
 * Borclanma Araci, Fon tipleri).
 */
public class TeminatTransferViewModel {

    private final CollateralService collateralService = SpringContextHolder.getBean(CollateralService.class);
    private final AccountRepository accountRepository = SpringContextHolder.getBean(AccountRepository.class);

    private List<Collateral> depoKalemleri;
    private List<Account> hesaplar;
    private String depoAramaMetni;

    private String hesapNo;
    private String piyasa = "BIST";
    private String saklamaci = "MKK";
    private String teminatTipi = "NAKIT_DOVIZ";
    private String kaynakDepo = "SERBEST";
    private String hedefDepo = "TEMINAT";
    private String paraBirimi = "TRY";
    private BigDecimal miktar;
    private String aciklama;
    private String mesaj;

    @Init
    public void init() {
        depoKalemleri = collateralService.getAllCollaterals();
        hesaplar = accountRepository.findAll();
    }

    public List<Collateral> getDepoKalemleri() {
        return depoKalemleri;
    }

    public List<Account> getHesaplar() {
        return hesaplar;
    }

    public String getDepoAramaMetni() {
        return depoAramaMetni;
    }

    public void setDepoAramaMetni(String depoAramaMetni) {
        this.depoAramaMetni = depoAramaMetni;
    }

    @Command
    @NotifyChange("depoKalemleri")
    public void depoAra() {
        depoKalemleri = collateralService.searchCollaterals(depoAramaMetni);
    }

    public String getHesapNo() {
        return hesapNo;
    }

    public void setHesapNo(String hesapNo) {
        this.hesapNo = hesapNo;
    }

    public String getPiyasa() {
        return piyasa;
    }

    public void setPiyasa(String piyasa) {
        this.piyasa = piyasa;
    }

    public String getSaklamaci() {
        return saklamaci;
    }

    public void setSaklamaci(String saklamaci) {
        this.saklamaci = saklamaci;
    }

    public String getTeminatTipi() {
        return teminatTipi;
    }

    public void setTeminatTipi(String teminatTipi) {
        this.teminatTipi = teminatTipi;
    }

    public String getKaynakDepo() {
        return kaynakDepo;
    }

    public void setKaynakDepo(String kaynakDepo) {
        this.kaynakDepo = kaynakDepo;
    }

    public String getHedefDepo() {
        return hedefDepo;
    }

    public void setHedefDepo(String hedefDepo) {
        this.hedefDepo = hedefDepo;
    }

    public String getParaBirimi() {
        return paraBirimi;
    }

    public void setParaBirimi(String paraBirimi) {
        this.paraBirimi = paraBirimi;
    }

    public BigDecimal getMiktar() {
        return miktar;
    }

    public void setMiktar(BigDecimal miktar) {
        this.miktar = miktar;
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
    @NotifyChange({"depoKalemleri", "mesaj"})
    public void talepOlustur() {
        try {
            collateralService.talepOlustur(hesapNo, piyasa, saklamaci, teminatTipi,
                    kaynakDepo, hedefDepo, paraBirimi, miktar, aciklama);
        } catch (IllegalArgumentException ex) {
            mesaj = ex.getMessage();
            Messagebox.show(mesaj, "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }

        mesaj = "Transfer talebi olusturuldu (Hesap: " + hesapNo + ", Miktar: " + miktar + ")";
        depoKalemleri = collateralService.searchCollaterals(depoAramaMetni);
        Messagebox.show(mesaj, "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }
}
