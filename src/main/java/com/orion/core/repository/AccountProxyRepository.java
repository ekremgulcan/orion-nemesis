package com.orion.core.repository;

import com.orion.core.domain.AccountProxy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountProxyRepository extends JpaRepository<AccountProxy, Long> {
    List<AccountProxy> findByAccountId(Long accountId);
}
