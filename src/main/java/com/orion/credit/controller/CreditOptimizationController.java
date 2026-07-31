package com.orion.credit.controller;

import com.orion.credit.dto.CreditOptimizationMapper;
import com.orion.credit.dto.OptimizationRunResponse;
import com.orion.credit.dto.StartOptimizationRunRequest;
import com.orion.credit.service.CreditOptimizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani" (kredi-optimizasyon.zul
 * / KrediOptimizasyonViewModel) icin REST API karsiligi. Ayni
 * CreditOptimizationService'i ZK ViewModel ile birebir paylasir, is
 * mantigina dokunulmaz. Auth henuz yok, "system" kullanicisi ile calisir
 * (ViewModel'deki mevcut davranisla ayni).
 */
@RestController
@RequestMapping("/api/v1/credit/optimization-runs")
public class CreditOptimizationController {

    private final CreditOptimizationService service;
    private final CreditOptimizationMapper mapper;

    public CreditOptimizationController(CreditOptimizationService service, CreditOptimizationMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/gunbasi")
    public ResponseEntity<OptimizationRunResponse> gunbasiBaslat(@RequestBody StartOptimizationRunRequest body) {
        var run = service.startRun("GUNBASI", body.getHedefOzkaynakOrani(), "system");
        return ResponseEntity.status(HttpStatus.CREATED).body(buildResponse(run.getId(), run, null));
    }

    @PostMapping("/gunici")
    public ResponseEntity<OptimizationRunResponse> guniciBaslat(@RequestBody StartOptimizationRunRequest body) {
        var run = service.startRun("GUNICI", body.getHedefOzkaynakOrani(), "system");
        return ResponseEntity.status(HttpStatus.CREATED).body(buildResponse(run.getId(), run, null));
    }

    @PostMapping("/{runId}/surec-baslat")
    public OptimizationRunResponse surecBaslat(@PathVariable Long runId) {
        int uygulanan = service.surecBaslat(runId);
        return buildResponse(runId, null, uygulanan);
    }

    private OptimizationRunResponse buildResponse(Long runId, com.orion.credit.domain.CreditOptimizationRun run, Integer uygulananSayisi) {
        var response = new OptimizationRunResponse();
        if (run != null) {
            response.setRun(mapper.toDto(run));
        }
        response.setUygunHaleGelenler(mapper.toResultDtoList(service.getUygunSonuclar(runId)));
        response.setUygunHaleGelmeyenler(mapper.toResultDtoList(service.getUygunDegilSonuclar(runId)));
        response.setUygulananSayisi(uygulananSayisi);
        return response;
    }
}
