package com.orion.meta.dto;

import com.orion.meta.domain.PositionShockScenario;
import com.orion.meta.domain.PositionSnapshot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MetaPositionMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    @Mapping(target = "instrumentSymbol", source = "instrument.sembol")
    PositionSnapshotDto toDto(PositionSnapshot entity);

    List<PositionSnapshotDto> toSnapshotDtoList(List<PositionSnapshot> entities);

    PositionShockScenarioDto toDto(PositionShockScenario entity);

    List<PositionShockScenarioDto> toScenarioDtoList(List<PositionShockScenario> entities);
}
