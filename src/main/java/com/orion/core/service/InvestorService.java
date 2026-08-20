package com.orion.core.service;

import com.orion.core.domain.Account;
import com.orion.core.domain.AccountChannel;
import com.orion.core.domain.AccountCommission;
import com.orion.core.domain.AccountContract;
import com.orion.core.domain.AccountControlValue;
import com.orion.core.domain.AccountCustody;
import com.orion.core.domain.AccountDerivativeCommission;
import com.orion.core.domain.AccountGroup;
import com.orion.core.domain.AccountHiddenAccount;
import com.orion.core.domain.AccountPartner;
import com.orion.core.domain.AccountProxy;
import com.orion.core.domain.AccountReportingPref;
import com.orion.core.domain.Customer;
import com.orion.core.domain.CustomerAddress;
import com.orion.core.domain.CustomerChannel;
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
import com.orion.core.repository.AccountChannelRepository;
import com.orion.core.repository.AccountCommissionRepository;
import com.orion.core.repository.AccountContractRepository;
import com.orion.core.repository.AccountControlValueRepository;
import com.orion.core.repository.AccountCustodyRepository;
import com.orion.core.repository.AccountDerivativeCommissionRepository;
import com.orion.core.repository.AccountGroupRepository;
import com.orion.core.repository.AccountHiddenAccountRepository;
import com.orion.core.repository.AccountPartnerRepository;
import com.orion.core.repository.AccountProxyRepository;
import com.orion.core.repository.AccountReportingPrefRepository;
import com.orion.core.repository.AccountRepository;
import com.orion.core.repository.CustomerAddressRepository;
import com.orion.core.repository.CustomerChannelRepository;
import com.orion.core.repository.CustomerContactRepository;
import com.orion.core.repository.CustomerEducationRepository;
import com.orion.core.repository.CustomerExternalBankAccountRepository;
import com.orion.core.repository.CustomerExternalUserIdRepository;
import com.orion.core.repository.CustomerIdentityRepository;
import com.orion.core.repository.CustomerNoteRepository;
import com.orion.core.repository.CustomerReferenceRepository;
import com.orion.core.repository.CustomerRepository;
import com.orion.core.repository.CustomerRequiredDocumentRepository;
import com.orion.core.repository.CustomerSuitabilityTestRepository;
import com.orion.core.repository.CustomerWebmailerPrefRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Bireysel Yatirimci Bilgileri" ekraninin is mantigi.
 * Musteri master + alt sekmeler + hesap duzenleme alt sekmeleri.
 */
@Service
public class InvestorService {

    private static final String[] VARSAYILAN_BELGELER = {
            "Nufus huviyet cuzdani, surucu belgesi veya pasaportun sureti veya fotokopisi",
            "Bir adet fotograf",
            "Daha once almis ise Takasbank sicil numarasi",
            "Yatirim Hizmet ve Faaliyetleri Genel Risk Bildirim Formu",
            "Mukimlik Belgesi",
            "Genel Virman Talimati",
            "Sermaye Piyasasi Araclarina Yatirim Yapan Nihai Yatirimci Beyani"
    };

    private static final String[] VARSAYILAN_WEBMAILER = {
            "Is Yatirim - Piyasalarda Bugun",
            "Is Yatirim - Haftaya Bakis",
            "Is Yatirim - Aylik Bulten",
            "Is Yatirim - Odak Noktasi",
            "IS Investment - Daily Market Watch",
            "IS Investment - Focal Point",
            "IS Investment - Company Report",
            "IS Investment - Sector Report",
            "Is Yatirim - Uluslararasi Piyasalar - Gunluk Rapor"
    };

    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final CustomerIdentityRepository identityRepository;
    private final CustomerAddressRepository addressRepository;
    private final CustomerContactRepository contactRepository;
    private final CustomerChannelRepository customerChannelRepository;
    private final CustomerRequiredDocumentRepository documentRepository;
    private final CustomerNoteRepository noteRepository;
    private final CustomerExternalBankAccountRepository externalBankRepository;
    private final CustomerEducationRepository educationRepository;
    private final CustomerReferenceRepository referenceRepository;
    private final CustomerWebmailerPrefRepository webmailerRepository;
    private final CustomerSuitabilityTestRepository suitabilityRepository;
    private final CustomerExternalUserIdRepository externalUserRepository;
    private final AccountProxyRepository proxyRepository;
    private final AccountPartnerRepository partnerRepository;
    private final AccountCommissionRepository commissionRepository;
    private final AccountContractRepository contractRepository;
    private final AccountChannelRepository accountChannelRepository;
    private final AccountGroupRepository groupRepository;
    private final AccountCustodyRepository custodyRepository;
    private final AccountControlValueRepository controlValueRepository;
    private final AccountReportingPrefRepository reportingPrefRepository;
    private final AccountHiddenAccountRepository hiddenAccountRepository;
    private final AccountDerivativeCommissionRepository derivativeCommissionRepository;

    public InvestorService(CustomerRepository customerRepository,
                           AccountRepository accountRepository,
                           CustomerIdentityRepository identityRepository,
                           CustomerAddressRepository addressRepository,
                           CustomerContactRepository contactRepository,
                           CustomerChannelRepository customerChannelRepository,
                           CustomerRequiredDocumentRepository documentRepository,
                           CustomerNoteRepository noteRepository,
                           CustomerExternalBankAccountRepository externalBankRepository,
                           CustomerEducationRepository educationRepository,
                           CustomerReferenceRepository referenceRepository,
                           CustomerWebmailerPrefRepository webmailerRepository,
                           CustomerSuitabilityTestRepository suitabilityRepository,
                           CustomerExternalUserIdRepository externalUserRepository,
                           AccountProxyRepository proxyRepository,
                           AccountPartnerRepository partnerRepository,
                           AccountCommissionRepository commissionRepository,
                           AccountContractRepository contractRepository,
                           AccountChannelRepository accountChannelRepository,
                           AccountGroupRepository groupRepository,
                           AccountCustodyRepository custodyRepository,
                           AccountControlValueRepository controlValueRepository,
                           AccountReportingPrefRepository reportingPrefRepository,
                           AccountHiddenAccountRepository hiddenAccountRepository,
                           AccountDerivativeCommissionRepository derivativeCommissionRepository) {
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.identityRepository = identityRepository;
        this.addressRepository = addressRepository;
        this.contactRepository = contactRepository;
        this.customerChannelRepository = customerChannelRepository;
        this.documentRepository = documentRepository;
        this.noteRepository = noteRepository;
        this.externalBankRepository = externalBankRepository;
        this.educationRepository = educationRepository;
        this.referenceRepository = referenceRepository;
        this.webmailerRepository = webmailerRepository;
        this.suitabilityRepository = suitabilityRepository;
        this.externalUserRepository = externalUserRepository;
        this.proxyRepository = proxyRepository;
        this.partnerRepository = partnerRepository;
        this.commissionRepository = commissionRepository;
        this.contractRepository = contractRepository;
        this.accountChannelRepository = accountChannelRepository;
        this.groupRepository = groupRepository;
        this.custodyRepository = custodyRepository;
        this.controlValueRepository = controlValueRepository;
        this.reportingPrefRepository = reportingPrefRepository;
        this.hiddenAccountRepository = hiddenAccountRepository;
        this.derivativeCommissionRepository = derivativeCommissionRepository;
    }

    public List<Account> getHesapSecenekleri() {
        return accountRepository.findAllFetched();
    }

    public InvestorSnapshot bosSnapshot() {
        InvestorSnapshot snap = new InvestorSnapshot();
        Customer c = new Customer();
        c.setMusteriTipi("BIREYSEL");
        c.setRiskGrubu("ORTA");
        c.setAktif(true);
        c.setYatirimciNo(0L);
        c.setUyruk("TURKIYE");
        c.setSube("Genel Mudurluk");
        c.setYatirimciLokasyonTipi("Yurtici Yerlesik");
        c.setVergiMukellefiyeti("Tam Mukellef");
        c.setYatirimciTipi("Resit ve mumeyyiz gercek kisiler");
        c.setYatirimciDurumu("Aktif");
        c.setIysAramaIzni("Onaysiz");
        c.setIysEpostaIzni("Onaysiz");
        c.setIysSmsIzni("Onaysiz");
        snap.setCustomer(c);
        CustomerIdentity identity = new CustomerIdentity();
        identity.setCustomer(c);
        snap.setIdentity(identity);
        return snap;
    }

    @Transactional(readOnly = true)
    public InvestorSnapshot yukleByAccountId(Long accountId) {
        Account account = accountRepository.findByIdFetched(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Hesap bulunamadi"));
        return yukleByCustomerId(account.getCustomer().getId());
    }

    @Transactional(readOnly = true)
    public InvestorSnapshot yukleByCustomerId(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Musteri bulunamadi: " + customerId));
        InvestorSnapshot snap = new InvestorSnapshot();
        snap.setCustomer(customer);
        snap.setIdentity(identityRepository.findByCustomerId(customerId).orElseGet(() -> {
            CustomerIdentity identity = new CustomerIdentity();
            identity.setCustomer(customer);
            return identity;
        }));
        snap.setHesaplar(accountRepository.findByCustomerIdFetched(customerId));
        snap.setAdresler(addressRepository.findByCustomerId(customerId));
        snap.setIletisimler(contactRepository.findByCustomerId(customerId));
        snap.setKanallar(customerChannelRepository.findByCustomerId(customerId));
        snap.setBelgeler(documentRepository.findByCustomerId(customerId));
        snap.setNotlar(noteRepository.findByCustomerId(customerId));
        snap.setDisHesaplar(externalBankRepository.findByCustomerId(customerId));
        snap.setEgitimler(educationRepository.findByCustomerId(customerId));
        snap.setReferanslar(referenceRepository.findByCustomerId(customerId));
        snap.setWebmailer(webmailerRepository.findByCustomerId(customerId));
        snap.setTestler(suitabilityRepository.findByCustomerId(customerId));
        snap.setDisKullanicilar(externalUserRepository.findByCustomerId(customerId));
        return snap;
    }

    @Transactional
    public Customer kaydetYatirimci(Customer form, CustomerIdentity identityForm) {
        if (form.getTcknVkn() == null || form.getTcknVkn().isBlank()) {
            throw new IllegalArgumentException("TCKN / YKN bos birakilamaz");
        }
        if (form.getIsim() == null || form.getIsim().isBlank()) {
            throw new IllegalArgumentException("Isim bos birakilamaz");
        }
        boolean yeni = form.getId() == null;
        Customer customer;
        if (yeni) {
            customer = new Customer();
            customer.setOlusturmaTarihi(LocalDateTime.now());
            customer.setMusteriTipi("BIREYSEL");
            customer.setRiskGrubu(form.getRiskGrubu() == null ? "ORTA" : form.getRiskGrubu());
            customer.setMusteriNo(sonrakiMusteriNo());
            customer.setYatirimciNo(sonrakiYatirimciNo());
        } else {
            customer = customerRepository.findById(form.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Musteri bulunamadi: " + form.getId()));
        }
        kopyalaYatirimciAlanlari(form, customer);
        String soyad = customer.getSoyisim() == null ? "" : customer.getSoyisim();
        customer.setAdSoyadUnvan((customer.getIsim() + " " + soyad).trim());
        customer.setAktif(!"Pasif".equalsIgnoreCase(customer.getYatirimciDurumu())
                && !"Kapali".equalsIgnoreCase(customer.getYatirimciDurumu()));
        if (customer.getTelefon() == null && form.getTelefon() != null) {
            customer.setTelefon(form.getTelefon());
        }
        try {
            customer = customerRepository.save(customer);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Kayit sirasinda hata olustu (Musteri No / TCKN benzersiz olmali): "
                            + ex.getMostSpecificCause().getMessage());
        }
        kaydetKimlik(customer, identityForm);
        if (yeni) {
            varsayilanBelgeVeRaporlariOlustur(customer);
        }
        return customer;
    }

    @Transactional
    public Account kaydetHesap(Long customerId, Account form) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Once yatirimci kaydedilmelidir"));
        boolean yeni = form.getId() == null;
        Account account;
        if (yeni) {
            account = new Account();
            account.setCustomer(customer);
            account.setHesapNo(sonrakiHesapNo());
            account.setHesapTipi(form.getHesapTipi() == null || form.getHesapTipi().isBlank() ? "NAKIT" : form.getHesapTipi());
            account.setAcilisTarihi(LocalDateTime.now());
        } else {
            account = accountRepository.findById(form.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Hesap bulunamadi"));
        }
        account.setDurum(form.getDurum() == null || form.getDurum().isBlank() ? "AKTIF" : form.getDurum());
        account.setHesapSinifi(form.getHesapSinifi());
        account.setYatirimDanismani(form.getYatirimDanismani());
        account.setProfilTanimi(form.getProfilTanimi());
        account.setAfkKodu(form.getAfkKodu());
        account.setMpfTipi(form.getMpfTipi());
        account.setAltSube(form.getAltSube());
        account.setHesapMusteriTipi(form.getHesapMusteriTipi());
        account.setAcenta(form.getAcenta());
        account.setHesapSube(form.getHesapSube());
        account.setSikKullanilan(form.isSikKullanilan());
        account.setOzelSozlesme(form.isOzelSozlesme());
        account.setPortfoyHesabi(form.isPortfoyHesabi());
        account.setKolokasyonHesabi(form.isKolokasyonHesabi());
        account.setViop(form.isViop());
        account.setWebmailerEkstre(form.isWebmailerEkstre());
        account.setLme(form.isLme());
        account.setYtmHisse(form.isYtmHisse());
        account.setYtmFon(form.isYtmFon());
        account.setYtmViop(form.isYtmViop());
        return accountRepository.save(account);
    }

    public Account yeniHesapSablonu() {
        Account a = new Account();
        a.setHesapTipi("NAKIT");
        a.setDurum("AKTIF");
        a.setHesapSinifi("Genel");
        a.setMpfTipi("M");
        a.setAfkKodu("IYM");
        a.setHesapMusteriTipi("Musteri");
        a.setHesapSube("Genel Mudurluk");
        return a;
    }

    @Transactional
    public CustomerAddress adresEkle(Long customerId, CustomerAddress form) {
        Customer customer = musteriZorunlu(customerId);
        if (form.getAdresTipi() == null || form.getAdresTipi().isBlank()) {
            throw new IllegalArgumentException("Adres tipi bos birakilamaz");
        }
        form.setId(null);
        form.setCustomer(customer);
        return addressRepository.save(form);
    }

    @Transactional
    public void adresSil(Long id) {
        addressRepository.deleteById(id);
    }

    @Transactional
    public CustomerContact iletisimEkle(Long customerId, CustomerContact form) {
        Customer customer = musteriZorunlu(customerId);
        if (form.getIletisimTipi() == null || form.getIletisimTipi().isBlank()
                || form.getDeger() == null || form.getDeger().isBlank()) {
            throw new IllegalArgumentException("Iletisim tipi ve deger bos birakilamaz");
        }
        form.setId(null);
        form.setCustomer(customer);
        return contactRepository.save(form);
    }

    @Transactional
    public void iletisimSil(Long id) {
        contactRepository.deleteById(id);
    }

    @Transactional
    public CustomerChannel kanalEkle(Long customerId, String kanal) {
        Customer customer = musteriZorunlu(customerId);
        if (kanal == null || kanal.isBlank()) {
            throw new IllegalArgumentException("Kanal bos birakilamaz");
        }
        CustomerChannel ch = new CustomerChannel();
        ch.setCustomer(customer);
        ch.setKanal(kanal);
        ch.setYetkili(true);
        ch.setDurum("AKTIF");
        return customerChannelRepository.save(ch);
    }

    @Transactional
    public void kanalSil(Long id) {
        customerChannelRepository.deleteById(id);
    }

    @Transactional
    public void belgelerKaydet(List<CustomerRequiredDocument> belgeler) {
        documentRepository.saveAll(belgeler);
    }

    @Transactional
    public CustomerNote notEkle(Long customerId, String notTipi, String notMetni) {
        Customer customer = musteriZorunlu(customerId);
        if (notTipi == null || notTipi.isBlank() || notMetni == null || notMetni.isBlank()) {
            throw new IllegalArgumentException("Not tipi ve not bos birakilamaz");
        }
        CustomerNote note = new CustomerNote();
        note.setCustomer(customer);
        note.setNotTipi(notTipi);
        note.setNotMetni(notMetni);
        note.setGuncellemeTarihi(LocalDateTime.now());
        return noteRepository.save(note);
    }

    @Transactional
    public void notSil(Long id) {
        noteRepository.deleteById(id);
    }

    @Transactional
    public CustomerExternalBankAccount disHesapEkle(Long customerId, CustomerExternalBankAccount form) {
        Customer customer = musteriZorunlu(customerId);
        if (form.getHesapNo() == null || form.getHesapNo().isBlank()) {
            throw new IllegalArgumentException("Hesap no bos birakilamaz");
        }
        form.setId(null);
        form.setCustomer(customer);
        return externalBankRepository.save(form);
    }

    @Transactional
    public void disHesapSil(Long id) {
        externalBankRepository.deleteById(id);
    }

    @Transactional
    public CustomerEducation egitimEkle(Long customerId, CustomerEducation form) {
        Customer customer = musteriZorunlu(customerId);
        if (form.getEgitimDerecesi() == null || form.getEgitimDerecesi().isBlank()) {
            throw new IllegalArgumentException("Egitim derecesi bos birakilamaz");
        }
        form.setId(null);
        form.setCustomer(customer);
        return educationRepository.save(form);
    }

    @Transactional
    public void egitimSil(Long id) {
        educationRepository.deleteById(id);
    }

    @Transactional
    public CustomerReference referansEkle(Long customerId, CustomerReference form) {
        Customer customer = musteriZorunlu(customerId);
        if (form.getReferansAdi() == null || form.getReferansAdi().isBlank()) {
            throw new IllegalArgumentException("Referans adi bos birakilamaz");
        }
        form.setId(null);
        form.setCustomer(customer);
        return referenceRepository.save(form);
    }

    @Transactional
    public void referansSil(Long id) {
        referenceRepository.deleteById(id);
    }

    @Transactional
    public void webmailerKaydet(List<CustomerWebmailerPref> prefs) {
        webmailerRepository.saveAll(prefs);
    }

    @Transactional
    public CustomerSuitabilityTest testEkle(Long customerId, String testTipi, LocalDate testTarihi, String testSonucu) {
        Customer customer = musteriZorunlu(customerId);
        if (testTipi == null || testTipi.isBlank()) {
            throw new IllegalArgumentException("Test tipi bos birakilamaz");
        }
        CustomerSuitabilityTest t = new CustomerSuitabilityTest();
        t.setCustomer(customer);
        t.setTestTipi(testTipi);
        t.setTestTarihi(testTarihi);
        t.setTestSonucu(testSonucu);
        return suitabilityRepository.save(t);
    }

    @Transactional
    public CustomerExternalUserId disKullaniciEkle(Long customerId, String disSistem, String kullaniciKodu) {
        Customer customer = musteriZorunlu(customerId);
        if (disSistem == null || disSistem.isBlank() || kullaniciKodu == null || kullaniciKodu.isBlank()) {
            throw new IllegalArgumentException("Dis sistem ve kullanici kodu bos birakilamaz");
        }
        CustomerExternalUserId row = new CustomerExternalUserId();
        row.setCustomer(customer);
        row.setDisSistem(disSistem);
        row.setKullaniciKodu(kullaniciKodu);
        return externalUserRepository.save(row);
    }

    @Transactional
    public void disKullaniciSil(Long id) {
        externalUserRepository.deleteById(id);
    }

    public List<AccountProxy> proxyList(Long accountId) {
        return proxyRepository.findByAccountId(accountId);
    }

    public List<AccountPartner> partnerList(Long accountId) {
        return partnerRepository.findByAccountId(accountId);
    }

    public List<AccountCommission> commissionList(Long accountId) {
        return commissionRepository.findByAccountId(accountId);
    }

    public List<AccountContract> contractList(Long accountId) {
        return contractRepository.findByAccountId(accountId);
    }

    public List<AccountChannel> accountChannelList(Long accountId) {
        return accountChannelRepository.findByAccountId(accountId);
    }

    public List<AccountGroup> groupList(Long accountId) {
        return groupRepository.findByAccountId(accountId);
    }

    public List<AccountCustody> custodyList(Long accountId) {
        return custodyRepository.findByAccountId(accountId);
    }

    public List<AccountControlValue> controlList(Long accountId) {
        return controlValueRepository.findByAccountId(accountId);
    }

    public List<AccountReportingPref> reportingList(Long accountId) {
        return reportingPrefRepository.findByAccountId(accountId);
    }

    public List<AccountHiddenAccount> hiddenList(Long accountId) {
        return hiddenAccountRepository.findByAccountId(accountId);
    }

    public List<AccountDerivativeCommission> derivativeList(Long accountId) {
        return derivativeCommissionRepository.findByAccountId(accountId);
    }

    @Transactional
    public AccountProxy proxyEkle(Long accountId, AccountProxy form) {
        Account account = hesapZorunlu(accountId);
        form.setId(null);
        form.setAccount(account);
        return proxyRepository.save(form);
    }

    @Transactional
    public void proxySil(Long id) {
        proxyRepository.deleteById(id);
    }

    @Transactional
    public AccountPartner partnerEkle(Long accountId, AccountPartner form) {
        Account account = hesapZorunlu(accountId);
        form.setId(null);
        form.setAccount(account);
        return partnerRepository.save(form);
    }

    @Transactional
    public void partnerSil(Long id) {
        partnerRepository.deleteById(id);
    }

    @Transactional
    public AccountCommission commissionEkle(Long accountId, AccountCommission form) {
        Account account = hesapZorunlu(accountId);
        form.setId(null);
        form.setAccount(account);
        return commissionRepository.save(form);
    }

    @Transactional
    public void commissionSil(Long id) {
        commissionRepository.deleteById(id);
    }

    @Transactional
    public void komisyonSablonuGetir(Long accountId, BigDecimal deger) {
        Account account = hesapZorunlu(accountId);
        BigDecimal kullanilacak = deger == null || deger.compareTo(BigDecimal.ZERO) == 0
                || deger.compareTo(BigDecimal.ONE) > 0
                ? new BigDecimal("0.001200")
                : deger;
        AccountCommission hisse = new AccountCommission();
        hisse.setAccount(account);
        hisse.setIslem("Hisse Alis/Satis");
        hisse.setMasrafAciklamasi("Sablon komisyonu");
        hisse.setParametreAdi("HISSE_KOM");
        hisse.setParaBirimi("TRY");
        hisse.setPiyasaAdi("BIST");
        hisse.setKomisyonDegeri(kullanilacak);
        commissionRepository.save(hisse);
    }

    @Transactional
    public AccountContract sozlesmeEkle(Long accountId, AccountContract form) {
        Account account = hesapZorunlu(accountId);
        form.setId(null);
        form.setAccount(account);
        return contractRepository.save(form);
    }

    @Transactional
    public AccountChannel accountKanalEkle(Long accountId, String kanal) {
        Account account = hesapZorunlu(accountId);
        if (kanal == null || kanal.isBlank()) {
            throw new IllegalArgumentException("Kanal bos birakilamaz");
        }
        AccountChannel ch = new AccountChannel();
        ch.setAccount(account);
        ch.setKanal(kanal);
        ch.setYetkili(true);
        ch.setDurum("AKTIF");
        return accountChannelRepository.save(ch);
    }

    @Transactional
    public AccountGroup grupEkle(Long accountId, String grupAdi) {
        Account account = hesapZorunlu(accountId);
        if (grupAdi == null || grupAdi.isBlank()) {
            throw new IllegalArgumentException("Grup adi bos birakilamaz");
        }
        AccountGroup g = new AccountGroup();
        g.setAccount(account);
        g.setGrupAdi(grupAdi);
        return groupRepository.save(g);
    }

    @Transactional
    public AccountCustody saklamaEkle(Long accountId, AccountCustody form) {
        Account account = hesapZorunlu(accountId);
        form.setId(null);
        form.setAccount(account);
        return custodyRepository.save(form);
    }

    @Transactional
    public AccountControlValue kontrolEkle(Long accountId, String kontrolAdi, String kontrolDegeri) {
        Account account = hesapZorunlu(accountId);
        if (kontrolAdi == null || kontrolAdi.isBlank()) {
            throw new IllegalArgumentException("Kontrol adi bos birakilamaz");
        }
        AccountControlValue v = new AccountControlValue();
        v.setAccount(account);
        v.setKontrolAdi(kontrolAdi);
        v.setKontrolDegeri(kontrolDegeri);
        return controlValueRepository.save(v);
    }

    @Transactional
    public AccountReportingPref raporEkle(Long accountId, String raporTipi, String kanal) {
        Account account = hesapZorunlu(accountId);
        AccountReportingPref p = new AccountReportingPref();
        p.setAccount(account);
        p.setRaporTipi(raporTipi);
        p.setKanal(kanal);
        p.setAktif(true);
        return reportingPrefRepository.save(p);
    }

    @Transactional
    public AccountHiddenAccount gizliHesapEkle(Long accountId, String gizliHesapNo) {
        Account account = hesapZorunlu(accountId);
        if (gizliHesapNo == null || gizliHesapNo.isBlank()) {
            throw new IllegalArgumentException("Gizli hesap no bos birakilamaz");
        }
        AccountHiddenAccount h = new AccountHiddenAccount();
        h.setAccount(account);
        h.setGizliHesapNo(gizliHesapNo);
        return hiddenAccountRepository.save(h);
    }

    @Transactional
    public AccountDerivativeCommission turevEkle(Long accountId, AccountDerivativeCommission form) {
        Account account = hesapZorunlu(accountId);
        form.setId(null);
        form.setAccount(account);
        return derivativeCommissionRepository.save(form);
    }

    private void kaydetKimlik(Customer customer, CustomerIdentity form) {
        CustomerIdentity identity = identityRepository.findByCustomerId(customer.getId())
                .orElseGet(CustomerIdentity::new);
        identity.setCustomer(customer);
        identity.setSeriNo(form.getSeriNo());
        identity.setMedeniHali(form.getMedeniHali());
        identity.setAnneAdi(form.getAnneAdi());
        identity.setVerildigiYer(form.getVerildigiYer());
        identity.setVerildigiTarih(form.getVerildigiTarih());
        identity.setIl(form.getIl());
        identity.setIlce(form.getIlce());
        identity.setMahalleKoy(form.getMahalleKoy());
        identity.setCiltNo(form.getCiltNo());
        identity.setAileSiraNo(form.getAileSiraNo());
        identity.setSiraNo(form.getSiraNo());
        identity.setSonGecerlilik(form.getSonGecerlilik());
        identity.setEsTckn(form.getEsTckn());
        identity.setSurucuBelgeNo(form.getSurucuBelgeNo());
        identity.setSurucuSinif(form.getSurucuSinif());
        identity.setSurucuVerilisTarih(form.getSurucuVerilisTarih());
        identity.setSurucuGecerlilik(form.getSurucuGecerlilik());
        identity.setPasaportNo(form.getPasaportNo());
        identity.setPasaportVerilis(form.getPasaportVerilis());
        identity.setPasaportGecerlilik(form.getPasaportGecerlilik());
        identity.setPasaportYeri(form.getPasaportYeri());
        identityRepository.save(identity);
    }

    private void varsayilanBelgeVeRaporlariOlustur(Customer customer) {
        for (String tip : VARSAYILAN_BELGELER) {
            CustomerRequiredDocument d = new CustomerRequiredDocument();
            d.setCustomer(customer);
            d.setDokumanTipi(tip);
            documentRepository.save(d);
        }
        for (String rapor : VARSAYILAN_WEBMAILER) {
            CustomerWebmailerPref p = new CustomerWebmailerPref();
            p.setCustomer(customer);
            p.setRaporAciklamasi(rapor);
            p.setSecili(false);
            webmailerRepository.save(p);
        }
    }

    private void kopyalaYatirimciAlanlari(Customer src, Customer dest) {
        dest.setIsim(src.getIsim());
        dest.setSoyisim(src.getSoyisim());
        dest.setTcknVkn(src.getTcknVkn());
        dest.setBabaAdi(src.getBabaAdi());
        dest.setCinsiyet(src.getCinsiyet());
        dest.setDogumYeri(src.getDogumYeri());
        dest.setDogumTarihi(src.getDogumTarihi());
        dest.setUyruk(src.getUyruk());
        dest.setSube(src.getSube());
        dest.setYatirimciLokasyonTipi(src.getYatirimciLokasyonTipi());
        dest.setVergiMukellefiyeti(src.getVergiMukellefiyeti());
        dest.setVergiNumarasi(src.getVergiNumarasi());
        dest.setVergiDairesi(src.getVergiDairesi());
        dest.setYurtdisiVergiNumarasi(src.getYurtdisiVergiNumarasi());
        dest.setYabanciVergiUlkesi(src.getYabanciVergiUlkesi());
        dest.setMusteriSiniflandirmasi(src.getMusteriSiniflandirmasi());
        dest.setIkinciYabanciVergiUlkesi(src.getIkinciYabanciVergiUlkesi());
        dest.setGreenCard(src.isGreenCard());
        dest.setUcuncuYabanciVergiUlkesi(src.getUcuncuYabanciVergiUlkesi());
        dest.setIkinciVknZorunluDegil(src.isIkinciVknZorunluDegil());
        dest.setWebMailerRaporlari(src.isWebMailerRaporlari());
        dest.setHesaplananYp(src.getHesaplananYp());
        dest.setKisininMeslegi(src.getKisininMeslegi());
        dest.setMusteriTanimiTipi(src.getMusteriTanimiTipi());
        dest.setMkkSicilNo(src.getMkkSicilNo());
        dest.setTakasbankSicilNo(src.getTakasbankSicilNo());
        dest.setYatirimciTipi(src.getYatirimciTipi());
        dest.setYatirimciDurumu(src.getYatirimciDurumu());
        dest.setIkinciVatandaslikUlkesi(src.getIkinciVatandaslikUlkesi());
        dest.setDogumUlkesi(src.getDogumUlkesi());
        dest.setAbdVergiMukellefi(src.isAbdVergiMukellefi());
        dest.setIkinciYurtdisiVergiNumarasi(src.getIkinciYurtdisiVergiNumarasi());
        dest.setYabanciVknZorunluDegil(src.isYabanciVknZorunluDegil());
        dest.setUcuncuYurtdisiVergiNumarasi(src.getUcuncuYurtdisiVergiNumarasi());
        dest.setUcuncuVknZorunluDegil(src.isUcuncuVknZorunluDegil());
        dest.setNitelikliYatirimci(src.isNitelikliYatirimci());
        dest.setAtananYp(src.getAtananYp());
        dest.setIysAramaIzni(src.getIysAramaIzni());
        dest.setNitelikliYatirimciDusukTutar(src.isNitelikliYatirimciDusukTutar());
        dest.setYatirimciProfili(src.getYatirimciProfili());
        dest.setIysEpostaIzni(src.getIysEpostaIzni());
        dest.setInteraktifKullanici(src.isInteraktifKullanici());
        dest.setYatirimciSegmenti(src.getYatirimciSegmenti());
        dest.setIysSmsIzni(src.getIysSmsIzni());
        dest.setTelefon(src.getTelefon());
        dest.setEmail(src.getEmail());
        if (src.getRiskGrubu() != null) {
            dest.setRiskGrubu(src.getRiskGrubu());
        }
    }

    private String sonrakiMusteriNo() {
        long n = customerRepository.count() + 1;
        String no;
        do {
            no = String.format("Y%06d", n++);
        } while (customerRepository.findByMusteriNo(no) != null);
        return no;
    }

    private Long sonrakiYatirimciNo() {
        Long max = customerRepository.findMaxYatirimciNo();
        return (max == null ? 66000L : max) + 1;
    }

    private String sonrakiHesapNo() {
        long n = accountRepository.count() + 20000;
        String no;
        do {
            no = String.valueOf(n++);
        } while (accountRepository.findByHesapNo(no) != null);
        return no;
    }

    private Customer musteriZorunlu(Long customerId) {
        if (customerId == null) {
            throw new IllegalArgumentException("Once yatirimci kaydedilmelidir");
        }
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Musteri bulunamadi"));
    }

    private Account hesapZorunlu(Long accountId) {
        if (accountId == null) {
            throw new IllegalArgumentException("Once hesap kaydedilmelidir");
        }
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Hesap bulunamadi"));
    }
}
