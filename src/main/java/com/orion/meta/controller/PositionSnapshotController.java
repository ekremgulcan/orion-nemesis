package com.orion.meta.controller;

import com.orion.meta.dto.MetaPositionMapper;
import com.orion.meta.dto.PositionSnapshotDto;
import com.orion.meta.service.MetaPozisyonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Meta Pozisyon Servisi" ekraninin pozisyon anlik goruntu (snapshot)
 * bolumu (meta-pozisyon-servisi.zul / MetaPozisyonServisiViewModel) icin
 * REST API karsiligi. Salt-okunur: pozisyonlar islemlerden turetildigi
 * icin CRUD yapilmaz, sadece arama. Ayni MetaPozisyonService'i ZK
 * ViewModel ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/meta/position-snapshots")
public class PositionSnapshotController {

    private final MetaPozisyonService service;
    private final MetaPositionMapper mapper;

    public PositionSnapshotController(MetaPozisyonService service, MetaPositionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<PositionSnapshotDto> getAll(@RequestParam(required = false) String q) {
        return mapper.toSnapshotDtoList(service.searchPositions(q));
    }
}
