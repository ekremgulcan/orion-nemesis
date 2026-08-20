package com.orion.core.repository;

import com.orion.core.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Account findByHesapNo(String hesapNo);
    List<Account> findByHesapTipi(String hesapTipi);
    List<Account> findByCustomerId(Long customerId);

    @Query("select a from Account a join fetch a.customer order by a.hesapNo")
    List<Account> findAllFetched();

    @Query("select a from Account a join fetch a.customer where a.id = :id")
    Optional<Account> findByIdFetched(@Param("id") Long id);

    @Query("select a from Account a join fetch a.customer c where a.customer.id = :customerId order by a.hesapNo")
    List<Account> findByCustomerIdFetched(@Param("customerId") Long customerId);
}
