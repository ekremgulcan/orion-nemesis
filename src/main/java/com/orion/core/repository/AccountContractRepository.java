package com.orion.core.repository;

import com.orion.core.domain.AccountContract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountContractRepository extends JpaRepository<AccountContract, Long> {
    List<AccountContract> findByAccountId(Long accountId);
}
