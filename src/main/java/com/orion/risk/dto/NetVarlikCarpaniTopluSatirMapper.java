package com.orion.risk.dto;

import com.orion.risk.vm.NetVarlikCarpaniTopluSatir;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NetVarlikCarpaniTopluSatirMapper {

    NetVarlikCarpaniTopluSatirDto toDto(NetVarlikCarpaniTopluSatir model);

    List<NetVarlikCarpaniTopluSatirDto> toDtoList(List<NetVarlikCarpaniTopluSatir> models);

    NetVarlikCarpaniTopluSatir toModel(NetVarlikCarpaniTopluSatirDto dto);

    List<NetVarlikCarpaniTopluSatir> toModelList(List<NetVarlikCarpaniTopluSatirDto> dtos);
}
