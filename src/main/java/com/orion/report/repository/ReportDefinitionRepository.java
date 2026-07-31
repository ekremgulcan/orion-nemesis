package com.orion.report.repository;

import com.orion.report.domain.ReportDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReportDefinitionRepository extends JpaRepository<ReportDefinition, Long> {

    @Query("select r from ReportDefinition r left join fetch r.olusturanKullanici "
            + "left join fetch r.degistirenKullanici order by r.raporAdi")
    List<ReportDefinition> findAllFetched();

    @Query("select r from ReportDefinition r left join fetch r.olusturanKullanici "
            + "left join fetch r.degistirenKullanici "
            + "where lower(r.raporAdi) like lower(concat('%', :q, '%')) "
            + "or lower(r.raporSinifi) like lower(concat('%', :q, '%')) "
            + "order by r.raporAdi")
    List<ReportDefinition> search(String q);
}
