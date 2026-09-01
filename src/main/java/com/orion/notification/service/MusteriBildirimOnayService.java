package com.orion.notification.service;

import com.orion.core.domain.Customer;
import com.orion.core.domain.User;
import com.orion.notification.domain.MusteriBildirimTercihTalebi;
import com.orion.notification.domain.MusteriBildirimTercihi;
import com.orion.notification.dto.NotifPreferencesUpdateItem;
import com.orion.notification.repository.MusteriBildirimTercihTalebiRepository;
import com.orion.notification.repository.MusteriBildirimTercihiRepository;
import com.orion.workflow.domain.WorkflowProcess;
import com.orion.workflow.repository.WorkflowProcessRepository;
import com.orion.workflow.service.WorkflowTaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Musteri Bildirim Tercihleri ekranina ozel onay (approve/reject) is mantigi.
 * Generic surec/gorev olusturma icin WorkflowTaskService'i kullanir.
 * HisseRiskOnayService ile ayni deseni takip eder.
 */
@Service
public class MusteriBildirimOnayService {

    private static final String SUREC_TIPI = "MUSTERI_BILDIRIM_TERCIHLERI_ONAY";
    private static final String GOREV_OZETI = "Musteri Bildirim Tercihleri Guncelleme Onay Islemi";

    private final WorkflowProcessRepository processRepository;
    private final WorkflowTaskService workflowTaskService;
    private final MusteriBildirimTercihTalebiRepository talepRepository;
    private final MusteriBildirimTercihiRepository tercihRepository;
    private final MusteriBildirimTercihleriService tercihService;
    private final ObjectMapper objectMapper;

    public MusteriBildirimOnayService(WorkflowProcessRepository processRepository,
                                       WorkflowTaskService workflowTaskService,
                                       MusteriBildirimTercihTalebiRepository talepRepository,
                                       MusteriBildirimTercihiRepository tercihRepository,
                                       MusteriBildirimTercihleriService tercihService,
                                       ObjectMapper objectMapper) {
        this.processRepository = processRepository;
        this.workflowTaskService = workflowTaskService;
        this.talepRepository = talepRepository;
        this.tercihRepository = tercihRepository;
        this.tercihService = tercihService;
        this.objectMapper = objectMapper;
    }

    /**
     * Musteri bildirim tercihi degisikliklerini onay surecine gonderir.
     * 1) Bekleyen surec kontrolu
     * 2) WorkflowProcess olustur
     * 3) Mevcut tercihleri snapshot'la, degisiklikleri kaydet
     * 4) Onayci rolundeki kullanicilara gorev olustur (gondereni haric)
     *
     * @param musteri tercih degisikligi yapilan musteri
     * @param updates degistirilmek istenen tercihler
     * @param mevcutTercihler musterinin simdiki tercihleri (snapshot icin)
     * @param talepEden talebi olusturan kullanici
     * @throws IllegalStateException bekleyen surec varsa
     */
    @Transactional
    public WorkflowProcess onayaGonder(Customer musteri,
                                        List<NotifPreferencesUpdateItem> updates,
                                        List<MusteriBildirimTercihi> mevcutTercihler,
                                        User talepEden) {
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
        MusteriBildirimTercihTalebi talep = new MusteriBildirimTercihTalebi();
        talep.setProcess(process);
        talep.setTalepEden(talepEden);
        talep.setCustomer(musteri);
        talep.setDurum("BEKLEMEDE");
        talep.setOlusturmaTarihi(LocalDateTime.now());

        try {
            // Mevcut tercihlerin snapshot'i
            talep.setOncekiDegerJson(snapshotMevcutTercihler(mevcutTercihler));
            // Uygulanacak degisiklikler
            talep.setYeniDegerJson(objectMapper.writeValueAsString(updates));
            // UI diff popup icin kompakt fark listesi
            talep.setDegisiklikListesiJson(hesaplaFark(mevcutTercihler, updates));
        } catch (Exception e) {
            throw new RuntimeException("JSON donusum hatasi", e);
        }

        talepRepository.save(talep);

        // 3) Onayci gorevleri olustur
        String gorevOzeti = GOREV_OZETI + " (" + musteri.getMusteriNo() + ")";
        workflowTaskService.createOnayTasksForRole(process, SUREC_TIPI,
                talepEden.getId(), gorevOzeti);

        return process;
    }

    /**
     * Talepleri onaylar: yeniDegerJson'daki degerleri musteri tercih
     * tablosuna uygular, talepleri ONAYLANDI yapar, sureci kapatir.
     */
    @Transactional
    public void onayla(Long processId, User kararVeren) {
        List<MusteriBildirimTercihTalebi> talepler = talepRepository.findByProcessIdFetched(processId);
        LocalDateTime now = LocalDateTime.now();

        for (MusteriBildirimTercihTalebi talep : talepler) {
            if (!"BEKLEMEDE".equals(talep.getDurum())) {
                continue;
            }

            try {
                List<NotifPreferencesUpdateItem> updates = objectMapper.readValue(
                        talep.getYeniDegerJson(),
                        objectMapper.getTypeFactory().constructCollectionType(
                                List.class, NotifPreferencesUpdateItem.class));
                tercihService.updateForUsername(talep.getCustomer().getUsername(), updates);
            } catch (Exception e) {
                throw new RuntimeException("Onaylama islemi sirasinda JSON hatasi", e);
            }

            talep.setDurum("ONAYLANDI");
            talep.setKararTarihi(now);
            talep.setKararVeren(kararVeren);
            talepRepository.save(talep);
        }

        // Sureci kapat
        WorkflowProcess process = processRepository.findById(processId).orElseThrow();
        process.setDurum("TAMAMLANDI");
        process.setIslemSonucu("ONAYLANDI");
        processRepository.save(process);

        // Tum gorevleri kapat
        workflowTaskService.closeAllTasksForProcess(processId);
    }

    /**
     * Talepleri reddeder: degisiklik uygulanmaz, talepler REDDEDILDI olarak
     * isaretlenir, surec kapatilir.
     */
    @Transactional
    public void reddet(Long processId, User kararVeren) {
        List<MusteriBildirimTercihTalebi> talepler = talepRepository.findByProcessId(processId);
        LocalDateTime now = LocalDateTime.now();

        for (MusteriBildirimTercihTalebi talep : talepler) {
            if (!"BEKLEMEDE".equals(talep.getDurum())) {
                continue;
            }
            talep.setDurum("REDDEDILDI");
            talep.setKararTarihi(now);
            talep.setKararVeren(kararVeren);
            talepRepository.save(talep);
        }

        // Sureci kapat
        WorkflowProcess process = processRepository.findById(processId).orElseThrow();
        process.setDurum("TAMAMLANDI");
        process.setIslemSonucu("REDDEDILDI");
        processRepository.save(process);

        // Tum gorevleri kapat
        workflowTaskService.closeAllTasksForProcess(processId);
    }

    /**
     * Inceleme ekrani icin tum talepleri (join fetch ile) dondurur.
     */
    @Transactional(readOnly = true)
    public List<MusteriBildirimTercihTalebi> getTaleplerForReview(Long processId) {
        return talepRepository.findByProcessIdFetched(processId);
    }

    /**
     * Mevcut tercihlerin JSON snapshot'ini olusturur.
     * Format: [{categoryCode, categoryName, push, sms, eposta}, ...]
     */
    private String snapshotMevcutTercihler(List<MusteriBildirimTercihi> tercihler) throws Exception {
        List<Map<String, Object>> snapshot = new ArrayList<>();
        for (MusteriBildirimTercihi tercih : tercihler) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("categoryCode", tercih.getCategory().getKod());
            entry.put("categoryName", tercih.getCategory().getAd());
            entry.put("push", tercih.isPushAcik());
            entry.put("sms", tercih.isSmsAcik());
            entry.put("eposta", tercih.isEpostaAcik());
            snapshot.add(entry);
        }
        return objectMapper.writeValueAsString(snapshot);
    }

    /**
     * UI diff popup icin kompakt fark listesi olusturur.
     * Sadece degisen kanallari listeler.
     * Format: [{kategori, alan, eskiDeger, yeniDeger}, ...]
     */
    private String hesaplaFark(List<MusteriBildirimTercihi> mevcutTercihler,
                                List<NotifPreferencesUpdateItem> updates) throws Exception {
        // Mevcut tercihleri categoryCode -> tercih map'ine cevir
        Map<String, MusteriBildirimTercihi> kodToTercih = new HashMap<>();
        for (MusteriBildirimTercihi tercih : mevcutTercihler) {
            kodToTercih.put(tercih.getCategory().getKod(), tercih);
        }

        List<Map<String, String>> farkListesi = new ArrayList<>();
        for (NotifPreferencesUpdateItem update : updates) {
            MusteriBildirimTercihi mevcut = kodToTercih.get(update.getCategoryCode());
            if (mevcut == null) {
                continue;
            }

            boolean eskiDeger = getKanalDegeri(mevcut, update.getNotifChannelCode());
            boolean yeniDeger = update.isEnabled();

            if (eskiDeger != yeniDeger) {
                Map<String, String> fark = new HashMap<>();
                fark.put("kategori", mevcut.getCategory().getAd());
                fark.put("alan", kanalAdiCevir(update.getNotifChannelCode()));
                fark.put("eskiDeger", eskiDeger ? "Acik" : "Kapali");
                fark.put("yeniDeger", yeniDeger ? "Acik" : "Kapali");
                farkListesi.add(fark);
            }
        }
        return objectMapper.writeValueAsString(farkListesi);
    }

    private static boolean getKanalDegeri(MusteriBildirimTercihi tercih, String notifChannelCode) {
        return switch (notifChannelCode.toLowerCase()) {
            case "push" -> tercih.isPushAcik();
            case "sms" -> tercih.isSmsAcik();
            case "email" -> tercih.isEpostaAcik();
            default -> false;
        };
    }

    private static String kanalAdiCevir(String notifChannelCode) {
        return switch (notifChannelCode.toLowerCase()) {
            case "push" -> "Push Bildirim";
            case "sms" -> "SMS";
            case "email" -> "E-Posta";
            default -> notifChannelCode;
        };
    }
}
