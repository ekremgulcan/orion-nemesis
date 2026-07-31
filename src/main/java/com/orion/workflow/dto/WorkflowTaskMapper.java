package com.orion.workflow.dto;

import com.orion.workflow.domain.WorkflowTask;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WorkflowTaskMapper {

    @Mapping(target = "surecNo", source = "process.surecNo")
    @Mapping(target = "surecTipi", source = "process.surecTipi")
    @Mapping(target = "sahipAdSoyad", source = "sahip.adSoyad")
    WorkflowTaskDto toDto(WorkflowTask entity);

    List<WorkflowTaskDto> toDtoList(List<WorkflowTask> entities);
}
