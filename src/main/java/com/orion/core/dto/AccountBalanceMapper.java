package com.orion.core.dto;

import com.orion.core.domain.AccountBalance;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AccountBalanceMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    AccountBalanceDto toDto(AccountBalance entity);

    List<AccountBalanceDto> toDtoList(List<AccountBalance> entities);
}
