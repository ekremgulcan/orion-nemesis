package com.orion.core.controller;

import com.orion.core.dto.CustomerDto;
import com.orion.core.dto.CustomerFormDto;
import com.orion.core.dto.CustomerMapper;
import com.orion.core.service.CustomerService;
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
 * "Musteri Yonetim Sistemi" ekrani (musteriler.zul / MusteriListesiViewModel)
 * icin REST API karsiligi - nemesis-frontend tarafindan tuketilir. Ayni
 * CustomerService'i ZK ViewModel ile birebir paylasir, is mantigina
 * dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/core/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerMapper mapper;

    public CustomerController(CustomerService customerService, CustomerMapper mapper) {
        this.customerService = customerService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<CustomerDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toDtoList(customerService.search(q));
    }

    /**
     * Musteri No'ya gore tek bir musteri dondurur ("Musteri No arama" ihtiyaci
     * olan her ekranin - orn. Musteri Bildirim Tercihleri - kullanabilmesi
     * icin; CustomerService.bulByMusteriNo(...) uzerinden calisir.
     */
    @GetMapping("/by-musteri-no/{musteriNo}")
    public CustomerDto getByMusteriNo(@PathVariable String musteriNo) {
        return mapper.toDto(customerService.bulByMusteriNo(musteriNo));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> create(@RequestBody CustomerFormDto body) {
        var created = customerService.kaydet(null, body.getMusteriNo(), body.getAdSoyadUnvan(),
                body.getMusteriTipi(), body.getTcknVkn(), body.getRiskGrubu(), body.getTelefon(),
                body.getEmail(), body.isAktif());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public CustomerDto update(@PathVariable Long id, @RequestBody CustomerFormDto body) {
        var updated = customerService.kaydet(id, body.getMusteriNo(), body.getAdSoyadUnvan(),
                body.getMusteriTipi(), body.getTcknVkn(), body.getRiskGrubu(), body.getTelefon(),
                body.getEmail(), body.isAktif());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        customerService.sil(id);
        return ResponseEntity.noContent().build();
    }
}
