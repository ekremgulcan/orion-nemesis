package com.orion.core.repository;

import com.orion.core.domain.AccountCommission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountCommissionRepository extends JpaRepository<AccountCommission, Long> {
    List<AccountCommission> findByAccountId(Long accountId);
}
