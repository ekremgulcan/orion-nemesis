package com.orion.risk.controller;

import com.orion.risk.dto.AccountInstrumentControlDto;
import com.orion.risk.dto.AccountInstrumentControlFormDto;
import com.orion.risk.dto.AccountInstrumentControlMapper;
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
 * "Hesap/Hisse Bazinda Kontrol" ekrani (hesap-hisse-kontrol.zul /
 * HesapHisseKontrolViewModel) icin REST API karsiligi. Ayni
 * RiskProfileService'i ZK ViewModel ile birebir paylasir, is mantigina
 * dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/risk/account-instrument-controls")
public class AccountInstrumentControlController {

    private final RiskProfileService service;
    private final AccountInstrumentControlMapper mapper;

    public AccountInstrumentControlController(RiskProfileService service, AccountInstrumentControlMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<AccountInstrumentControlDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toDtoList(service.searchAccountInstrumentControls(q));
    }

    @PostMapping
    public ResponseEntity<AccountInstrumentControlDto> create(@RequestBody AccountInstrumentControlFormDto body) {
        var created = service.kaydetAccountInstrumentControl(null, body.getKullaniciAdi(), body.getHesapNo(),
                body.getEnstrumanSembol(), body.isAlisIzni(), body.isSatisIzni(), body.isAcikSatisIzni());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public AccountInstrumentControlDto update(@PathVariable Long id, @RequestBody AccountInstrumentControlFormDto body) {
        var updated = service.kaydetAccountInstrumentControl(id, body.getKullaniciAdi(), body.getHesapNo(),
                body.getEnstrumanSembol(), body.isAlisIzni(), body.isSatisIzni(), body.isAcikSatisIzni());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.silAccountInstrumentControl(id);
        return ResponseEntity.noContent().build();
    }
}
