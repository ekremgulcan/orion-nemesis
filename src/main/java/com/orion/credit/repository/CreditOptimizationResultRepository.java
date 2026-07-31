package com.orion.credit.repository;

import com.orion.credit.domain.CreditOptimizationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CreditOptimizationResultRepository extends JpaRepository<CreditOptimizationResult, Long> {

    @Query("select r from CreditOptimizationResult r "
            + "join fetch r.account a join fetch a.customer "
            + "where r.run.id = :runId and r.durum = :durum")
    List<CreditOptimizationResult> findByRunIdAndDurum(@Param("runId") Long runId, @Param("durum") String durum);

    @Query("select r from CreditOptimizationResult r "
            + "join fetch r.account a join fetch a.customer "
            + "where r.run.id = :runId")
    List<CreditOptimizationResult> findByRunId(@Param("runId") Long runId);
}
