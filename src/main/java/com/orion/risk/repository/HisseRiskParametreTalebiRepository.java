package com.orion.risk.repository;

import com.orion.risk.domain.HisseRiskParametreTalebi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HisseRiskParametreTalebiRepository extends JpaRepository<HisseRiskParametreTalebi, Long> {

    @Query("select t from HisseRiskParametreTalebi t "
            + "join fetch t.process join fetch t.talepEden "
            + "join fetch t.account a join fetch a.customer "
            + "where t.id = :id")
    Optional<HisseRiskParametreTalebi> findByIdFetched(@Param("id") Long id);

    @Query("select t from HisseRiskParametreTalebi t "
            + "join fetch t.process join fetch t.talepEden "
            + "join fetch t.account a join fetch a.customer "
            + "where t.process.id = :processId")
    List<HisseRiskParametreTalebi> findByProcessIdFetched(@Param("processId") Long processId);

    List<HisseRiskParametreTalebi> findByProcessId(Long processId);
}
