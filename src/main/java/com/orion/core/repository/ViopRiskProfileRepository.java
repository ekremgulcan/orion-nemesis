package com.orion.core.repository;

import com.orion.core.domain.ViopRiskProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ViopRiskProfileRepository extends JpaRepository<ViopRiskProfile, Long> {

    @Query("select v from ViopRiskProfile v join fetch v.account a join fetch a.customer order by a.hesapNo")
    List<ViopRiskProfile> findAllFetched();

    @Query("select v from ViopRiskProfile v join fetch v.account a join fetch a.customer c " +
            "where lower(a.hesapNo) like lower(concat('%', :q, '%')) " +
            "or lower(c.adSoyadUnvan) like lower(concat('%', :q, '%')) " +
            "or lower(v.profilAdi) like lower(concat('%', :q, '%')) " +
            "order by a.hesapNo")
    List<ViopRiskProfile> search(String q);
}
