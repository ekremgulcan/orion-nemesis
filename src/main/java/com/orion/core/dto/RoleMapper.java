package com.orion.core.dto;

import com.orion.core.domain.Role;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.Set;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    RoleDto toDto(Role entity);

    List<RoleDto> toDtoList(List<Role> entities);

    List<RoleDto> toDtoList(Set<Role> entities);
}
