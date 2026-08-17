package com.orion.core.repository;

import com.orion.core.domain.CustomerExternalBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerExternalBankAccountRepository extends JpaRepository<CustomerExternalBankAccount, Long> {
    List<CustomerExternalBankAccount> findByCustomerId(Long customerId);
}
