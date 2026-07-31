package com.orion.collateral.repository;

import com.orion.collateral.domain.Collateral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CollateralRepository extends JpaRepository<Collateral, Long> {

    @Query("select c from Collateral c join fetch c.account a join fetch a.customer "
            + "left join fetch c.instrument order by c.account.hesapNo, c.depoTipi")
    List<Collateral> findAllFetched();

    @Query("select c from Collateral c where c.account.id = :accountId "
            + "and c.depoTipi = :depoTipi and c.varlikTipi = :varlikTipi "
            + "and ((:instrumentId is null and c.instrument is null) or c.instrument.id = :instrumentId) "
            + "and ((:paraBirimi is null and c.paraBirimi is null) or c.paraBirimi = :paraBirimi)")
    List<Collateral> findMatching(
            @org.springframework.data.repository.query.Param("accountId") Long accountId,
            @org.springframework.data.repository.query.Param("depoTipi") String depoTipi,
            @org.springframework.data.repository.query.Param("varlikTipi") String varlikTipi,
            @org.springframework.data.repository.query.Param("instrumentId") Long instrumentId,
            @org.springframework.data.repository.query.Param("paraBirimi") String paraBirimi);

    @Query("select c from Collateral c join fetch c.account a join fetch a.customer cu "
            + "left join fetch c.instrument i "
            + "where lower(a.hesapNo) like lower(concat('%', :q, '%')) "
            + "or lower(cu.adSoyadUnvan) like lower(concat('%', :q, '%')) "
            + "or lower(i.sembol) like lower(concat('%', :q, '%')) "
            + "order by c.account.hesapNo, c.depoTipi")
    List<Collateral> search(String q);
}
