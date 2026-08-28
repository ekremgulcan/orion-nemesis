package com.orion.workflow.controller;

import com.orion.core.service.AktifKullaniciServisi;
import com.orion.workflow.dto.WorkflowTaskDto;
import com.orion.workflow.dto.WorkflowTaskMapper;
import com.orion.workflow.service.WorkflowTaskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Gorev Listesi" ekrani (workflow/gorev-listesi.zul /
 * GorevListesiViewModel) icin REST API karsiligi. Ayni
 * WorkflowTaskService'i ZK ViewModel ile birebir paylasir, is mantigina
 * dokunulmaz. Salt-okunur: sadece sorgu, CRUD yok. Aktif kullanici artik
 * AktifKullaniciServisi'nden okunur (bkz. o sinifin javadoc'u); istek
 * uzerinde kullaniciAdi acikca gonderilirse yine de o deger kullanilir.
 */
@RestController
@RequestMapping("/api/v1/workflow/tasks")
public class WorkflowTaskController {

    private final WorkflowTaskService service;
    private final WorkflowTaskMapper mapper;
    private final AktifKullaniciServisi aktifKullaniciServisi;

    public WorkflowTaskController(WorkflowTaskService service, WorkflowTaskMapper mapper,
                                   AktifKullaniciServisi aktifKullaniciServisi) {
        this.service = service;
        this.mapper = mapper;
        this.aktifKullaniciServisi = aktifKullaniciServisi;
    }

    @GetMapping("/acik")
    public List<WorkflowTaskDto> getAcikGorevler(
            @RequestParam(required = false) String kullaniciAdi) {
        return mapper.toDtoList(service.getAcikGorevler(cozKullaniciAdi(kullaniciAdi)));
    }

    @GetMapping("/tamamlanmis")
    public List<WorkflowTaskDto> getTamamlanmisGorevler(
            @RequestParam(required = false) String kullaniciAdi) {
        return mapper.toDtoList(service.getTamamlanmisGorevler(cozKullaniciAdi(kullaniciAdi)));
    }

    private String cozKullaniciAdi(String istekteGelen) {
        return istekteGelen != null ? istekteGelen : aktifKullaniciServisi.getAktifKullaniciAdi();
    }

    @GetMapping("/tumu")
    public List<WorkflowTaskDto> getTumGorevler() {
        return mapper.toDtoList(service.getTumGorevler());
    }
}
