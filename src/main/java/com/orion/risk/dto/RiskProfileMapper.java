package com.orion.risk.dto;

import com.orion.risk.domain.RiskProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RiskProfileMapper {

    @Mapping(target = "userName", source = "user.adSoyad")
    @Mapping(target = "hesapNo", source = "account.hesapNo")
    RiskProfileDto toDto(RiskProfile entity);

    List<RiskProfileDto> toDtoList(List<RiskProfile> entities);
}
