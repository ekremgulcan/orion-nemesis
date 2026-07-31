package com.orion.cash.repository;

import com.orion.cash.domain.CashTransactionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CashTransactionRequestRepository extends JpaRepository<CashTransactionRequest, Long> {

    @Query("select c from CashTransactionRequest c join fetch c.account a join fetch a.customer "
            + "order by c.olusturmaTarihi desc")
    List<CashTransactionRequest> findAllFetched();
}
