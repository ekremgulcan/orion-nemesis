package com.orion.workflow.service;

import com.orion.core.domain.User;
import com.orion.core.repository.UserRepository;
import com.orion.workflow.domain.SurecTipiOnayRolu;
import com.orion.workflow.domain.WorkflowProcess;
import com.orion.workflow.domain.WorkflowTask;
import com.orion.workflow.repository.SurecTipiOnayRoluRepository;
import com.orion.workflow.repository.WorkflowProcessRepository;
import com.orion.workflow.repository.WorkflowTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi" ekraninin
 * arkasindaki sorgu servisi + generic onay altyapisi metotlari. Modul-spesifik
 * onay servisleri (HisseRiskOnayService vb.) buradaki generic metotlari cagirir.
 */
@Service
public class WorkflowTaskService {

    private final WorkflowTaskRepository workflowTaskRepository;
    private final WorkflowProcessRepository workflowProcessRepository;
    private final SurecTipiOnayRoluRepository surecTipiOnayRoluRepository;
    private final UserRepository userRepository;

    public WorkflowTaskService(WorkflowTaskRepository workflowTaskRepository,
                               WorkflowProcessRepository workflowProcessRepository,
                               SurecTipiOnayRoluRepository surecTipiOnayRoluRepository,
                               UserRepository userRepository) {
        this.workflowTaskRepository = workflowTaskRepository;
        this.workflowProcessRepository = workflowProcessRepository;
        this.surecTipiOnayRoluRepository = surecTipiOnayRoluRepository;
        this.userRepository = userRepository;
    }

    // --- Mevcut sorgu metotlari ---

    public List<WorkflowTask> getAcikGorevler(String kullaniciAdi) {
        var user = userRepository.findByKullaniciAdi(kullaniciAdi);
        if (user == null) {
            return Collections.emptyList();
        }
        return workflowTaskRepository.findBySahipIdAndDurum(user.getId(), "ACIK");
    }

    public List<WorkflowTask> getTamamlanmisGorevler(String kullaniciAdi) {
        var user = userRepository.findByKullaniciAdi(kullaniciAdi);
        if (user == null) {
            return Collections.emptyList();
        }
        return workflowTaskRepository.findBySahipIdAndDurum(user.getId(), "TAMAMLANDI");
    }

    public List<WorkflowTask> getTumGorevler() {
        return workflowTaskRepository.findAllFetched();
    }

    // --- Generic onay altyapisi metotlari ---

    /**
     * Verilen surec tipi icin bekleyen (ACIK) bir surec olup olmadigini kontrol
     * eder. Ayni surec tipi icin birden fazla onay sureci acilmasini engellemek
     * icin kullanilir (orn. toplu guncelleme icin onceki onay tamamlanmadan
     * yeni bir guncelleme gonderilemez).
     */
    public boolean hasPendingProcess(String surecTipi) {
        return !workflowProcessRepository.findBySurecTipiAndDurum(surecTipi, "ACIK").isEmpty();
    }

    /**
     * Verilen surec tipi icin onayci rolunu bulur, o roldeki tum aktif
     * kullanicilara (gondereni haric) birer gorev olusturur. Birden fazla
     * onayci rolu varsa (normalde tek) hepsine gorev olusturulur.
     *
     * @return olusturulan gorev sayisi
     */
    @Transactional
    public int createOnayTasksForRole(WorkflowProcess process, String surecTipi,
                                       Long submitterUserId, String gorevOzeti) {
        List<SurecTipiOnayRolu> roller = surecTipiOnayRoluRepository.findBySurecTipiAndAktifTrue(surecTipi);
        if (roller.isEmpty()) {
            throw new IllegalStateException("Surec tipi icin onayci rolu tanimlanmamis: " + surecTipi);
        }
        int count = 0;
        for (SurecTipiOnayRolu mapping : roller) {
            List<User> approvers = userRepository.findByRolAdiAndAktif(mapping.getRolAdi());
            for (User approver : approvers) {
                if (approver.getId().equals(submitterUserId)) {
                    continue; // gondereni haric tut
                }
                WorkflowTask task = new WorkflowTask();
                task.setProcess(process);
                task.setSahip(approver);
                task.setGorevOzeti(gorevOzeti);
                task.setDurum("ACIK");
                task.setAtanmaTarihi(LocalDateTime.now());
                workflowTaskRepository.save(task);
                count++;
            }
        }
        return count;
    }

    /**
     * Bir onayci karar verdikten sonra, ayni surece ait diger tum ACIK
     * gorevleri TAMAMLANDI olarak kapatir (sibling close).
     */
    @Transactional
    public void closeAllTasksForProcess(Long processId) {
        List<WorkflowTask> acikTasks = workflowTaskRepository.findByProcessIdAndDurum(processId, "ACIK");
        LocalDateTime now = LocalDateTime.now();
        for (WorkflowTask task : acikTasks) {
            task.setDurum("TAMAMLANDI");
            task.setTamamlanmaTarihi(now);
            workflowTaskRepository.save(task);
        }
    }
}

