package com.orion.report.controller;

import com.orion.report.dto.ReportDefinitionDto;
import com.orion.report.dto.ReportDefinitionFormDto;
import com.orion.report.dto.ReportDefinitionMapper;
import com.orion.report.service.ReportDefinitionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Rapor Tanimlari" ekrani (report/rapor-tanimlari.zul /
 * RaporTanimlariViewModel) icin REST API karsiligi. Ayni
 * ReportDefinitionService'i ZK ViewModel ile birebir paylasir, is
 * mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/report/definitions")
public class ReportDefinitionController {

    private final ReportDefinitionService service;
    private final ReportDefinitionMapper mapper;

    public ReportDefinitionController(ReportDefinitionService service, ReportDefinitionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<ReportDefinitionDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toDtoList(service.search(q));
    }

    @PostMapping
    public ResponseEntity<ReportDefinitionDto> create(@RequestBody ReportDefinitionFormDto body) {
        var created = service.kaydet(null, body.getRaporAdi(), body.getRaporSinifi(), body.getZamanlama(),
                body.isMailGonder(), body.getIcerik());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public ReportDefinitionDto update(@PathVariable Long id, @RequestBody ReportDefinitionFormDto body) {
        var updated = service.kaydet(id, body.getRaporAdi(), body.getRaporSinifi(), body.getZamanlama(),
                body.isMailGonder(), body.getIcerik());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }
}
