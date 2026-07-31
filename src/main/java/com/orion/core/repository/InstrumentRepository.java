package com.orion.core.repository;

import com.orion.core.domain.Instrument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InstrumentRepository extends JpaRepository<Instrument, Long> {
    List<Instrument> findByTip(String tip);

    @Query("select i from Instrument i where i.tip = :tip and "
            + "(lower(i.sembol) like lower(concat('%', :q, '%')) "
            + "or lower(i.ad) like lower(concat('%', :q, '%')) "
            + "or lower(i.isin) like lower(concat('%', :q, '%'))) "
            + "order by i.sembol")
    List<Instrument> searchByTip(@Param("tip") String tip, @Param("q") String q);

    @Query("select i from Instrument i where "
            + "lower(i.sembol) like lower(concat('%', :q, '%')) "
            + "or lower(i.ad) like lower(concat('%', :q, '%')) "
            + "or lower(i.isin) like lower(concat('%', :q, '%')) "
            + "or lower(i.tip) like lower(concat('%', :q, '%')) "
            + "order by i.sembol")
    List<Instrument> search(@Param("q") String q);
}
