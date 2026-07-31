package com.orion.core.controller;

import com.orion.core.dto.InstrumentDto;
import com.orion.core.dto.InstrumentFormDto;
import com.orion.core.dto.InstrumentMapper;
import com.orion.core.repository.InstrumentRepository;
import com.orion.core.service.InstrumentService;
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
 * Referans enstruman (master data) icin REST API. GET, "tip" parametresi
 * verilirse (VIOP/HISSE/SGMK/EUROBOND) o tipe filtrelenir - VIOP Kotasyon
 * Izleme, Hisse Kotasyon Izleme gibi salt-okunur izleme ekranlari
 * tarafindan tuketilir. POST/PUT/DELETE, "Piyasa Veri Yonetimi"
 * (piyasa-veri-yonetimi.zul / PiyasaVeriYonetimiViewModel) ekraninin
 * CRUD'unu karsilar, ayni InstrumentService'i ZK ViewModel ile birebir
 * paylasir.
 */
@RestController
@RequestMapping("/api/v1/core/instruments")
public class InstrumentController {

    private final InstrumentRepository repository;
    private final InstrumentMapper mapper;
    private final InstrumentService service;

    public InstrumentController(InstrumentRepository repository, InstrumentMapper mapper,
                                 InstrumentService service) {
        this.repository = repository;
        this.mapper = mapper;
        this.service = service;
    }

    @GetMapping
    public List<InstrumentDto> getAll(
            @RequestParam(required = false) String tip,
            @RequestParam(required = false) String q) {
        List<com.orion.core.domain.Instrument> items;
        if (tip != null && !tip.isBlank()) {
            items = (q == null || q.isBlank())
                    ? repository.findByTip(tip)
                    : repository.searchByTip(tip, q.trim());
        } else {
            items = (q == null || q.isBlank())
                    ? repository.findAll()
                    : repository.search(q.trim());
        }
        return mapper.toDtoList(items);
    }

    @PostMapping
    public ResponseEntity<InstrumentDto> create(@RequestBody InstrumentFormDto body) {
        var created = service.kaydet(null, body.getIsin(), body.getSembol(), body.getAd(),
                body.getTip(), body.getBorsa(), body.isAktif());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public InstrumentDto update(@PathVariable Long id, @RequestBody InstrumentFormDto body) {
        var updated = service.kaydet(id, body.getIsin(), body.getSembol(), body.getAd(),
                body.getTip(), body.getBorsa(), body.isAktif());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }
}
