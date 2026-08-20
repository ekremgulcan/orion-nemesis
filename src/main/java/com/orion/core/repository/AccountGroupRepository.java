package com.orion.core.repository;

import com.orion.core.domain.AccountGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountGroupRepository extends JpaRepository<AccountGroup, Long> {
    List<AccountGroup> findByAccountId(Long accountId);
}
