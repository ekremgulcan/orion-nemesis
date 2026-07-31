package com.orion.workflow.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.workflow.domain.WorkflowTask;
import com.orion.workflow.service.WorkflowTaskService;
import org.zkoss.bind.annotation.Init;

import java.util.List;

/**
 * "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi"
 * (gorev-listesi.zul) ekrani icin ViewModel. Simdilik oturum acan kullanici
 * yerine sabit "ademir" kullanicisi (musteri temsilcisi) varsayilmistir.
 */
public class GorevListesiViewModel {

    private final WorkflowTaskService workflowTaskService =
            SpringContextHolder.getBean(WorkflowTaskService.class);

    private static final String AKTIF_KULLANICI = "ademir";

    private List<WorkflowTask> uzerimdekiGorevler;
    private List<WorkflowTask> tamamlanmisGorevler;
    private List<WorkflowTask> tumGorevler;

    @Init
    public void init() {
        uzerimdekiGorevler = workflowTaskService.getAcikGorevler(AKTIF_KULLANICI);
        tamamlanmisGorevler = workflowTaskService.getTamamlanmisGorevler(AKTIF_KULLANICI);
        tumGorevler = workflowTaskService.getTumGorevler();
    }

    public List<WorkflowTask> getUzerimdekiGorevler() {
        return uzerimdekiGorevler;
    }

    public List<WorkflowTask> getTamamlanmisGorevler() {
        return tamamlanmisGorevler;
    }

    public List<WorkflowTask> getTumGorevler() {
        return tumGorevler;
    }
}
