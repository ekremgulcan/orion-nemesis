package com.orion.workflow.repository;

import com.orion.workflow.domain.WorkflowTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorkflowTaskRepository extends JpaRepository<WorkflowTask, Long> {

    @Query("select t from WorkflowTask t join fetch t.process join fetch t.sahip "
            + "where t.sahip.id = :sahipId and t.durum = :durum")
    List<WorkflowTask> findBySahipIdAndDurum(@Param("sahipId") Long sahipId, @Param("durum") String durum);

    @Query("select t from WorkflowTask t join fetch t.process join fetch t.sahip")
    List<WorkflowTask> findAllFetched();
}
