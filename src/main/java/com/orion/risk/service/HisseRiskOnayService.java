package com.orion.risk.service;

import com.orion.core.domain.Account;
import com.orion.core.domain.User;
import com.orion.core.repository.AccountRepository;
import com.orion.risk.domain.HisseRiskParametreTalebi;
import com.orion.risk.domain.HisseRiskParametresi;
import com.orion.risk.repository.HisseRiskParametreTalebiRepository;
import com.orion.risk.repository.HisseRiskParametresiRepository;
import com.orion.risk.vm.NetVarlikCarpaniTopluSatir;
import com.orion.workflow.domain.WorkflowProcess;
import com.orion.workflow.repository.WorkflowProcessRepository;
import com.orion.workflow.service.WorkflowTaskService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Hisse Risk Parametreleri ekranina ozel onay (approve/reject) is mantigi.
 * Generic surec/gorev olusturma icin WorkflowTaskService'i kullanir.
 * Ileride Bildirim Ayarlari, Musteri Bildirim Tercihleri gibi ekranlar icin
 * benzer modül-spesifik onay servisleri olusturulacak.
 */
@Service
public class HisseRiskOnayService {

    private static final String SUREC_TIPI = "HISSE_RISK_PARAMETRELERI_ONAY";
    private static final String GOREV_OZETI = "Net Varlik Limit Carpani Toplu Guncelleme Onay Islemi";

    private final WorkflowProcessRepository processRepository;
    private final WorkflowTaskService workflowTaskService;
    private final HisseRiskParametreTalebiRepository talepRepository;
    private final HisseRiskParametresiRepository parametreRepository;
    private final AccountRepository accountRepository;

    public HisseRiskOnayService(WorkflowProcessRepository processRepository,
                                 WorkflowTaskService workflowTaskService,
                                 HisseRiskParametreTalebiRepository talepRepository,
                                 HisseRiskParametresiRepository parametreRepository,
                                 AccountRepository accountRepository) {
        this.processRepository = processRepository;
        this.workflowTaskService = workflowTaskService;
        this.talepRepository = talepRepository;
        this.parametreRepository = parametreRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * Toplu guncelleme onizleme satirlarini onay surecine gonderir.
     * 1) Bekleyen surec kontrolu (varsa hata firlat)
     * 2) WorkflowProcess olustur (surecNo = process_id)
     * 3) Her gecerli satir icin HisseRiskParametreTalebi olustur
     * 4) Onayci rolundeki kullanicilara gorev olustur (gondereni haric)
     *
     * @throws IllegalStateException bekleyen surec varsa
     */
    @Transactional
    public WorkflowProcess onayaGonder(List<NetVarlikCarpaniTopluSatir> satirlar, User talepEden) {
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
        process.setSurecNo("TEMP"); // gecici - save sonrasi guncellenir
        process.setReferansModul("RISK");
        process = processRepository.save(process);
        process.setSurecNo(String.valueOf(process.getId()));
        process = processRepository.save(process);

        // 2) Her gecerli satir icin talep olustur
        for (NetVarlikCarpaniTopluSatir satir : satirlar) {
            if (!satir.isGecerli() || satir.getParametreIdListesi().isEmpty()) {
                continue;
            }
            Account account = accountRepository.findById(
                    parametreRepository.findById(satir.getParametreIdListesi().get(0))
                            .orElseThrow().getAccount().getId()
            ).orElseThrow();

            HisseRiskParametreTalebi talep = new HisseRiskParametreTalebi();
            talep.setProcess(process);
            talep.setTalepEden(talepEden);
            talep.setAccount(account);
            talep.setDurum("BEKLEMEDE");
            talep.setOlusturmaTarihi(LocalDateTime.now());

            // JSON snapshots
            String eskiDeger = String.valueOf(satir.getEskiDeger());
            String yeniDeger = String.valueOf(satir.getYeniDeger());
            talep.setOncekiDegerJson("{\"netVarlikLimitCarpani\":" + eskiDeger + "}");
            talep.setYeniDegerJson("{\"netVarlikLimitCarpani\":" + yeniDeger + "}");
            talep.setDegisiklikListesiJson(
                    "[{\"hesapNo\":\"" + satir.getHesapNo()
                    + "\",\"alan\":\"Net Varlik Limit Carpani\""
                    + ",\"eskiDeger\":\"" + eskiDeger
                    + "\",\"yeniDeger\":\"" + yeniDeger + "\"}]");

            talepRepository.save(talep);
        }

        // 3) Onayci gorevleri olustur
        workflowTaskService.createOnayTasksForRole(process, SUREC_TIPI,
                talepEden.getId(), GOREV_OZETI);

        return process;
    }

    /**
     * Talepleri onaylar: yeniDegerJson'daki degerleri hisse_risk_parametreleri
     * tablosuna uygular, talepleri ONAYLANDI yapar, sureci kapatir.
     */
    @Transactional
    public void onayla(Long processId, User kararVeren) {
        List<HisseRiskParametreTalebi> talepler = talepRepository.findByProcessId(processId);
        LocalDateTime now = LocalDateTime.now();

        for (HisseRiskParametreTalebi talep : talepler) {
            if (!"BEKLEMEDE".equals(talep.getDurum())) {
                continue;
            }
            // yeniDegerJson'dan net varlik limit carpani degerini oku
            Integer yeniDeger = parseNetVarlikLimitCarpani(talep.getYeniDegerJson());
            if (yeniDeger == null) {
                continue;
            }
            // Bu account'a ait tum hisse risk parametrelerini guncelle
            List<HisseRiskParametresi> parametreler = parametreRepository.findByAccountId(
                    talep.getAccount().getId());
            for (HisseRiskParametresi parametre : parametreler) {
                parametre.setNetVarlikLimitCarpani(yeniDeger);
                parametre.setGuncellemeTarihi(now);
                parametreRepository.save(parametre);
            }

            talep.setDurum("ONAYLANDI");
            talep.setKararTarihi(now);
            talep.setKararVeren(kararVeren);
            talepRepository.save(talep);
        }

        // Sureci kapat
        WorkflowProcess process = processRepository.findById(processId).orElseThrow();
        process.setDurum("TAMAMLANDI");
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
        List<HisseRiskParametreTalebi> talepler = talepRepository.findByProcessId(processId);
        LocalDateTime now = LocalDateTime.now();

        for (HisseRiskParametreTalebi talep : talepler) {
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
        processRepository.save(process);

        // Tum gorevleri kapat
        workflowTaskService.closeAllTasksForProcess(processId);
    }

    /**
     * Inceleme ekrani icin tum talepleri (join fetch ile) dondurur.
     */
    @Transactional(readOnly = true)
    public List<HisseRiskParametreTalebi> getTaleplerForReview(Long processId) {
        return talepRepository.findByProcessIdFetched(processId);
    }

    /**
     * Basit JSON parser — {"netVarlikLimitCarpani":3} formatindan degeri okur.
     * Tam bir JSON kutuphanesi bagimliligini onlemek icin string manipulasyonu.
     */
    private static Integer parseNetVarlikLimitCarpani(String json) {
        if (json == null) {
            return null;
        }
        try {
            // {"netVarlikLimitCarpani":3}
            int idx = json.indexOf("\"netVarlikLimitCarpani\":");
            if (idx < 0) {
                return null;
            }
            String afterKey = json.substring(idx + "\"netVarlikLimitCarpani\":".length());
            // afterKey is now "3}" or " 3 }"
            StringBuilder sb = new StringBuilder();
            for (char c : afterKey.toCharArray()) {
                if (Character.isDigit(c)) {
                    sb.append(c);
                } else if (sb.length() > 0) {
                    break;
                }
            }
            return sb.length() > 0 ? Integer.parseInt(sb.toString()) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
