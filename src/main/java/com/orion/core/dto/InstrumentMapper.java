package com.orion.core.dto;

import com.orion.core.domain.Instrument;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InstrumentMapper {

    InstrumentDto toDto(Instrument entity);

    List<InstrumentDto> toDtoList(List<Instrument> entities);
}
