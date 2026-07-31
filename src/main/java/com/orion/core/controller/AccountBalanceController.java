package com.orion.core.controller;

import com.orion.core.dto.AccountBalanceDto;
import com.orion.core.dto.AccountBalanceMapper;
import com.orion.core.repository.AccountBalanceRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Nakit Yonetimi" ekrani (nakit-yonetimi.zul / NakitYonetimiViewModel)
 * icin REST API karsiligi - nemesis-frontend tarafindan tuketilir. Bakiye
 * salt-okunur bir gorunum oldugu icin (islemlerden turetiliyor), ViewModel
 * gibi bu controller de dogrudan AccountBalanceRepository kullanir, ayri
 * bir servis katmani yoktur.
 */
@RestController
@RequestMapping("/api/v1/cash/balances")
public class AccountBalanceController {

    private final AccountBalanceRepository accountBalanceRepository;
    private final AccountBalanceMapper mapper;

    public AccountBalanceController(AccountBalanceRepository accountBalanceRepository,
                                     AccountBalanceMapper mapper) {
        this.accountBalanceRepository = accountBalanceRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public List<AccountBalanceDto> getAll(@RequestParam(required = false) String q) {
        var items = (q == null || q.isBlank())
                ? accountBalanceRepository.findAllFetched()
                : accountBalanceRepository.search(q.trim());
        return mapper.toDtoList(items);
    }
}
