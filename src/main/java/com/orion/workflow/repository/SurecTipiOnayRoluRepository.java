package com.orion.workflow.repository;

import com.orion.workflow.domain.SurecTipiOnayRolu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurecTipiOnayRoluRepository extends JpaRepository<SurecTipiOnayRolu, Long> {

    List<SurecTipiOnayRolu> findBySurecTipiAndAktifTrue(String surecTipi);
}
