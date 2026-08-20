package com.orion.core.repository;

import com.orion.core.domain.AccountHiddenAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountHiddenAccountRepository extends JpaRepository<AccountHiddenAccount, Long> {
    List<AccountHiddenAccount> findByAccountId(Long accountId);
}
