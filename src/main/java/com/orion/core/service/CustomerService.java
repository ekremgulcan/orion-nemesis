package com.orion.core.service;

import com.orion.core.domain.Customer;
import com.orion.core.repository.CustomerRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "Musteri Yonetim Sistemi" ekraninin arkasindaki is mantigi. Arama ve
 * CRUD (ekle/duzenle/sil) islemlerini barindirir.
 */
@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public List<Customer> getAll() {
        return repository.findAll();
    }

    public List<Customer> search(String q) {
        if (q == null || q.isBlank()) {
            return getAll();
        }
        return repository.search(q.trim());
    }

    /**
     * Musteri No'ya gore tek bir musteri bulur. "Musteri No arama" ihtiyaci
     * olan her ekranin (orn. Musteri Bildirim Tercihleri) ortak kullanmasi
     * icin buraya eklendi - mevcut CRUD metotlarina (kaydet/sil) dokunulmadi.
     */
    public Customer bulByMusteriNo(String musteriNo) {
        if (musteriNo == null || musteriNo.isBlank()) {
            throw new IllegalArgumentException("Musteri No bos birakilamaz");
        }
        Customer customer = repository.findByMusteriNo(musteriNo.trim());
        if (customer == null) {
            throw new IllegalArgumentException("Musteri bulunamadi: " + musteriNo.trim());
        }
        return customer;
    }

    /**
     * Username'e gore tek bir musteri bulur. "Musteri Bildirim
     * Tercihleri" servis dokumaninin GET/POST uc noktalari musteriyi
     * bununla tanimlar (bkz. Customer.username javadoc) - ekranin
     * kendisi hala "Musteri No" ile arar, bu metot musteri bulunduktan
     * SONRA bildirim tercihleri servisiyle konusmak icin kullanilir.
     */
    public Customer bulByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username bos birakilamaz");
        }
        Customer customer = repository.findByUsername(username.trim());
        if (customer == null) {
            throw new IllegalArgumentException("Musteri bulunamadi: " + username.trim());
        }
        return customer;
    }

    @Transactional
    public Customer kaydet(Long id, String musteriNo, String adSoyadUnvan, String musteriTipi,
                            String tcknVkn, String riskGrubu, String telefon, String email, boolean aktif) {
        if (musteriNo == null || musteriNo.isBlank()) {
            throw new IllegalArgumentException("Musteri No bos birakilamaz");
        }
        if (adSoyadUnvan == null || adSoyadUnvan.isBlank()) {
            throw new IllegalArgumentException("Ad Soyad/Unvan bos birakilamaz");
        }
        if (tcknVkn == null || tcknVkn.isBlank()) {
            throw new IllegalArgumentException("TCKN/VKN bos birakilamaz");
        }
        Customer customer;
        try {
            customer = id != null ? repository.findById(id).orElseThrow() : new Customer();
        } catch (java.util.NoSuchElementException ex) {
            throw new java.util.NoSuchElementException("Musteri bulunamadi: " + id);
        }
        boolean yeni = customer.getId() == null;
        customer.setMusteriNo(musteriNo);
        customer.setAdSoyadUnvan(adSoyadUnvan);
        customer.setMusteriTipi(musteriTipi);
        customer.setTcknVkn(tcknVkn);
        customer.setRiskGrubu(riskGrubu);
        customer.setTelefon(telefon);
        customer.setEmail(email);
        customer.setAktif(aktif);
        if (yeni) {
            customer.setOlusturmaTarihi(LocalDateTime.now());
            // Bu ekranin (Musteri Yonetim Sistemi) kendi bir "username"
            // alani yok - username, "Musteri Bildirim Tercihleri" servis
            // dokumaniyla uyum icin V41'de eklendi ve NOT NULL/UNIQUE.
            // Yeni musteri olustururken, V41'in mevcut 101 musteriye
            // uyguladigi ayni formulle (ad_soyad_unvan + musteri_no son 3
            // hane) otomatik uretilir - kullaniciya ayrica sorulmaz.
            customer.setUsername(uretUsername(adSoyadUnvan, musteriNo));
        }
        try {
            return repository.save(customer);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Kayit sirasinda hata olustu (Musteri No / TCKN-VKN benzersiz olmali): "
                            + ex.getMostSpecificCause().getMessage());
        }
    }

    /**
     * V41 migration'in mevcut musterilere uyguladigi ayni backfill
     * formulu: ad_soyad_unvan kucuk harfe cevrilip bosluklar nokta ile
     * degistirilir, sonuna musteri_no'nun son 3 hanesi eklenir (orn.
     * "Ahmet Yilmaz" + "M000102" -> "ahmet.yilmaz.102"). musteri_no zaten
     * unique oldugu icin sonuc da garanti unique olur.
     */
    private static String uretUsername(String adSoyadUnvan, String musteriNo) {
        String taban = adSoyadUnvan.trim().toLowerCase(java.util.Locale.ROOT).replace(' ', '.');
        String son3Hane = musteriNo.length() >= 3 ? musteriNo.substring(musteriNo.length() - 3) : musteriNo;
        return taban + "." + son3Hane;
    }

    @Transactional
    public void sil(Long id) {
        try {
            repository.deleteById(id);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Bu musteriye bagli hesaplar oldugu icin silinemiyor.");
        }
    }
}
