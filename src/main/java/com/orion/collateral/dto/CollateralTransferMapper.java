package com.orion.collateral.dto;

import com.orion.collateral.domain.CollateralTransfer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CollateralTransferMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    @Mapping(target = "instrumentSymbol", source = "instrument.sembol")
    @Mapping(target = "talepEdenKullaniciAdi", source = "talepEdenKullanici.adSoyad")
    @Mapping(target = "onaylayanKullaniciAdi", source = "onaylayanKullanici.adSoyad")
    CollateralTransferDto toDto(CollateralTransfer entity);

    List<CollateralTransferDto> toDtoList(List<CollateralTransfer> entities);
}
