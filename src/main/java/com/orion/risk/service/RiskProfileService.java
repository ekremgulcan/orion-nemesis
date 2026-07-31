package com.orion.risk.service;

import com.orion.core.domain.Account;
import com.orion.core.domain.Instrument;
import com.orion.core.domain.User;
import com.orion.core.repository.AccountRepository;
import com.orion.core.repository.InstrumentRepository;
import com.orion.core.repository.UserRepository;
import com.orion.risk.domain.AccountInstrumentControl;
import com.orion.risk.domain.InstrumentGroup;
import com.orion.risk.domain.RiskProfile;
import com.orion.risk.domain.UserLimit;
import com.orion.risk.repository.AccountInstrumentControlRepository;
import com.orion.risk.repository.InstrumentGroupRepository;
import com.orion.risk.repository.RiskProfileRepository;
import com.orion.risk.repository.UserLimitRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * "Hisse Risk Parametreleri" / "Sabit Getiri Risk Tanimlama" ekranlarinin
 * arkasindaki servis. PDF'te ayri ekranlar olarak gorunen bu iki ekran,
 * tek servis + enstruman_tipi filtresiyle birlestirildi.
 */
@Service
public class RiskProfileService {

    private final RiskProfileRepository riskProfileRepository;
    private final UserLimitRepository userLimitRepository;
    private final InstrumentGroupRepository instrumentGroupRepository;
    private final AccountInstrumentControlRepository accountInstrumentControlRepository;
    private final InstrumentRepository instrumentRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public RiskProfileService(RiskProfileRepository riskProfileRepository,
                               UserLimitRepository userLimitRepository,
                               InstrumentGroupRepository instrumentGroupRepository,
                               AccountInstrumentControlRepository accountInstrumentControlRepository,
                               InstrumentRepository instrumentRepository,
                               UserRepository userRepository,
                               AccountRepository accountRepository) {
        this.riskProfileRepository = riskProfileRepository;
        this.userLimitRepository = userLimitRepository;
        this.instrumentGroupRepository = instrumentGroupRepository;
        this.accountInstrumentControlRepository = accountInstrumentControlRepository;
        this.instrumentRepository = instrumentRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    public List<RiskProfile> getRiskProfiles(String enstrumanTipi) {
        return riskProfileRepository.findByEnstrumanTipi(enstrumanTipi);
    }

    public List<RiskProfile> searchRiskProfiles(String enstrumanTipi, String q) {
        if (q == null || q.isBlank()) {
            return getRiskProfiles(enstrumanTipi);
        }
        return riskProfileRepository.searchByEnstrumanTipi(enstrumanTipi, q.trim());
    }

    public List<UserLimit> getUserLimits(String enstrumanTipi) {
        return userLimitRepository.findByEnstrumanTipi(enstrumanTipi);
    }

    public List<UserLimit> searchUserLimits(String enstrumanTipi, String q) {
        if (q == null || q.isBlank()) {
            return getUserLimits(enstrumanTipi);
        }
        return userLimitRepository.searchByEnstrumanTipi(enstrumanTipi, q.trim());
    }

    public List<InstrumentGroup> getInstrumentGroups() {
        return instrumentGroupRepository.findAllFetched();
    }

    public List<InstrumentGroup> searchInstrumentGroups(String q) {
        if (q == null || q.isBlank()) {
            return getInstrumentGroups();
        }
        return instrumentGroupRepository.search(q.trim());
    }

    public List<Instrument> getAllInstruments() {
        return instrumentRepository.findAll();
    }

    @Transactional
    public InstrumentGroup kaydetInstrumentGroup(Long id, String grupKodu, String aciklama, boolean aktif, Set<Long> instrumentIds) {
        if (grupKodu == null || grupKodu.isBlank()) {
            throw new IllegalArgumentException("Grup Kodu bos birakilamaz");
        }
        InstrumentGroup grup = id != null ? instrumentGroupRepository.findById(id).orElseThrow() : new InstrumentGroup();
        grup.setGrupKodu(grupKodu);
        grup.setAciklama(aciklama);
        grup.setAktif(aktif);
        Set<Instrument> uyeler = new HashSet<>();
        if (instrumentIds != null) {
            for (Long instrumentId : instrumentIds) {
                instrumentRepository.findById(instrumentId).ifPresent(uyeler::add);
            }
        }
        grup.setUyeler(uyeler);
        try {
            InstrumentGroup saved = instrumentGroupRepository.save(grup);
            instrumentGroupRepository.flush();
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Bu Grup Kodu ile kayitli baska bir grup zaten var: " + grupKodu);
        }
    }

    @Transactional
    public void silInstrumentGroup(Long id) {
        try {
            instrumentGroupRepository.deleteById(id);
            instrumentGroupRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Bu grup baska kayitlarda kullanildigi icin silinemez.");
        }
    }

    public List<AccountInstrumentControl> getAccountInstrumentControls() {
        return accountInstrumentControlRepository.findAllFetched();
    }

    public List<AccountInstrumentControl> searchAccountInstrumentControls(String q) {
        if (q == null || q.isBlank()) {
            return getAccountInstrumentControls();
        }
        return accountInstrumentControlRepository.search(q.trim());
    }

    @Transactional
    public AccountInstrumentControl kaydetAccountInstrumentControl(Long id, String kullaniciAdi, String hesapNo, String enstrumanSembol,
                                                                     boolean alisIzni, boolean satisIzni, boolean acikSatisIzni) {
        if (kullaniciAdi == null || kullaniciAdi.isBlank()) {
            throw new IllegalArgumentException("Kullanici Adi bos birakilamaz");
        }
        if (hesapNo == null || hesapNo.isBlank()) {
            throw new IllegalArgumentException("Hesap No bos birakilamaz");
        }
        if (enstrumanSembol == null || enstrumanSembol.isBlank()) {
            throw new IllegalArgumentException("Enstruman bos birakilamaz");
        }
        User user = userRepository.findByKullaniciAdi(kullaniciAdi);
        if (user == null) {
            throw new IllegalArgumentException("Kullanici bulunamadi: " + kullaniciAdi);
        }
        Account account = accountRepository.findByHesapNo(hesapNo);
        if (account == null) {
            throw new IllegalArgumentException("Hesap bulunamadi: " + hesapNo);
        }
        Instrument instrument = instrumentRepository.findAll().stream()
                .filter(i -> i.getSembol().equalsIgnoreCase(enstrumanSembol))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Enstruman bulunamadi: " + enstrumanSembol));

        AccountInstrumentControl kontrol = id != null
                ? accountInstrumentControlRepository.findById(id).orElseThrow()
                : new AccountInstrumentControl();
        kontrol.setUser(user);
        kontrol.setAccount(account);
        kontrol.setInstrument(instrument);
        kontrol.setAlisIzni(alisIzni);
        kontrol.setSatisIzni(satisIzni);
        kontrol.setAcikSatisIzni(acikSatisIzni);
        kontrol.setGuncellemeTarihi(LocalDateTime.now());
        try {
            AccountInstrumentControl saved = accountInstrumentControlRepository.save(kontrol);
            accountInstrumentControlRepository.flush();
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Bu kullanici/hesap/enstruman kombinasyonu icin zaten bir kontrol tanimli.");
        }
    }

    @Transactional
    public void silAccountInstrumentControl(Long id) {
        try {
            accountInstrumentControlRepository.deleteById(id);
            accountInstrumentControlRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Bu kontrol baska kayitlarda kullanildigi icin silinemez.");
        }
    }
}
