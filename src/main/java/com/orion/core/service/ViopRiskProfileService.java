package com.orion.core.service;

import com.orion.core.domain.Account;
import com.orion.core.domain.ViopRiskProfile;
import com.orion.core.repository.AccountRepository;
import com.orion.core.repository.ViopRiskProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Hesap Bazinda VIOP Risk Profili Tanim" ekraninin arkasindaki is mantigi.
 * Arama ve CRUD (ekle/duzenle/sil) islemlerini barindirir.
 */
@Service
public class ViopRiskProfileService {

    private final ViopRiskProfileRepository repository;
    private final AccountRepository accountRepository;

    public ViopRiskProfileService(ViopRiskProfileRepository repository, AccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    public List<ViopRiskProfile> getAll() {
        return repository.findAllFetched();
    }

    public List<ViopRiskProfile> search(String q) {
        if (q == null || q.isBlank()) {
            return getAll();
        }
        return repository.search(q.trim());
    }

    @Transactional
    public ViopRiskProfile kaydet(Long id, String hesapNo, String profilAdi, BigDecimal carpan) {
        if (hesapNo == null || hesapNo.isBlank()) {
            throw new IllegalArgumentException("Hesap No bos birakilamaz");
        }
        if (profilAdi == null || profilAdi.isBlank()) {
            throw new IllegalArgumentException("Profil Adi bos birakilamaz");
        }
        if (carpan == null || carpan.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Carpan sifirdan buyuk olmalidir");
        }
        Account account = accountRepository.findByHesapNo(hesapNo);
        if (account == null) {
            throw new IllegalArgumentException("Hesap bulunamadi: " + hesapNo);
        }
        ViopRiskProfile profil = id != null ? repository.findById(id).orElseThrow() : new ViopRiskProfile();
        profil.setAccount(account);
        profil.setProfilAdi(profilAdi);
        profil.setCarpan(carpan);
        profil.setGuncellemeTarihi(LocalDateTime.now());
        try {
            ViopRiskProfile saved = repository.save(profil);
            repository.flush();
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Bu hesap icin zaten bir VIOP risk profili tanimli (hesap basina tek profil olabilir).");
        }
    }

    @Transactional
    public void sil(Long id) {
        try {
            repository.deleteById(id);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Bu profil silinemiyor.");
        }
    }
}
