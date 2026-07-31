package com.orion.risk.repository;

import com.orion.risk.domain.RiskProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiskProfileRepository extends JpaRepository<RiskProfile, Long> {

    @Query("select r from RiskProfile r left join fetch r.user left join fetch r.account a "
            + "left join fetch a.customer where r.enstrumanTipi = :tip order by r.id")
    List<RiskProfile> findByEnstrumanTipi(@Param("tip") String tip);

    @Query("select r from RiskProfile r left join fetch r.user left join fetch r.account a "
            + "left join fetch a.customer order by r.id")
    List<RiskProfile> findAllFetched();

    @Query("select r from RiskProfile r left join fetch r.user u left join fetch r.account a "
            + "left join fetch a.customer "
            + "where r.enstrumanTipi = :tip "
            + "and (lower(u.adSoyad) like lower(concat('%', :q, '%')) "
            + "or lower(a.hesapNo) like lower(concat('%', :q, '%'))) "
            + "order by r.id")
    List<RiskProfile> searchByEnstrumanTipi(@Param("tip") String tip, @Param("q") String q);
}
