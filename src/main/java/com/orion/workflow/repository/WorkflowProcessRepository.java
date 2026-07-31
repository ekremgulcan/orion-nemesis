package com.orion.workflow.repository;

import com.orion.workflow.domain.WorkflowProcess;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowProcessRepository extends JpaRepository<WorkflowProcess, Long> {
}
