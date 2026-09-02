package com.orion.notification.service;

import com.orion.core.domain.User;
import com.orion.notification.domain.BildirimAyarlariTalebi;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.dto.BildirimAyarlariUpdateDto;
import com.orion.notification.repository.BildirimAyarlariTalebiRepository;
import com.orion.workflow.domain.WorkflowProcess;
import com.orion.workflow.repository.WorkflowProcessRepository;
import com.orion.workflow.service.WorkflowTaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Bildirim Ayarlari (sistem geneli) ekranina ozel onay is mantigi.
 */
@Service
public class BildirimAyarlariOnayService {

    private static final String SUREC_TIPI = "BILDIRIM_AYARLARI_ONAY";
    private static final String GOREV_OZETI_SABLON = "Bildirim Tipi Ayarlari Guncelleme: %s";

    private final WorkflowProcessRepository processRepository;
    private final WorkflowTaskService workflowTaskService;
    private final BildirimAyarlariTalebiRepository talepRepository;
    private final BildirimAyarlariService bildirimAyarlariService;
    private final ObjectMapper objectMapper;

    public BildirimAyarlariOnayService(WorkflowProcessRepository processRepository,
                                       WorkflowTaskService workflowTaskService,
                                       BildirimAyarlariTalebiRepository talepRepository,
                                       BildirimAyarlariService bildirimAyarlariService,
                                       ObjectMapper objectMapper) {
        this.processRepository = processRepository;
        this.workflowTaskService = workflowTaskService;
        this.talepRepository = talepRepository;
        this.bildirimAyarlariService = bildirimAyarlariService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WorkflowProcess onayaGonder(NotificationType tip, BildirimAyarlariUpdateDto updates, User talepEden) {
        if (workflowTaskService.hasPendingProcess(SUREC_TIPI)) {
            throw new IllegalStateException(
                    "Bu islem icin bekleyen bir onay sureci bulunmaktadir. "
                    + "Mevcut surec tamamlanmadan yeni bir onay gonderilemez.");
        }

        // 1) Surec olustur
        WorkflowProcess process = new WorkflowProcess();
        process.setSurecTipi(SUREC_TIPI);
        process.setBaslangicTarihi(LocalDateTime.now());
        process.setDurum("ACIK");
        process.setSurecNo("TEMP");
        process.setReferansModul("NOTIFICATION");
        process = processRepository.save(process);
        process.setSurecNo(String.valueOf(process.getId()));
        process = processRepository.save(process);

        // 2) Talep olustur
        BildirimAyarlariTalebi talep = new BildirimAyarlariTalebi();
        talep.setProcess(process);
        talep.setNotificationType(tip);
        talep.setDurum("BEKLEMEDE");
        talep.setTalepEdenId(talepEden.getId());
        talep.setCreatedTime(LocalDateTime.now());
        talep.setCreatedBy(talepEden.getKullaniciAdi());

        try {
            talep.setYeniDegerJson(objectMapper.writeValueAsString(updates));
            
            // Diff hazirla
            java.util.List<java.util.Map<String, String>> farkListesi = new java.util.ArrayList<>();
            
            // ViewModel'dan gelen tip nesnesi kullanici tarafindan degistirildigi icin gercek DB degerini bul
            NotificationType dbTip = bildirimAyarlariService.tipleriGetir().stream()
                    .filter(t -> t.getId().equals(tip.getId()))
                    .findFirst()
                    .orElse(tip);

            if (updates.getIsActive() != null && !updates.getIsActive().equals(dbTip.isActive())) {
                java.util.Map<String, String> fark = new java.util.HashMap<>();
                fark.put("kategori", "Genel Durum");
                fark.put("alan", "Durum");
                fark.put("eskiDeger", dbTip.isActive() ? "Acik" : "Kapali");
                fark.put("yeniDeger", updates.getIsActive() ? "Acik" : "Kapali");
                farkListesi.add(fark);
            }
            if (updates.getKanalGuncellemeleri() != null) {
                updates.getKanalGuncellemeleri().forEach((kanal, ayarlar) -> {
                    bildirimAyarlariService.kanalAyarlariGetir(tip.getId(), kanal).ifPresent(mevcut -> {
                        if (mevcut.isActive() != ayarlar.isActive()) {
                            java.util.Map<String, String> fark = new java.util.HashMap<>();
                            fark.put("kategori", kanal.name() + " Kanal Ayarlari");
                            fark.put("alan", "Kanal Durumu");
                            fark.put("eskiDeger", mevcut.isActive() ? "Acik" : "Kapali");
                            fark.put("yeniDeger", ayarlar.isActive() ? "Acik" : "Kapali");
                            farkListesi.add(fark);
                        }
                        if (mevcut.isMusteriGorurVeDegistir() != ayarlar.isMusteriGorurVeDegistir()) {
                            java.util.Map<String, String> fark = new java.util.HashMap<>();
                            fark.put("kategori", kanal.name() + " Kanal Ayarlari");
                            fark.put("alan", "Musteri Gorur");
                            fark.put("eskiDeger", mevcut.isMusteriGorurVeDegistir() ? "Evet" : "Hayir");
                            fark.put("yeniDeger", ayarlar.isMusteriGorurVeDegistir() ? "Evet" : "Hayir");
                            farkListesi.add(fark);
                        }
                        if (mevcut.getMaxRetry() != ayarlar.getMaxRetry()) {
                            java.util.Map<String, String> fark = new java.util.HashMap<>();
                            fark.put("kategori", kanal.name() + " Kanal Ayarlari");
                            fark.put("alan", "Max Deneme Sayisi");
                            fark.put("eskiDeger", String.valueOf(mevcut.getMaxRetry()));
                            fark.put("yeniDeger", String.valueOf(ayarlar.getMaxRetry()));
                            farkListesi.add(fark);
                        }
                        if (mevcut.getErrorBackoffTime() != ayarlar.getErrorBackoffTime()) {
                            java.util.Map<String, String> fark = new java.util.HashMap<>();
                            fark.put("kategori", kanal.name() + " Kanal Ayarlari");
                            fark.put("alan", "Tekrar Deneme Suresi");
                            fark.put("eskiDeger", String.valueOf(mevcut.getErrorBackoffTime()));
                            fark.put("yeniDeger", String.valueOf(ayarlar.getErrorBackoffTime()));
                            farkListesi.add(fark);
                        }
                        if (mevcut.getTemplateBody() != null && !mevcut.getTemplateBody().equals(ayarlar.getTemplateBody())) {
                            java.util.Map<String, String> fark = new java.util.HashMap<>();
                            fark.put("kategori", kanal.name() + " Kanal Ayarlari");
                            fark.put("alan", "Sablon");
                            fark.put("eskiDeger", mevcut.getTemplateBody());
                            fark.put("yeniDeger", ayarlar.getTemplateBody());
                            farkListesi.add(fark);
                        }
                    });
                });
            }
            talep.setDegisiklikListesiJson(objectMapper.writeValueAsString(farkListesi));
            
        } catch (Exception e) {
            throw new RuntimeException("Guncellemeler JSON formatina cevirilemedi", e);
        }

        talepRepository.save(talep);

        // 3) Gorev olustur (Onayci rolundeki herkese)
        String ozet = String.format(GOREV_OZETI_SABLON, tip.getAd());
        workflowTaskService.createOnayTasksForRole(process, SUREC_TIPI, talepEden.getId(), ozet);

        return process;
    }

    @Transactional
    public void onayla(Long processId, User kararVeren) {
        WorkflowProcess process = processRepository.findById(processId)
                .orElseThrow(() -> new IllegalArgumentException("Surec bulunamadi: " + processId));
        
        BildirimAyarlariTalebi talep = talepRepository.findByProcessId(processId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadi: " + processId));

        if (!"BEKLEMEDE".equals(talep.getDurum())) {
            throw new IllegalStateException("Bu talep zaten onaylanmis veya reddedilmis.");
        }

        try {
            BildirimAyarlariUpdateDto updates = objectMapper.readValue(talep.getYeniDegerJson(), BildirimAyarlariUpdateDto.class);

            // Asil tablolara uygula
            bildirimAyarlariService.genelDurumGuncelle(talep.getNotificationType().getId(), updates.getIsActive());

            if (updates.getKanalGuncellemeleri() != null) {
                updates.getKanalGuncellemeleri().forEach((kanal, ayarlar) -> {
                    // Mevcut templateId'yi bul
                    bildirimAyarlariService.kanalAyarlariGetir(talep.getNotificationType().getId(), kanal)
                            .ifPresent(template -> {
                                bildirimAyarlariService.kanalAyarlariniKaydet(template.getId(), ayarlar);
                            });
                });
            }

            // Talebi guncelle
            talep.setDurum("ONAYLANDI");
            talep.setKararVerenId(kararVeren.getId());
            talep.setLastUpdatedBy(kararVeren.getKullaniciAdi());
            talep.setLastUpdatedTime(LocalDateTime.now());
            talepRepository.save(talep);

            // Sureci kapat
            process.setDurum("TAMAMLANDI");
            process.setIslemSonucu("ONAYLANDI");
            processRepository.save(process);
            workflowTaskService.closeAllTasksForProcess(process.getId());

        } catch (Exception e) {
            throw new RuntimeException("Talep onaylanirken bir hata olustu: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void reddet(Long processId, User kararVeren) {
        WorkflowProcess process = processRepository.findById(processId)
                .orElseThrow(() -> new IllegalArgumentException("Surec bulunamadi: " + processId));

        BildirimAyarlariTalebi talep = talepRepository.findByProcessId(processId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadi: " + processId));

        if (!"BEKLEMEDE".equals(talep.getDurum())) {
            throw new IllegalStateException("Bu talep zaten onaylanmis veya reddedilmis.");
        }

        talep.setDurum("REDDEDILDI");
        talep.setKararVerenId(kararVeren.getId());
        talep.setLastUpdatedBy(kararVeren.getKullaniciAdi());
        talep.setLastUpdatedTime(LocalDateTime.now());
        talepRepository.save(talep);

        process.setDurum("TAMAMLANDI");
        process.setIslemSonucu("REDDEDILDI");
        processRepository.save(process);
        workflowTaskService.closeAllTasksForProcess(process.getId());
    }

    public java.util.Optional<BildirimAyarlariTalebi> getTalepForReview(Long processId) {
        return talepRepository.findByProcessId(processId);
    }
}
