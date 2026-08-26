package com.orion.risk.dto;

import com.orion.risk.domain.HisseRiskParametresi;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface HisseRiskParametresiMapper {

    @Mapping(target = "hesapTipi", source = "account.hesapMusteriTipi")
    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "musteriNo", source = "account.customer.musteriNo")
    @Mapping(target = "musteriAdi", source = "account.customer.adSoyadUnvan")
    HisseRiskParametresiDto toDto(HisseRiskParametresi entity);

    List<HisseRiskParametresiDto> toDtoList(List<HisseRiskParametresi> entities);
}
