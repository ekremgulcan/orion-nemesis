package com.orion.risk.dto;

import com.orion.risk.domain.UserLimit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserLimitMapper {

    @Mapping(target = "userName", source = "user.adSoyad")
    UserLimitDto toDto(UserLimit entity);

    List<UserLimitDto> toDtoList(List<UserLimit> entities);
}
