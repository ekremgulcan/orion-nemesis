package com.orion.risk.dto;

import com.orion.risk.domain.AccountInstrumentControl;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AccountInstrumentControlMapper {

    @Mapping(target = "userName", source = "user.adSoyad")
    @Mapping(target = "kullaniciAdi", source = "user.kullaniciAdi")
    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    @Mapping(target = "instrumentSymbol", source = "instrument.sembol")
    AccountInstrumentControlDto toDto(AccountInstrumentControl entity);

    List<AccountInstrumentControlDto> toDtoList(List<AccountInstrumentControl> entities);
}
