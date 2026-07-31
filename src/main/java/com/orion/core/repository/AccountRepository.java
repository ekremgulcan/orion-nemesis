package com.orion.core.repository;

import com.orion.core.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Account findByHesapNo(String hesapNo);
    List<Account> findByHesapTipi(String hesapTipi);
    List<Account> findByCustomerId(Long customerId);
}
