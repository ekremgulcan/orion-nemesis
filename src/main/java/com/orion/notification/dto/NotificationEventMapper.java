package com.orion.notification.dto;

import com.orion.notification.domain.NotificationEvent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationEventMapper {

    @Mapping(target = "eventId", source = "id")
    @Mapping(target = "investorNo", source = "account.hesapNo")
    @Mapping(target = "target", source = "user.kullaniciAdi")
    NotificationEventDto toDto(NotificationEvent entity);

    List<NotificationEventDto> toDtoList(List<NotificationEvent> entities);
}
