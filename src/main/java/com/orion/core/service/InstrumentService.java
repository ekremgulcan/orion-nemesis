package com.orion.core.service;

import com.orion.core.domain.Instrument;
import com.orion.core.repository.InstrumentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * "Piyasa Veri Yonetimi" ekraninin arkasindaki is mantigi. Referans
 * enstruman (master data) icin arama ve CRUD (ekle/duzenle/sil) islemlerini
 * barindirir. Fiyat besleme/entegrasyon Faz 4+ kapsamindadir.
 */
@Service
public class InstrumentService {

    private final InstrumentRepository repository;

    public InstrumentService(InstrumentRepository repository) {
        this.repository = repository;
    }

    public List<Instrument> getAll() {
        return repository.findAll();
    }

    public List<Instrument> search(String q) {
        if (q == null || q.isBlank()) {
            return getAll();
        }
        return repository.search(q.trim());
    }

    @Transactional
    public Instrument kaydet(Long id, String isin, String sembol, String ad, String tip, String borsa, boolean aktif) {
        if (isin == null || isin.isBlank()) {
            throw new IllegalArgumentException("ISIN bos birakilamaz");
        }
        if (sembol == null || sembol.isBlank()) {
            throw new IllegalArgumentException("Sembol bos birakilamaz");
        }
        if (ad == null || ad.isBlank()) {
            throw new IllegalArgumentException("Ad bos birakilamaz");
        }
        if (tip == null || tip.isBlank()) {
            throw new IllegalArgumentException("Tip bos birakilamaz");
        }
        if (borsa == null || borsa.isBlank()) {
            throw new IllegalArgumentException("Borsa bos birakilamaz");
        }
        Instrument instrument = id != null ? repository.findById(id).orElseThrow() : new Instrument();
        instrument.setIsin(isin);
        instrument.setSembol(sembol);
        instrument.setAd(ad);
        instrument.setTip(tip);
        instrument.setBorsa(borsa);
        instrument.setAktif(aktif);
        try {
            Instrument saved = repository.save(instrument);
            repository.flush();
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Bu ISIN ile kayitli baska bir enstruman zaten var: " + isin);
        }
    }

    @Transactional
    public void sil(Long id) {
        try {
            repository.deleteById(id);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Bu enstruman baska kayitlarda (pozisyon, teminat, risk kontrolu vb.) kullanildigi icin silinemez.");
        }
    }
}
