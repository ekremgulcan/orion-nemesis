package com.orion.workflow.repository;

import com.orion.workflow.domain.WorkflowProcess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowProcessRepository extends JpaRepository<WorkflowProcess, Long> {

    List<WorkflowProcess> findBySurecTipiAndDurum(String surecTipi, String durum);
}

