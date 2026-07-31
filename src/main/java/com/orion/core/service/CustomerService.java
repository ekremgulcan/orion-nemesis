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
        }
        try {
            return repository.save(customer);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Kayit sirasinda hata olustu (Musteri No / TCKN-VKN benzersiz olmali): "
                            + ex.getMostSpecificCause().getMessage());
        }
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
