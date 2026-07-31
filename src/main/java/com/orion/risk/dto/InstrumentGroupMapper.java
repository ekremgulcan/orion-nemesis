package com.orion.risk.dto;

import com.orion.core.domain.Instrument;
import com.orion.risk.domain.InstrumentGroup;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InstrumentGroupMapper {

    InstrumentGroupDto toDto(InstrumentGroup entity);

    List<InstrumentGroupDto> toDtoList(List<InstrumentGroup> entities);

    InstrumentGroupDto.InstrumentRefDto toRefDto(Instrument entity);
}
