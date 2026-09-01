package com.orion.notification.repository;

import com.orion.notification.domain.MusteriBildirimTercihTalebi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MusteriBildirimTercihTalebiRepository extends JpaRepository<MusteriBildirimTercihTalebi, Long> {

    List<MusteriBildirimTercihTalebi> findByProcessId(Long processId);

    @Query("SELECT t FROM MusteriBildirimTercihTalebi t " +
            "JOIN FETCH t.process " +
            "JOIN FETCH t.talepEden " +
            "JOIN FETCH t.customer " +
            "WHERE t.process.id = :processId")
    List<MusteriBildirimTercihTalebi> findByProcessIdFetched(Long processId);
}
