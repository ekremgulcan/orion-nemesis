package com.orion.meta.service;

import com.orion.meta.domain.PositionShockScenario;
import com.orion.meta.domain.PositionSnapshot;
import com.orion.meta.repository.PositionShockScenarioRepository;
import com.orion.meta.repository.PositionSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Meta Pozisyon Servisi" ekraninin arkasindaki is mantigi. Pozisyon
 * anlik goruntuleri salt-okunur (turetilmis veri, arama destekli); sok
 * senaryolari icin ise arama ve CRUD (ekle/duzenle/sil) islemlerini
 * barindirir.
 */
@Service
public class MetaPozisyonService {

    private final PositionSnapshotRepository positionSnapshotRepository;
    private final PositionShockScenarioRepository shockScenarioRepository;

    public MetaPozisyonService(PositionSnapshotRepository positionSnapshotRepository,
                                PositionShockScenarioRepository shockScenarioRepository) {
        this.positionSnapshotRepository = positionSnapshotRepository;
        this.shockScenarioRepository = shockScenarioRepository;
    }

    public List<PositionSnapshot> getAllPositions() {
        return positionSnapshotRepository.findAllFetched();
    }

    public List<PositionSnapshot> searchPositions(String q) {
        if (q == null || q.isBlank()) {
            return getAllPositions();
        }
        return positionSnapshotRepository.search(q.trim());
    }

    public List<PositionShockScenario> getAllScenarios() {
        return shockScenarioRepository.findAll();
    }

    public List<PositionShockScenario> searchScenarios(String q) {
        if (q == null || q.isBlank()) {
            return getAllScenarios();
        }
        return shockScenarioRepository.search(q.trim());
    }

    @Transactional
    public PositionShockScenario kaydetScenario(Long id, String senaryoAdi, String currencyPair, BigDecimal sokYuzdesi, boolean aktif) {
        if (senaryoAdi == null || senaryoAdi.isBlank()) {
            throw new IllegalArgumentException("Senaryo Adi bos birakilamaz");
        }
        if (currencyPair == null || currencyPair.isBlank()) {
            throw new IllegalArgumentException("Currency Pair bos birakilamaz");
        }
        if (sokYuzdesi == null) {
            throw new IllegalArgumentException("Sok Yuzdesi bos birakilamaz");
        }
        PositionShockScenario scenario = id != null ? shockScenarioRepository.findById(id).orElseThrow() : new PositionShockScenario();
        scenario.setSenaryoAdi(senaryoAdi.trim());
        scenario.setCurrencyPair(currencyPair.trim().toUpperCase());
        scenario.setSokYuzdesi(sokYuzdesi);
        scenario.setAktif(aktif);
        if (scenario.getOlusturmaTarihi() == null) {
            scenario.setOlusturmaTarihi(LocalDateTime.now());
        }
        return shockScenarioRepository.save(scenario);
    }

    @Transactional
    public void silScenario(Long id) {
        shockScenarioRepository.deleteById(id);
    }
}
