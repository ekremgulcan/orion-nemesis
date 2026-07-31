package com.orion.credit.repository;

import com.orion.credit.domain.CreditAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditAccountRepository extends JpaRepository<CreditAccount, Long> {
    CreditAccount findByAccountId(Long accountId);
}
