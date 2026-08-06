package com.orion.notification.dto;

import com.orion.notification.domain.MusteriBildirimTercihi;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BildirimTercihiMapper {

    @Mapping(target = "notificationTypeId", source = "notificationType.id")
    @Mapping(target = "kod", source = "notificationType.kod")
    @Mapping(target = "ad", source = "notificationType.ad")
    @Mapping(target = "aciklama", source = "notificationType.aciklama")
    @Mapping(target = "zorunlu", source = "notificationType.zorunlu")
    @Mapping(target = "sira", source = "notificationType.sira")
    BildirimTercihiDto toDto(MusteriBildirimTercihi entity);

    List<BildirimTercihiDto> toDtoList(List<MusteriBildirimTercihi> entities);
}
