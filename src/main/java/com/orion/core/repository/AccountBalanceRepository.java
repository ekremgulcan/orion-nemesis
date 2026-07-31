package com.orion.core.repository;

import com.orion.core.domain.AccountBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountBalanceRepository extends JpaRepository<AccountBalance, Long> {

    @Query("select b from AccountBalance b "
            + "join fetch b.account a join fetch a.customer "
            + "order by a.hesapNo")
    List<AccountBalance> findAllFetched();

    Optional<AccountBalance> findByAccountId(Long accountId);

    @Query("select b from AccountBalance b "
            + "join fetch b.account a join fetch a.customer c "
            + "where lower(a.hesapNo) like lower(concat('%', :q, '%')) "
            + "or lower(c.adSoyadUnvan) like lower(concat('%', :q, '%')) "
            + "order by a.hesapNo")
    List<AccountBalance> search(@Param("q") String q);
}
