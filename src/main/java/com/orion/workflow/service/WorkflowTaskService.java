package com.orion.workflow.service;

import com.orion.core.repository.UserRepository;
import com.orion.workflow.domain.WorkflowTask;
import com.orion.workflow.repository.WorkflowTaskRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi" ekraninin
 * arkasindaki sorgu servisi.
 */
@Service
public class WorkflowTaskService {

    private final WorkflowTaskRepository workflowTaskRepository;
    private final UserRepository userRepository;

    public WorkflowTaskService(WorkflowTaskRepository workflowTaskRepository, UserRepository userRepository) {
        this.workflowTaskRepository = workflowTaskRepository;
        this.userRepository = userRepository;
    }

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
}
