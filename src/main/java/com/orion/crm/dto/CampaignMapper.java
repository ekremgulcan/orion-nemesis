package com.orion.crm.dto;

import com.orion.crm.domain.Campaign;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CampaignMapper {

    CampaignDto toDto(Campaign entity);

    List<CampaignDto> toDtoList(List<Campaign> entities);
}
