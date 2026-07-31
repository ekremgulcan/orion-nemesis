package com.orion.risk.controller;

import com.orion.risk.dto.InstrumentGroupDto;
import com.orion.risk.dto.InstrumentGroupFormDto;
import com.orion.risk.dto.InstrumentGroupMapper;
import com.orion.risk.service.RiskProfileService;
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
 * "Hisse Grubu Tanimlama" ekrani (hisse-grubu-tanimlama.zul /
 * HisseGrubuViewModel) icin REST API karsiligi. Ayni RiskProfileService'i
 * ZK ViewModel ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/risk/instrument-groups")
public class InstrumentGroupController {

    private final RiskProfileService service;
    private final InstrumentGroupMapper mapper;

    public InstrumentGroupController(RiskProfileService service, InstrumentGroupMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<InstrumentGroupDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toDtoList(service.searchInstrumentGroups(q));
    }

    @PostMapping
    public ResponseEntity<InstrumentGroupDto> create(@RequestBody InstrumentGroupFormDto body) {
        var created = service.kaydetInstrumentGroup(null, body.getGrupKodu(), body.getAciklama(),
                body.isAktif(), body.getInstrumentIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public InstrumentGroupDto update(@PathVariable Long id, @RequestBody InstrumentGroupFormDto body) {
        var updated = service.kaydetInstrumentGroup(id, body.getGrupKodu(), body.getAciklama(),
                body.isAktif(), body.getInstrumentIds());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.silInstrumentGroup(id);
        return ResponseEntity.noContent().build();
    }
}
