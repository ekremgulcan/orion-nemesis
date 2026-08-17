package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Account;
import com.orion.core.domain.AccountCommission;
import com.orion.core.domain.AccountContract;
import com.orion.core.domain.AccountControlValue;
import com.orion.core.domain.AccountCustody;
import com.orion.core.domain.AccountChannel;
import com.orion.core.domain.AccountDerivativeCommission;
import com.orion.core.domain.AccountGroup;
import com.orion.core.domain.AccountHiddenAccount;
import com.orion.core.domain.AccountPartner;
import com.orion.core.domain.AccountProxy;
import com.orion.core.domain.AccountReportingPref;
import com.orion.core.domain.Customer;
import com.orion.core.domain.CustomerAddress;
import com.orion.core.domain.CustomerContact;
import com.orion.core.domain.CustomerEducation;
import com.orion.core.domain.CustomerExternalBankAccount;
import com.orion.core.domain.CustomerExternalUserId;
import com.orion.core.domain.CustomerIdentity;
import com.orion.core.domain.CustomerNote;
import com.orion.core.domain.CustomerReference;
import com.orion.core.domain.CustomerRequiredDocument;
import com.orion.core.domain.CustomerSuitabilityTest;
import com.orion.core.domain.CustomerWebmailerPref;
import com.orion.core.service.InvestorService;
import com.orion.core.service.InvestorSnapshot;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * Bireysel Yatirimci Bilgileri (bireysel-yatirimci.zul) ViewModel.
 */
public class BireyselYatirimciViewModel {

    private final InvestorService investorService = SpringContextHolder.getBean(InvestorService.class);

    private List<Account> hesapSecenekleri;
    private Account seciliHesap;
    private InvestorSnapshot snap;
    private boolean hesapModalAcik;
    private Account duzenlenenHesap;

    private String yeniAdresTipi = "Ikametgah";
    private String yeniAdresIl;
    private String yeniAdresIlce;
    private String yeniIletisimTipi = "Cep";
    private String yeniIletisimDeger;
    private String yeniKanal = "Sube";
    private String yeniNotTipi = "Bilgi";
    private String yeniNotMetni;
    private String yeniDisKurum;
    private String yeniDisHesapNo;
    private String yeniIban;
    private String yeniEgitimDerecesi = "Lisans";
    private String yeniOkul;
    private String yeniBolum;
    private String yeniReferansAdi;
    private String yeniReferansTelefon;
    private String yeniTestTipi = "Yerindelik Testi";
    private String yeniTestSonucu;
    private String yeniDisSistem;
    private String yeniDisKullaniciKodu;

    private String yeniVekilIsim;
    private String yeniVekilSoyisim;
    private String yeniVekilKimlik;
    private String yeniVekilTipi = "Vekil";
    private String yeniOrtakIsim;
    private String yeniOrtakSoyisim;
    private String yeniOrtakKimlik;
    private BigDecimal yeniOrtakPay;
    private String komisyonSablon = "Standart";
    private BigDecimal komisyonDeger = BigDecimal.ZERO;
    private String yeniHizmetTipi;
    private String yeniSozlesmeAdi;
    private String yeniHesapKanal = "Sube";
    private String yeniGrupAdi;
    private String yeniSaklamaci;
    private String yeniSaklamaHesapNo;
    private String yeniKontrolAdi;
    private String yeniKontrolDegeri;
    private String yeniRaporTipi;
    private String yeniGizliHesapNo;
    private String yeniTurevIslem;

    private List<AccountProxy> vekiller = Collections.emptyList();
    private List<AccountPartner> ortaklar = Collections.emptyList();
    private List<AccountCommission> komisyonlar = Collections.emptyList();
    private List<AccountContract> sozlesmeler = Collections.emptyList();
    private List<AccountChannel> hesapKanallari = Collections.emptyList();
    private List<AccountGroup> gruplar = Collections.emptyList();
    private List<AccountCustody> saklama = Collections.emptyList();
    private List<AccountControlValue> kontroller = Collections.emptyList();
    private List<AccountReportingPref> raporlar = Collections.emptyList();
    private List<AccountHiddenAccount> gizliHesaplar = Collections.emptyList();
    private List<AccountDerivativeCommission> turevKomisyonlari = Collections.emptyList();

    @Init
    public void init() {
        hesapSecenekleri = investorService.getHesapSecenekleri();
        snap = investorService.bosSnapshot();
        duzenlenenHesap = investorService.yeniHesapSablonu();
    }

    public List<Account> getHesapSecenekleri() {
        return hesapSecenekleri;
    }

    public Account getSeciliHesap() {
        return seciliHesap;
    }

    public void setSeciliHesap(Account seciliHesap) {
        this.seciliHesap = seciliHesap;
    }

    public Customer getYatirimci() {
        return snap.getCustomer();
    }

    public CustomerIdentity getKimlik() {
        return snap.getIdentity();
    }

    public String getSecilenMusteriOzet() {
        Customer c = snap.getCustomer();
        if (c.getId() == null) {
            return "";
        }
        return c.getMusteriNo() + " - " + c.getAdSoyadUnvan();
    }

    public List<Account> getHesaplar() { return snap.getHesaplar(); }
    public List<CustomerAddress> getAdresler() { return snap.getAdresler(); }
    public List<CustomerContact> getIletisimler() { return snap.getIletisimler(); }
    public List<com.orion.core.domain.CustomerChannel> getKanallar() { return snap.getKanallar(); }
    public List<CustomerRequiredDocument> getBelgeler() { return snap.getBelgeler(); }
    public List<CustomerNote> getNotlar() { return snap.getNotlar(); }
    public List<CustomerExternalBankAccount> getDisHesaplar() { return snap.getDisHesaplar(); }
    public List<CustomerEducation> getEgitimler() { return snap.getEgitimler(); }
    public List<CustomerReference> getReferanslar() { return snap.getReferanslar(); }
    public List<CustomerWebmailerPref> getWebmailer() { return snap.getWebmailer(); }
    public List<CustomerSuitabilityTest> getTestler() { return snap.getTestler(); }
    public List<CustomerExternalUserId> getDisKullanicilar() { return snap.getDisKullanicilar(); }

    public boolean isHesapModalAcik() { return hesapModalAcik; }
    public Account getDuzenlenenHesap() { return duzenlenenHesap; }

    public Date getDogumTarihi() { return toDate(snap.getCustomer().getDogumTarihi()); }
    public void setDogumTarihi(Date d) { snap.getCustomer().setDogumTarihi(toLocalDate(d)); }
    public Date getVerildigiTarih() { return toDate(snap.getIdentity().getVerildigiTarih()); }
    public void setVerildigiTarih(Date d) { snap.getIdentity().setVerildigiTarih(toLocalDate(d)); }
    public Date getSonGecerlilik() { return toDate(snap.getIdentity().getSonGecerlilik()); }
    public void setSonGecerlilik(Date d) { snap.getIdentity().setSonGecerlilik(toLocalDate(d)); }
    public Date getSurucuVerilisTarih() { return toDate(snap.getIdentity().getSurucuVerilisTarih()); }
    public void setSurucuVerilisTarih(Date d) { snap.getIdentity().setSurucuVerilisTarih(toLocalDate(d)); }
    public Date getSurucuGecerlilik() { return toDate(snap.getIdentity().getSurucuGecerlilik()); }
    public void setSurucuGecerlilik(Date d) { snap.getIdentity().setSurucuGecerlilik(toLocalDate(d)); }
    public Date getPasaportVerilis() { return toDate(snap.getIdentity().getPasaportVerilis()); }
    public void setPasaportVerilis(Date d) { snap.getIdentity().setPasaportVerilis(toLocalDate(d)); }
    public Date getPasaportGecerlilik() { return toDate(snap.getIdentity().getPasaportGecerlilik()); }
    public void setPasaportGecerlilik(Date d) { snap.getIdentity().setPasaportGecerlilik(toLocalDate(d)); }

    public String getYeniAdresTipi() { return yeniAdresTipi; }
    public void setYeniAdresTipi(String v) { this.yeniAdresTipi = v; }
    public String getYeniAdresIl() { return yeniAdresIl; }
    public void setYeniAdresIl(String v) { this.yeniAdresIl = v; }
    public String getYeniAdresIlce() { return yeniAdresIlce; }
    public void setYeniAdresIlce(String v) { this.yeniAdresIlce = v; }
    public String getYeniIletisimTipi() { return yeniIletisimTipi; }
    public void setYeniIletisimTipi(String v) { this.yeniIletisimTipi = v; }
    public String getYeniIletisimDeger() { return yeniIletisimDeger; }
    public void setYeniIletisimDeger(String v) { this.yeniIletisimDeger = v; }
    public String getYeniKanal() { return yeniKanal; }
    public void setYeniKanal(String v) { this.yeniKanal = v; }
    public String getYeniNotTipi() { return yeniNotTipi; }
    public void setYeniNotTipi(String v) { this.yeniNotTipi = v; }
    public String getYeniNotMetni() { return yeniNotMetni; }
    public void setYeniNotMetni(String v) { this.yeniNotMetni = v; }
    public String getYeniDisKurum() { return yeniDisKurum; }
    public void setYeniDisKurum(String v) { this.yeniDisKurum = v; }
    public String getYeniDisHesapNo() { return yeniDisHesapNo; }
    public void setYeniDisHesapNo(String v) { this.yeniDisHesapNo = v; }
    public String getYeniIban() { return yeniIban; }
    public void setYeniIban(String v) { this.yeniIban = v; }
    public String getYeniEgitimDerecesi() { return yeniEgitimDerecesi; }
    public void setYeniEgitimDerecesi(String v) { this.yeniEgitimDerecesi = v; }
    public String getYeniOkul() { return yeniOkul; }
    public void setYeniOkul(String v) { this.yeniOkul = v; }
    public String getYeniBolum() { return yeniBolum; }
    public void setYeniBolum(String v) { this.yeniBolum = v; }
    public String getYeniReferansAdi() { return yeniReferansAdi; }
    public void setYeniReferansAdi(String v) { this.yeniReferansAdi = v; }
    public String getYeniReferansTelefon() { return yeniReferansTelefon; }
    public void setYeniReferansTelefon(String v) { this.yeniReferansTelefon = v; }
    public String getYeniTestTipi() { return yeniTestTipi; }
    public void setYeniTestTipi(String v) { this.yeniTestTipi = v; }
    public String getYeniTestSonucu() { return yeniTestSonucu; }
    public void setYeniTestSonucu(String v) { this.yeniTestSonucu = v; }
    public String getYeniDisSistem() { return yeniDisSistem; }
    public void setYeniDisSistem(String v) { this.yeniDisSistem = v; }
    public String getYeniDisKullaniciKodu() { return yeniDisKullaniciKodu; }
    public void setYeniDisKullaniciKodu(String v) { this.yeniDisKullaniciKodu = v; }

    public String getYeniVekilIsim() { return yeniVekilIsim; }
    public void setYeniVekilIsim(String v) { this.yeniVekilIsim = v; }
    public String getYeniVekilSoyisim() { return yeniVekilSoyisim; }
    public void setYeniVekilSoyisim(String v) { this.yeniVekilSoyisim = v; }
    public String getYeniVekilKimlik() { return yeniVekilKimlik; }
    public void setYeniVekilKimlik(String v) { this.yeniVekilKimlik = v; }
    public String getYeniVekilTipi() { return yeniVekilTipi; }
    public void setYeniVekilTipi(String v) { this.yeniVekilTipi = v; }
    public String getYeniOrtakIsim() { return yeniOrtakIsim; }
    public void setYeniOrtakIsim(String v) { this.yeniOrtakIsim = v; }
    public String getYeniOrtakSoyisim() { return yeniOrtakSoyisim; }
    public void setYeniOrtakSoyisim(String v) { this.yeniOrtakSoyisim = v; }
    public String getYeniOrtakKimlik() { return yeniOrtakKimlik; }
    public void setYeniOrtakKimlik(String v) { this.yeniOrtakKimlik = v; }
    public BigDecimal getYeniOrtakPay() { return yeniOrtakPay; }
    public void setYeniOrtakPay(BigDecimal v) { this.yeniOrtakPay = v; }
    public String getKomisyonSablon() { return komisyonSablon; }
    public void setKomisyonSablon(String v) { this.komisyonSablon = v; }
    public BigDecimal getKomisyonDeger() { return komisyonDeger; }
    public void setKomisyonDeger(BigDecimal v) { this.komisyonDeger = v; }
    public String getYeniHizmetTipi() { return yeniHizmetTipi; }
    public void setYeniHizmetTipi(String v) { this.yeniHizmetTipi = v; }
    public String getYeniSozlesmeAdi() { return yeniSozlesmeAdi; }
    public void setYeniSozlesmeAdi(String v) { this.yeniSozlesmeAdi = v; }
    public String getYeniHesapKanal() { return yeniHesapKanal; }
    public void setYeniHesapKanal(String v) { this.yeniHesapKanal = v; }
    public String getYeniGrupAdi() { return yeniGrupAdi; }
    public void setYeniGrupAdi(String v) { this.yeniGrupAdi = v; }
    public String getYeniSaklamaci() { return yeniSaklamaci; }
    public void setYeniSaklamaci(String v) { this.yeniSaklamaci = v; }
    public String getYeniSaklamaHesapNo() { return yeniSaklamaHesapNo; }
    public void setYeniSaklamaHesapNo(String v) { this.yeniSaklamaHesapNo = v; }
    public String getYeniKontrolAdi() { return yeniKontrolAdi; }
    public void setYeniKontrolAdi(String v) { this.yeniKontrolAdi = v; }
    public String getYeniKontrolDegeri() { return yeniKontrolDegeri; }
    public void setYeniKontrolDegeri(String v) { this.yeniKontrolDegeri = v; }
    public String getYeniRaporTipi() { return yeniRaporTipi; }
    public void setYeniRaporTipi(String v) { this.yeniRaporTipi = v; }
    public String getYeniGizliHesapNo() { return yeniGizliHesapNo; }
    public void setYeniGizliHesapNo(String v) { this.yeniGizliHesapNo = v; }
    public String getYeniTurevIslem() { return yeniTurevIslem; }
    public void setYeniTurevIslem(String v) { this.yeniTurevIslem = v; }

    public List<AccountProxy> getVekiller() { return vekiller; }
    public List<AccountPartner> getOrtaklar() { return ortaklar; }
    public List<AccountCommission> getKomisyonlar() { return komisyonlar; }
    public List<AccountContract> getSozlesmeler() { return sozlesmeler; }
    public List<AccountChannel> getHesapKanallari() { return hesapKanallari; }
    public List<AccountGroup> getGruplar() { return gruplar; }
    public List<AccountCustody> getSaklama() { return saklama; }
    public List<AccountControlValue> getKontroller() { return kontroller; }
    public List<AccountReportingPref> getRaporlar() { return raporlar; }
    public List<AccountHiddenAccount> getGizliHesaplar() { return gizliHesaplar; }
    public List<AccountDerivativeCommission> getTurevKomisyonlari() { return turevKomisyonlari; }

    @Command
    @NotifyChange("*")
    public void getir() {
        if (seciliHesap == null) {
            Messagebox.show("Lutfen hesap seciniz.", "Uyari", Messagebox.OK, Messagebox.EXCLAMATION);
            return;
        }
        snap = investorService.yukleByAccountId(seciliHesap.getId());
    }

    @Command
    @NotifyChange("*")
    public void yeniYatirimci() {
        seciliHesap = null;
        snap = investorService.bosSnapshot();
        hesapModalAcik = false;
    }

    @Command
    @NotifyChange("*")
    public void kaydet() {
        try {
            Customer saved = investorService.kaydetYatirimci(snap.getCustomer(), snap.getIdentity());
            snap = investorService.yukleByCustomerId(saved.getId());
            hesapSecenekleri = investorService.getHesapSecenekleri();
            Messagebox.show("Yatirimci kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    public void sistemleriKontrolEt() {
        Messagebox.show("Sistem kontrolu (MKK/Takasbank) bu ortamda simule edilir. Sicil no kayitlidir.",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    public void yatirimciDokumanlari() {
        Messagebox.show("Yatirimci dokumanlari Gerekli Belgeler sekmesinde yonetilir.",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    public void segmentasyonFormu() {
        Messagebox.show("Segmentasyon formu henuz ayri bir ekran olarak baglanmadi.",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("*")
    public void hesapEkle() {
        if (snap.getCustomer().getId() == null) {
            Messagebox.show("Once yatirimci kaydedilmelidir.", "Uyari", Messagebox.OK, Messagebox.EXCLAMATION);
            return;
        }
        duzenlenenHesap = investorService.yeniHesapSablonu();
        temizleHesapAltListeleri();
        hesapModalAcik = true;
    }

    @Command
    @NotifyChange("*")
    public void hesapDuzenle(@BindingParam("item") Account item) {
        duzenlenenHesap = item;
        yukleHesapAltListeleri(item.getId());
        hesapModalAcik = true;
    }

    @Command
    @NotifyChange("hesapModalAcik")
    public void hesapModalKapat() {
        hesapModalAcik = false;
    }

    @Command
    @NotifyChange("*")
    public void hesapKaydet() {
        try {
            Account saved = investorService.kaydetHesap(snap.getCustomer().getId(), duzenlenenHesap);
            snap = investorService.yukleByCustomerId(snap.getCustomer().getId());
            hesapSecenekleri = investorService.getHesapSecenekleri();
            duzenlenenHesap = saved;
            yukleHesapAltListeleri(saved.getId());
            Messagebox.show("Hesap kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    public void riskTercihleriniAc() {
        Messagebox.show("Risk tercihleri VIOP Risk Profili Tanim ekranindan yonetilir.",
                "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("adresler")
    public void adresEkle() {
        try {
            CustomerAddress a = new CustomerAddress();
            a.setAdresTipi(yeniAdresTipi);
            a.setIl(yeniAdresIl);
            a.setIlce(yeniAdresIlce);
            a.setUlke("TURKIYE");
            investorService.adresEkle(snap.getCustomer().getId(), a);
            snap.setAdresler(investorService.yukleByCustomerId(snap.getCustomer().getId()).getAdresler());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("adresler")
    public void adresSil(@BindingParam("item") CustomerAddress item) {
        investorService.adresSil(item.getId());
        snap.setAdresler(investorService.yukleByCustomerId(snap.getCustomer().getId()).getAdresler());
    }

    @Command
    @NotifyChange("iletisimler")
    public void iletisimEkle() {
        try {
            CustomerContact c = new CustomerContact();
            c.setIletisimTipi(yeniIletisimTipi);
            c.setDeger(yeniIletisimDeger);
            investorService.iletisimEkle(snap.getCustomer().getId(), c);
            snap.setIletisimler(investorService.yukleByCustomerId(snap.getCustomer().getId()).getIletisimler());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("kanallar")
    public void kanalEkle() {
        try {
            investorService.kanalEkle(snap.getCustomer().getId(), yeniKanal);
            snap.setKanallar(investorService.yukleByCustomerId(snap.getCustomer().getId()).getKanallar());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("belgeler")
    public void belgelerKaydet() {
        try {
            investorService.belgelerKaydet(snap.getBelgeler());
            Messagebox.show("Belgeler kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("notlar")
    public void notEkle() {
        try {
            investorService.notEkle(snap.getCustomer().getId(), yeniNotTipi, yeniNotMetni);
            snap.setNotlar(investorService.yukleByCustomerId(snap.getCustomer().getId()).getNotlar());
            yeniNotMetni = null;
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("notlar")
    public void notSil(@BindingParam("item") CustomerNote item) {
        investorService.notSil(item.getId());
        snap.setNotlar(investorService.yukleByCustomerId(snap.getCustomer().getId()).getNotlar());
    }

    @Command
    @NotifyChange("disHesaplar")
    public void disHesapEkle() {
        try {
            CustomerExternalBankAccount a = new CustomerExternalBankAccount();
            a.setReferansKurum(yeniDisKurum);
            a.setHesapNo(yeniDisHesapNo);
            a.setIban(yeniIban);
            a.setParaBirimi("TRY");
            investorService.disHesapEkle(snap.getCustomer().getId(), a);
            snap.setDisHesaplar(investorService.yukleByCustomerId(snap.getCustomer().getId()).getDisHesaplar());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("egitimler")
    public void egitimEkle() {
        try {
            CustomerEducation e = new CustomerEducation();
            e.setEgitimDerecesi(yeniEgitimDerecesi);
            e.setOkul(yeniOkul);
            e.setBolum(yeniBolum);
            investorService.egitimEkle(snap.getCustomer().getId(), e);
            snap.setEgitimler(investorService.yukleByCustomerId(snap.getCustomer().getId()).getEgitimler());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("referanslar")
    public void referansEkle() {
        try {
            CustomerReference r = new CustomerReference();
            r.setReferansAdi(yeniReferansAdi);
            r.setReferansTelefon(yeniReferansTelefon);
            investorService.referansEkle(snap.getCustomer().getId(), r);
            snap.setReferanslar(investorService.yukleByCustomerId(snap.getCustomer().getId()).getReferanslar());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("webmailer")
    public void webmailerKaydet() {
        try {
            investorService.webmailerKaydet(snap.getWebmailer());
            Messagebox.show("WebMailer tercihleri kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("testler")
    public void testEkle() {
        try {
            investorService.testEkle(snap.getCustomer().getId(), yeniTestTipi, LocalDate.now(), yeniTestSonucu);
            snap.setTestler(investorService.yukleByCustomerId(snap.getCustomer().getId()).getTestler());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("disKullanicilar")
    public void disKullaniciEkle() {
        try {
            investorService.disKullaniciEkle(snap.getCustomer().getId(), yeniDisSistem, yeniDisKullaniciKodu);
            snap.setDisKullanicilar(investorService.yukleByCustomerId(snap.getCustomer().getId()).getDisKullanicilar());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("vekiller")
    public void vekilEkle() {
        try {
            AccountProxy p = new AccountProxy();
            p.setIsim(yeniVekilIsim);
            p.setSoyisim(yeniVekilSoyisim);
            p.setKimlikNo(yeniVekilKimlik);
            p.setVekilTipi(yeniVekilTipi);
            investorService.proxyEkle(duzenlenenHesap.getId(), p);
            vekiller = investorService.proxyList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("ortaklar")
    public void ortakEkle() {
        try {
            AccountPartner p = new AccountPartner();
            p.setIsim(yeniOrtakIsim);
            p.setSoyisim(yeniOrtakSoyisim);
            p.setKimlikNo(yeniOrtakKimlik);
            p.setOrtaklikPayi(yeniOrtakPay);
            investorService.partnerEkle(duzenlenenHesap.getId(), p);
            ortaklar = investorService.partnerList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("komisyonlar")
    public void komisyonSablonuGetir() {
        try {
            investorService.komisyonSablonuGetir(duzenlenenHesap.getId(), komisyonDeger);
            komisyonlar = investorService.commissionList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("sozlesmeler")
    public void sozlesmeEkle() {
        try {
            AccountContract c = new AccountContract();
            c.setHizmetTipi(yeniHizmetTipi);
            c.setSozlesmeAdi(yeniSozlesmeAdi);
            c.setGetirilisTarihi(LocalDate.now());
            c.setVersiyon("1");
            investorService.sozlesmeEkle(duzenlenenHesap.getId(), c);
            sozlesmeler = investorService.contractList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("hesapKanallari")
    public void hesapKanalEkle() {
        try {
            investorService.accountKanalEkle(duzenlenenHesap.getId(), yeniHesapKanal);
            hesapKanallari = investorService.accountChannelList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("gruplar")
    public void grupEkle() {
        try {
            investorService.grupEkle(duzenlenenHesap.getId(), yeniGrupAdi);
            gruplar = investorService.groupList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("saklama")
    public void saklamaEkle() {
        try {
            AccountCustody c = new AccountCustody();
            c.setSaklamaci(yeniSaklamaci);
            c.setSaklamaHesapNo(yeniSaklamaHesapNo);
            c.setParaBirimi("TRY");
            investorService.saklamaEkle(duzenlenenHesap.getId(), c);
            saklama = investorService.custodyList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("kontroller")
    public void kontrolEkle() {
        try {
            investorService.kontrolEkle(duzenlenenHesap.getId(), yeniKontrolAdi, yeniKontrolDegeri);
            kontroller = investorService.controlList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("raporlar")
    public void raporEkle() {
        try {
            investorService.raporEkle(duzenlenenHesap.getId(), yeniRaporTipi, "E-Posta");
            raporlar = investorService.reportingList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("gizliHesaplar")
    public void gizliHesapEkle() {
        try {
            investorService.gizliHesapEkle(duzenlenenHesap.getId(), yeniGizliHesapNo);
            gizliHesaplar = investorService.hiddenList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange("turevKomisyonlari")
    public void turevEkle() {
        try {
            AccountDerivativeCommission d = new AccountDerivativeCommission();
            d.setIslem(yeniTurevIslem);
            d.setParaBirimi("TRY");
            d.setKomisyonDegeri(komisyonDeger);
            investorService.turevEkle(duzenlenenHesap.getId(), d);
            turevKomisyonlari = investorService.derivativeList(duzenlenenHesap.getId());
        } catch (RuntimeException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    private void yukleHesapAltListeleri(Long accountId) {
        vekiller = investorService.proxyList(accountId);
        ortaklar = investorService.partnerList(accountId);
        komisyonlar = investorService.commissionList(accountId);
        sozlesmeler = investorService.contractList(accountId);
        hesapKanallari = investorService.accountChannelList(accountId);
        gruplar = investorService.groupList(accountId);
        saklama = investorService.custodyList(accountId);
        kontroller = investorService.controlList(accountId);
        raporlar = investorService.reportingList(accountId);
        gizliHesaplar = investorService.hiddenList(accountId);
        turevKomisyonlari = investorService.derivativeList(accountId);
    }

    private void temizleHesapAltListeleri() {
        vekiller = Collections.emptyList();
        ortaklar = Collections.emptyList();
        komisyonlar = Collections.emptyList();
        sozlesmeler = Collections.emptyList();
        hesapKanallari = Collections.emptyList();
        gruplar = Collections.emptyList();
        saklama = Collections.emptyList();
        kontroller = Collections.emptyList();
        raporlar = Collections.emptyList();
        gizliHesaplar = Collections.emptyList();
        turevKomisyonlari = Collections.emptyList();
    }

    private Date toDate(LocalDate d) {
        if (d == null) {
            return null;
        }
        return Date.from(d.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    private LocalDate toLocalDate(Date d) {
        if (d == null) {
            return null;
        }
        return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }
}
