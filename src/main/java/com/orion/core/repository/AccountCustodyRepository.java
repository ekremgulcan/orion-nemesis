package com.orion.core.repository;

import com.orion.core.domain.AccountCustody;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountCustodyRepository extends JpaRepository<AccountCustody, Long> {
    List<AccountCustody> findByAccountId(Long accountId);
}
