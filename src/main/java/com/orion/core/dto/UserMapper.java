package com.orion.core.dto;

import com.orion.core.domain.User;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring", uses = RoleMapper.class)
public interface UserMapper {

    UserDto toDto(User entity);

    List<UserDto> toDtoList(List<User> entities);
}
