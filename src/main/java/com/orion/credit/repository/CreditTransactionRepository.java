package com.orion.credit.repository;

import com.orion.credit.domain.CreditTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {
}
