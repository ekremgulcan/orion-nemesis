package com.orion.report.dto;

import com.orion.report.domain.ReportDefinition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReportDefinitionMapper {

    @Mapping(target = "olusturanKullaniciAdi", source = "olusturanKullanici.adSoyad")
    @Mapping(target = "degistirenKullaniciAdi", source = "degistirenKullanici.adSoyad")
    ReportDefinitionDto toDto(ReportDefinition entity);

    List<ReportDefinitionDto> toDtoList(List<ReportDefinition> entities);
}
