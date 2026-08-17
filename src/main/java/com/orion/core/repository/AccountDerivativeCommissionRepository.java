package com.orion.core.repository;

import com.orion.core.domain.AccountDerivativeCommission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountDerivativeCommissionRepository extends JpaRepository<AccountDerivativeCommission, Long> {
    List<AccountDerivativeCommission> findByAccountId(Long accountId);
}
