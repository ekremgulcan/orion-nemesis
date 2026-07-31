package com.orion.meta.repository;

import com.orion.meta.domain.PositionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PositionSnapshotRepository extends JpaRepository<PositionSnapshot, Long> {

    @Query("select p from PositionSnapshot p join fetch p.account a join fetch a.customer "
            + "left join fetch p.instrument order by p.id")
    List<PositionSnapshot> findAllFetched();

    @Query("select p from PositionSnapshot p join fetch p.account a join fetch a.customer c "
            + "left join fetch p.instrument i "
            + "where lower(a.hesapNo) like lower(concat('%', :q, '%')) "
            + "or lower(c.adSoyadUnvan) like lower(concat('%', :q, '%')) "
            + "or lower(i.sembol) like lower(concat('%', :q, '%')) "
            + "order by p.id")
    List<PositionSnapshot> search(@Param("q") String q);
}
