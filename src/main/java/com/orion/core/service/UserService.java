package com.orion.core.service;

import com.orion.core.domain.Role;
import com.orion.core.domain.User;
import com.orion.core.repository.RoleRepository;
import com.orion.core.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * "Yonetim Paneli - Kullanici / Rol Listesi" ekraninin arkasindaki is
 * mantigi. Arama ve CRUD (ekle/duzenle/sil) islemlerini barindirir.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public List<User> getAll() {
        return userRepository.findAllFetched();
    }

    public List<User> search(String q) {
        if (q == null || q.isBlank()) {
            return getAll();
        }
        return userRepository.search(q.trim());
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Transactional
    public User kaydet(Long id, String kullaniciAdi, String adSoyad, String email, boolean aktif, Set<Long> rolIds) {
        if (kullaniciAdi == null || kullaniciAdi.isBlank()) {
            throw new IllegalArgumentException("Kullanici Adi bos birakilamaz");
        }
        if (adSoyad == null || adSoyad.isBlank()) {
            throw new IllegalArgumentException("Ad Soyad bos birakilamaz");
        }
        User user;
        try {
            user = id != null ? userRepository.findById(id).orElseThrow() : new User();
        } catch (java.util.NoSuchElementException ex) {
            throw new java.util.NoSuchElementException("Kullanici bulunamadi: " + id);
        }
        boolean yeni = user.getId() == null;
        user.setKullaniciAdi(kullaniciAdi);
        user.setAdSoyad(adSoyad);
        user.setEmail(email);
        user.setAktif(aktif);
        if (yeni) {
            user.setOlusturmaTarihi(LocalDateTime.now());
        }
        Set<Role> roller = new HashSet<>();
        if (rolIds != null) {
            for (Long rolId : rolIds) {
                roleRepository.findById(rolId).ifPresent(roller::add);
            }
        }
        user.setRoller(roller);
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Kayit sirasinda hata olustu (Kullanici Adi benzersiz olmali): " + ex.getMostSpecificCause().getMessage());
        }
    }

    @Transactional
    public void sil(Long id) {
        try {
            userRepository.deleteById(id);
            userRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Bu kullaniciya bagli kayitlar oldugu icin silinemiyor.");
        }
    }
}
