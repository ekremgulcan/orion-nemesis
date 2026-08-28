package com.orion.core.service;

import com.orion.core.domain.User;
import com.orion.core.repository.UserRepository;
import org.springframework.stereotype.Service;

/**
 * Uygulamada gercek bir oturum/login mekanizmasi olmadigi icin "su an
 * oturum acmis kullanici" kavramini simule eden gecici (dev-only) bean.
 * Surec genelinde TEK bir aktif kullanici tutulur (oturum bazinda degil) -
 * bu, projede daha once dagitik sekilde yapilan sabit kullanici
 * varsayimlarinin ("ademir", 1L, vb.) tek, degistirilebilir bir yerde
 * toplanmasi icin eklenmistir. Gercek kimlik dogrulama eklendiginde bu
 * sinifin tamamen kaldirilmasi/degistirilmesi beklenir.
 */
@Service
public class AktifKullaniciServisi {

    private static final String VARSAYILAN_KULLANICI_ADI = "ademir";

    private final UserRepository userRepository;

    private volatile String aktifKullaniciAdi = VARSAYILAN_KULLANICI_ADI;

    public AktifKullaniciServisi(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String getAktifKullaniciAdi() {
        return aktifKullaniciAdi;
    }

    public User getAktifKullanici() {
        return userRepository.findByKullaniciAdi(aktifKullaniciAdi);
    }

    public void setAktifKullanici(String kullaniciAdi) {
        if (userRepository.findByKullaniciAdi(kullaniciAdi) == null) {
            throw new IllegalArgumentException("Bilinmeyen kullanici: " + kullaniciAdi);
        }
        this.aktifKullaniciAdi = kullaniciAdi;
    }
}
