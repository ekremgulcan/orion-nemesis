package com.orion.credit.dto;

import com.orion.credit.domain.CreditOptimizationResult;
import com.orion.credit.domain.CreditOptimizationRun;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CreditOptimizationMapper {

    @Mapping(target = "calistiranKullaniciAdi", source = "calistiranKullanici.kullaniciAdi")
    CreditOptimizationRunDto toDto(CreditOptimizationRun entity);

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "hesapAdi", source = "account.customer.adSoyadUnvan")
    CreditOptimizationResultDto toDto(CreditOptimizationResult entity);

    List<CreditOptimizationResultDto> toResultDtoList(List<CreditOptimizationResult> entities);
}
