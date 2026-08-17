package com.orion.notification.dto;

import com.orion.notification.domain.NotifChannelTemplate;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public abstract class NotifChannelTemplateMapper {

    @Mapping(target = "notificationTypeId", source = "notificationType.id")
    public abstract NotifChannelTemplateDto toDto(NotifChannelTemplate entity);

    /**
     * "Sablonda Kullanilabilecek Parametreler" listesi entity'nin SABIT
     * allowedParametreler kolonundan gelir - templateBody'nin o anki
     * icerigi bu listeyi ETKILEMEZ (once regex ile templateBody'den
     * turetiliyordu, bu da kullaniciya sablona yeni bir ${Param} yazip
     * listeye "sahte" bir parametre ekleme imkani veriyordu).
     */
    @AfterMapping
    protected void doldurParametreler(NotifChannelTemplate entity, @MappingTarget NotifChannelTemplateDto dto) {
        dto.setParametreler(entity.getAllowedParametrelerList());
    }
}
