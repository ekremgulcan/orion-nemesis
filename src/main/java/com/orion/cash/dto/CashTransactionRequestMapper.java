package com.orion.cash.dto;

import com.orion.cash.domain.CashTransactionRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CashTransactionRequestMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    CashTransactionRequestDto toDto(CashTransactionRequest entity);

    List<CashTransactionRequestDto> toDtoList(List<CashTransactionRequest> entities);
}
