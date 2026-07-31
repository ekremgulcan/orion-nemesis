package com.orion.meta.controller;

import com.orion.meta.dto.MetaPositionMapper;
import com.orion.meta.dto.PositionShockScenarioDto;
import com.orion.meta.dto.PositionShockScenarioFormDto;
import com.orion.meta.service.MetaPozisyonService;
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
 * "Meta Pozisyon Servisi" ekraninin sok senaryolari bolumu
 * (meta-pozisyon-servisi.zul / MetaPozisyonServisiViewModel) icin REST
 * API karsiligi. Ayni MetaPozisyonService'i ZK ViewModel ile birebir
 * paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/meta/shock-scenarios")
public class PositionShockScenarioController {

    private final MetaPozisyonService service;
    private final MetaPositionMapper mapper;

    public PositionShockScenarioController(MetaPozisyonService service, MetaPositionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<PositionShockScenarioDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toScenarioDtoList(service.searchScenarios(q));
    }

    @PostMapping
    public ResponseEntity<PositionShockScenarioDto> create(@RequestBody PositionShockScenarioFormDto body) {
        var created = service.kaydetScenario(null, body.getSenaryoAdi(), body.getCurrencyPair(),
                body.getSokYuzdesi(), body.isAktif());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public PositionShockScenarioDto update(@PathVariable Long id, @RequestBody PositionShockScenarioFormDto body) {
        var updated = service.kaydetScenario(id, body.getSenaryoAdi(), body.getCurrencyPair(),
                body.getSokYuzdesi(), body.isAktif());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.silScenario(id);
        return ResponseEntity.noContent().build();
    }
}
