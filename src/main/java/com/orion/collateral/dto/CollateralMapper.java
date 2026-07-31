package com.orion.collateral.dto;

import com.orion.collateral.domain.Collateral;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CollateralMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    @Mapping(target = "instrumentSymbol", source = "instrument.sembol")
    CollateralDto toDto(Collateral entity);

    List<CollateralDto> toDtoList(List<Collateral> entities);
}
