package com.orion.core.controller;

import com.orion.core.dto.ChannelAuthorizationDto;
import com.orion.core.dto.ChannelAuthorizationFormDto;
import com.orion.core.dto.ChannelAuthorizationMapper;
import com.orion.core.service.ChannelAuthorizationService;
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
 * "TradeMaster Yetkilendirme" ekrani (trademaster-yetkilendirme.zul /
 * TradeMasterYetkilendirmeViewModel) icin REST API karsiligi -
 * nemesis-frontend tarafindan tuketilir. Ayni ChannelAuthorizationService'i
 * ZK ViewModel ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/core/channel-authorizations")
public class ChannelAuthorizationController {

    private final ChannelAuthorizationService service;
    private final ChannelAuthorizationMapper mapper;

    public ChannelAuthorizationController(ChannelAuthorizationService service, ChannelAuthorizationMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<ChannelAuthorizationDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toDtoList(service.search(q));
    }

    @PostMapping
    public ResponseEntity<ChannelAuthorizationDto> create(@RequestBody ChannelAuthorizationFormDto body) {
        var created = service.kaydet(null, body.getKullaniciAdi(), body.getHesapNo(),
                body.getKanal(), body.getYetkiDurumu());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PutMapping("/{id}")
    public ChannelAuthorizationDto update(@PathVariable Long id, @RequestBody ChannelAuthorizationFormDto body) {
        var updated = service.kaydet(id, body.getKullaniciAdi(), body.getHesapNo(),
                body.getKanal(), body.getYetkiDurumu());
        return mapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }
}
