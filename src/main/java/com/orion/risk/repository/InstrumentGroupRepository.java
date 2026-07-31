package com.orion.risk.repository;

import com.orion.risk.domain.InstrumentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InstrumentGroupRepository extends JpaRepository<InstrumentGroup, Long> {

    @Query("select distinct g from InstrumentGroup g left join fetch g.uyeler order by g.grupKodu")
    List<InstrumentGroup> findAllFetched();

    @Query("select distinct g from InstrumentGroup g left join fetch g.uyeler " +
            "where lower(g.grupKodu) like lower(concat('%', :q, '%')) " +
            "or lower(g.aciklama) like lower(concat('%', :q, '%')) " +
            "order by g.grupKodu")
    List<InstrumentGroup> search(String q);
}
