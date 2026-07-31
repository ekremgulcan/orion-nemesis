package com.orion.core.dto;

import com.orion.core.domain.Customer;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    CustomerDto toDto(Customer entity);

    List<CustomerDto> toDtoList(List<Customer> entities);
}
