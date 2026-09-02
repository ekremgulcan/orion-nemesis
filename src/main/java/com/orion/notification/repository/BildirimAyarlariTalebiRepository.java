package com.orion.notification.repository;

import com.orion.notification.domain.BildirimAyarlariTalebi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BildirimAyarlariTalebiRepository extends JpaRepository<BildirimAyarlariTalebi, Long> {
    Optional<BildirimAyarlariTalebi> findByProcessId(Long processId);
}
