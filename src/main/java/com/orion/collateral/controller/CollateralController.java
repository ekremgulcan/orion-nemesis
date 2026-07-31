package com.orion.collateral.controller;

import com.orion.collateral.dto.CollateralDto;
import com.orion.collateral.dto.CollateralMapper;
import com.orion.collateral.service.CollateralService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Teminat Islemleri" ekrani (teminat-transfer.zul / TeminatTransferViewModel)
 * icin depo kalemi (Serbest/Teminat Deposu) REST API'si - nemesis-frontend
 * tarafindan tuketilir. Ayni CollateralService'i ZK ViewModel ile birebir
 * paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/collateral/holdings")
public class CollateralController {

    private final CollateralService collateralService;
    private final CollateralMapper mapper;

    public CollateralController(CollateralService collateralService, CollateralMapper mapper) {
        this.collateralService = collateralService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<CollateralDto> getAll(@RequestParam(required = false) String q) {
        var items = (q == null || q.isBlank())
                ? collateralService.getAllCollaterals()
                : collateralService.searchCollaterals(q);
        return mapper.toDtoList(items);
    }
}
