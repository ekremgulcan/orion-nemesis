package com.orion.report.service;

import com.orion.report.domain.ReportDefinition;
import com.orion.report.repository.ReportDefinitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "Rapor Tanimlari" ekraninin arkasindaki is mantigi. CKEditor zengin metin
 * editoru yerine basit metin/HTML alani (icerik) kullanilir.
 */
@Service
public class ReportDefinitionService {

    private final ReportDefinitionRepository repository;

    public ReportDefinitionService(ReportDefinitionRepository repository) {
        this.repository = repository;
    }

    public List<ReportDefinition> getAll() {
        return repository.findAllFetched();
    }

    public List<ReportDefinition> search(String q) {
        if (q == null || q.isBlank()) {
            return getAll();
        }
        return repository.search(q.trim());
    }

    @Transactional
    public void sil(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public ReportDefinition kaydet(Long id, String raporAdi, String raporSinifi, String zamanlama,
                                    boolean mailGonder, String icerik) {
        if (raporAdi == null || raporAdi.isBlank()) {
            throw new IllegalArgumentException("Rapor Adi bos birakilamaz");
        }
        if (raporSinifi == null || raporSinifi.isBlank()) {
            throw new IllegalArgumentException("Rapor Sinifi bos birakilamaz");
        }
        ReportDefinition report = id != null
                ? repository.findById(id).orElseThrow()
                : new ReportDefinition();

        boolean yeni = report.getId() == null;
        report.setRaporAdi(raporAdi);
        report.setRaporSinifi(raporSinifi);
        report.setZamanlama(zamanlama);
        report.setMailGonder(mailGonder);
        report.setIcerik(icerik);
        if (yeni) {
            report.setOlusturmaTarihi(LocalDateTime.now());
        }
        report.setGuncellemeTarihi(LocalDateTime.now());
        return repository.save(report);
    }
}
