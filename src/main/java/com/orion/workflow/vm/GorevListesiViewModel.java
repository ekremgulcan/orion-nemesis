package com.orion.workflow.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.service.AktifKullaniciServisi;
import com.orion.workflow.domain.WorkflowTask;
import com.orion.workflow.service.WorkflowTaskService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.zk.ui.Executions;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi"
 * (gorev-listesi.zul) ekrani icin ViewModel. Gorev tiklandiginda
 * ilgili inceleme ekranini yeni sekmede acar (@GlobalCommand ile
 * IndexViewModel'e bildirir).
 */
public class GorevListesiViewModel {

    private static final Map<String, String> SUREC_TIPI_ZUL_MAP = new HashMap<>();
    static {
        SUREC_TIPI_ZUL_MAP.put("HISSE_RISK_PARAMETRELERI_ONAY", "/risk/hisse-risk-parametreleri.zul");
        // future: SUREC_TIPI_ZUL_MAP.put("BILDIRIM_AYARLARI_ONAY", "/notification/bildirim-ayarlari.zul");
    }

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
        tamamlanmisGorevler = workflowTaskService.getTamamlanmisGorevler(aktifKullaniciAdi)
                .stream()
                .filter(t -> t.getProcess().getIslemSonucu() != null)
                .collect(java.util.stream.Collectors.toList());
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

    /**
     * Uzerimdeki Gorevler tab'inda bir gorev satirina tiklandiginda
     * ilgili inceleme ekranini yeni sekmede acar. Process ID'yi
     * session attribute olarak kaydeder, sonra IndexViewModel'e
     * @GlobalCommand ile "openReviewTab" gonderir.
     */
    @Command
    public void gorevSec(@BindingParam("task") WorkflowTask task) {
        String surecTipi = task.getProcess().getSurecTipi();
        String zulPath = SUREC_TIPI_ZUL_MAP.get(surecTipi);
        if (zulPath == null) {
            return; // bilinmeyen surec tipi - navigasyon yapma
        }

        // Hedef ViewModel'in @ExecutionArgParam ile alabilmesi icin
        // IndexViewModel'e yeni sekme ac komutu gonder ve parametreyi tasi
        String baslik = "Surec : " + task.getProcess().getSurecNo();
        Map<String, Object> args = new HashMap<>();
        args.put("zulPath", zulPath);
        args.put("baslik", baslik);
        args.put("incelemeProcessId", task.getProcess().getId());
        BindUtils.postGlobalCommand(null, null, "openReviewTab", args);
    }
}

