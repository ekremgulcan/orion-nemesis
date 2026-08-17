package com.orion.core.repository;

import com.orion.core.domain.AccountControlValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountControlValueRepository extends JpaRepository<AccountControlValue, Long> {
    List<AccountControlValue> findByAccountId(Long accountId);
}
