package com.orion.notification.dto;

import com.orion.notification.domain.NotifChannelTemplate;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Mapper(componentModel = "spring")
public abstract class NotifChannelTemplateMapper {

    private static final Pattern PARAM_PATTERN = Pattern.compile("\\$\\{(\\w+)}");

    @Mapping(target = "notificationTypeId", source = "notificationType.id")
    public abstract NotifChannelTemplateDto toDto(NotifChannelTemplate entity);

    /**
     * "Sablonda Kullanilabilecek Parametreler" listesi templateBody
     * icindeki ${Param} tokenlarindan turetilir - ilk gorunme sirasina
     * gore, tekrarsiz.
     */
    @AfterMapping
    protected void doldurParametreler(NotifChannelTemplate entity, @MappingTarget NotifChannelTemplateDto dto) {
        Set<String> parametreler = new LinkedHashSet<>();
        Matcher matcher = PARAM_PATTERN.matcher(entity.getTemplateBody());
        while (matcher.find()) {
            parametreler.add(matcher.group(1));
        }
        dto.setParametreler(List.copyOf(parametreler));
    }
}
