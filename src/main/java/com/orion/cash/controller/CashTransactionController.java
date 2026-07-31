package com.orion.cash.controller;

import com.orion.cash.dto.CashTransactionRequestDto;
import com.orion.cash.dto.CashTransactionRequestMapper;
import com.orion.cash.dto.CreateCashTransactionRequestDto;
import com.orion.cash.service.CashTransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Nakit Islem Giris" ekrani (nakit-islem-giris.zul / NakitIslemGirisViewModel)
 * icin REST API karsiligi - nemesis-frontend tarafindan tuketilir. Ayni
 * CashTransactionService'i ZK ViewModel ile birebir paylasir, is mantigina
 * dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/cash/transaction-requests")
public class CashTransactionController {

    private final CashTransactionService cashTransactionService;
    private final CashTransactionRequestMapper mapper;

    public CashTransactionController(CashTransactionService cashTransactionService,
                                      CashTransactionRequestMapper mapper) {
        this.cashTransactionService = cashTransactionService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<CashTransactionRequestDto> getAll() {
        return mapper.toDtoList(cashTransactionService.getAll());
    }

    @PostMapping
    public ResponseEntity<CashTransactionRequestDto> create(@RequestBody CreateCashTransactionRequestDto body) {
        var created = cashTransactionService.talepOlustur(
                body.getHesapNo(),
                body.getTalepKanali(),
                body.getEmirVeren(),
                body.getValorTarihi(),
                body.getTutar(),
                body.getParaBirimi(),
                body.getIslemYonu(),
                body.getYontem(),
                body.getIban(),
                body.getKarsiHesapNo(),
                body.getIymBankaHesabi(),
                body.getAciklama());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(created));
    }

    @PostMapping("/{id}/approve")
    public CashTransactionRequestDto approve(@PathVariable Long id) {
        return mapper.toDto(cashTransactionService.onaylaVeTamamla(id));
    }

    @PostMapping("/{id}/reject")
    public CashTransactionRequestDto reject(@PathVariable Long id) {
        return mapper.toDto(cashTransactionService.reddet(id));
    }
}
