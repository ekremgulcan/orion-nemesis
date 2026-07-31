package com.orion.workflow.controller;

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
 * dokunulmaz. Salt-okunur: sadece sorgu, CRUD yok. Oturum acan kullanici
 * yerine sabit "ademir" (musteri temsilcisi) kullanicisi varsayilir -
 * ZK ViewModel'deki ayni gecici karar burada da korunur.
 */
@RestController
@RequestMapping("/api/v1/workflow/tasks")
public class WorkflowTaskController {

    private static final String AKTIF_KULLANICI = "ademir";

    private final WorkflowTaskService service;
    private final WorkflowTaskMapper mapper;

    public WorkflowTaskController(WorkflowTaskService service, WorkflowTaskMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/acik")
    public List<WorkflowTaskDto> getAcikGorevler(
            @RequestParam(defaultValue = AKTIF_KULLANICI) String kullaniciAdi) {
        return mapper.toDtoList(service.getAcikGorevler(kullaniciAdi));
    }

    @GetMapping("/tamamlanmis")
    public List<WorkflowTaskDto> getTamamlanmisGorevler(
            @RequestParam(defaultValue = AKTIF_KULLANICI) String kullaniciAdi) {
        return mapper.toDtoList(service.getTamamlanmisGorevler(kullaniciAdi));
    }

    @GetMapping("/tumu")
    public List<WorkflowTaskDto> getTumGorevler() {
        return mapper.toDtoList(service.getTumGorevler());
    }
}
