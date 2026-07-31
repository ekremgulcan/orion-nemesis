package com.orion.collateral.controller;

import com.orion.collateral.dto.CollateralTransferDto;
import com.orion.collateral.dto.CollateralTransferMapper;
import com.orion.collateral.dto.CreateCollateralTransferDto;
import com.orion.collateral.service.CollateralService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Teminat Onay Ekrani" (teminat-onay.zul / TeminatOnayViewModel) icin
 * REST API karsiligi - nemesis-frontend tarafindan tuketilir. Ayni
 * CollateralService'i ZK ViewModel ile birebir paylasir, is mantigina
 * dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/collateral/transfers")
public class CollateralTransferController {

    private final CollateralService collateralService;
    private final CollateralTransferMapper mapper;

    public CollateralTransferController(CollateralService collateralService,
                                         CollateralTransferMapper mapper) {
        this.collateralService = collateralService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<CollateralTransferDto> getAll(@RequestParam(required = false) String durum) {
        List<com.orion.collateral.domain.CollateralTransfer> items = (durum == null || durum.isBlank())
                ? collateralService.getAllTransfers()
                : collateralService.getTransfersByDurum(durum);
        return mapper.toDtoList(items);
    }

    @PostMapping
    public ResponseEntity<CollateralTransferDto> create(@RequestBody CreateCollateralTransferDto body) {
        var created = collateralService.talepOlustur(
                body.getHesapNo(),
                body.getPiyasa(),
                body.getSaklamaci(),
                body.getTeminatTipi(),
                body.getKaynakDepo(),
                body.getHedefDepo(),
                body.getParaBirimi(),
                body.getMiktar(),
                body.getAciklama());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        // TODO: JWT eklenince onaylayan kullanici id'si token'dan alinmali.
        collateralService.onayla(id, 1L);
    }

    @PostMapping("/{id}/cancel")
    public void cancel(@PathVariable Long id) {
        collateralService.iptalEt(id);
    }

    @PostMapping("/{id}/revise")
    public void revise(@PathVariable Long id) {
        collateralService.revizyonaGonder(id);
    }

    @PostMapping("/{id}/pool")
    public void pool(@PathVariable Long id) {
        collateralService.havuzaGonder(id);
    }
}
