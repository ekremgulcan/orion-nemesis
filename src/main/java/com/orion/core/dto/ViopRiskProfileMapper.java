package com.orion.core.dto;

import com.orion.core.domain.ViopRiskProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ViopRiskProfileMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    ViopRiskProfileDto toDto(ViopRiskProfile entity);

    List<ViopRiskProfileDto> toDtoList(List<ViopRiskProfile> entities);
}
