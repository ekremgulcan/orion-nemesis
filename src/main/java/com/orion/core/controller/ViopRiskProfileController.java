package com.orion.core.controller;

import com.orion.core.dto.ViopRiskProfileDto;
import com.orion.core.dto.ViopRiskProfileFormDto;
import com.orion.core.dto.ViopRiskProfileMapper;
import com.orion.core.service.ViopRiskProfileService;
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
 * "Hesap Bazinda VIOP Risk Profili Tanim" ekrani (viop-risk-profili.zul /
 * ViopRiskProfiliViewModel) icin REST API karsiligi - nemesis-frontend
 * tarafindan tuketilir. Ayni ViopRiskProfileService'i ZK ViewModel ile
 * birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/core/viop-risk-profiles")
public class ViopRiskProfileController {

    private final ViopRiskProfileService service;
    private final ViopRiskProfileMapper mapper;

    public ViopRiskProfileController(ViopRiskProfileService service, ViopRiskProfileMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<ViopRiskProfileDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toDtoList(service.search(q));
    }

    @PostMapping
    public ResponseEntity<ViopRiskProfileDto> create(@RequestBody ViopRiskProfileFormDto body) {
        var created = service.kaydet(null, body.getHesapNo(), body.getProfilAdi(), body.getCarpan());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public ViopRiskProfileDto update(@PathVariable Long id, @RequestBody ViopRiskProfileFormDto body) {
        var updated = service.kaydet(id, body.getHesapNo(), body.getProfilAdi(), body.getCarpan());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }
}
