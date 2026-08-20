package com.orion.core.repository;

import com.orion.core.domain.AccountReportingPref;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountReportingPrefRepository extends JpaRepository<AccountReportingPref, Long> {
    List<AccountReportingPref> findByAccountId(Long accountId);
}
