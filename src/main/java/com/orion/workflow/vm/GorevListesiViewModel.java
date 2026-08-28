package com.orion.workflow.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.service.AktifKullaniciServisi;
import com.orion.workflow.domain.WorkflowTask;
import com.orion.workflow.service.WorkflowTaskService;
import org.zkoss.bind.annotation.Init;

import java.util.List;

/**
 * "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi"
 * (gorev-listesi.zul) ekrani icin ViewModel. Aktif kullanici artik
 * AktifKullaniciServisi'nden okunur (bkz. o sinifin javadoc'u) - onceki
 * sabit "ademir" varsayimi kaldirildi.
 */
public class GorevListesiViewModel {

    private final WorkflowTaskService workflowTaskService =
            SpringContextHolder.getBean(WorkflowTaskService.class);
    private final AktifKullaniciServisi aktifKullaniciServisi =
            SpringContextHolder.getBean(AktifKullaniciServisi.class);

    private List<WorkflowTask> uzerimdekiGorevler;
    private List<WorkflowTask> tamamlanmisGorevler;
    private List<WorkflowTask> tumGorevler;

    @Init
    public void init() {
        String aktifKullaniciAdi = aktifKullaniciServisi.getAktifKullaniciAdi();
        uzerimdekiGorevler = workflowTaskService.getAcikGorevler(aktifKullaniciAdi);
        tamamlanmisGorevler = workflowTaskService.getTamamlanmisGorevler(aktifKullaniciAdi);
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
