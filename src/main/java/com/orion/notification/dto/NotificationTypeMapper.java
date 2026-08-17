package com.orion.notification.dto;

import com.orion.notification.domain.NotificationType;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationTypeMapper {

    NotificationTypeDto toDto(NotificationType entity);

    List<NotificationTypeDto> toDtoList(List<NotificationType> entities);
}
