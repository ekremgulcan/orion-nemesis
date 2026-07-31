package com.orion.core.service;

import com.orion.core.domain.Account;
import com.orion.core.domain.ChannelAuthorization;
import com.orion.core.domain.User;
import com.orion.core.repository.AccountRepository;
import com.orion.core.repository.ChannelAuthorizationRepository;
import com.orion.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "TradeMaster Yetkilendirme" ekraninin arkasindaki is mantigi. Arama ve
 * CRUD (ekle/duzenle/sil) islemlerini barindirir.
 */
@Service
public class ChannelAuthorizationService {

    private final ChannelAuthorizationRepository repository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public ChannelAuthorizationService(ChannelAuthorizationRepository repository,
                                        UserRepository userRepository,
                                        AccountRepository accountRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    public List<ChannelAuthorization> getAll() {
        return repository.findAllFetched();
    }

    public List<ChannelAuthorization> search(String q) {
        if (q == null || q.isBlank()) {
            return getAll();
        }
        return repository.search(q.trim());
    }

    @Transactional
    public ChannelAuthorization kaydet(Long id, String kullaniciAdi, String hesapNo, String kanal, String yetkiDurumu) {
        if (kullaniciAdi == null || kullaniciAdi.isBlank()) {
            throw new IllegalArgumentException("Kullanici Adi bos birakilamaz");
        }
        if (hesapNo == null || hesapNo.isBlank()) {
            throw new IllegalArgumentException("Hesap No bos birakilamaz");
        }
        User user = userRepository.findByKullaniciAdi(kullaniciAdi);
        if (user == null) {
            throw new IllegalArgumentException("Kullanici bulunamadi: " + kullaniciAdi);
        }
        Account account = accountRepository.findByHesapNo(hesapNo);
        if (account == null) {
            throw new IllegalArgumentException("Hesap bulunamadi: " + hesapNo);
        }
        ChannelAuthorization yetki = id != null ? repository.findById(id).orElseThrow() : new ChannelAuthorization();
        boolean yeni = yetki.getId() == null;
        yetki.setUser(user);
        yetki.setAccount(account);
        yetki.setKanal(kanal);
        yetki.setYetkiDurumu(yetkiDurumu);
        if (yeni) {
            yetki.setTanimlamaTarihi(LocalDateTime.now());
        }
        return repository.save(yetki);
    }

    @Transactional
    public void sil(Long id) {
        repository.deleteById(id);
    }
}
