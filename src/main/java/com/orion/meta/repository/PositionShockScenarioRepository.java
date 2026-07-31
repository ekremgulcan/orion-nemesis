package com.orion.meta.repository;

import com.orion.meta.domain.PositionShockScenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PositionShockScenarioRepository extends JpaRepository<PositionShockScenario, Long> {

    @Query("select s from PositionShockScenario s where "
            + "lower(s.senaryoAdi) like lower(concat('%', :q, '%')) "
            + "or lower(s.currencyPair) like lower(concat('%', :q, '%')) "
            + "order by s.senaryoAdi")
    List<PositionShockScenario> search(@Param("q") String q);
}
