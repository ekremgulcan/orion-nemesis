package com.orion.core.dto;

import com.orion.core.domain.ChannelAuthorization;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChannelAuthorizationMapper {

    @Mapping(target = "kullaniciAdi", source = "user.kullaniciAdi")
    @Mapping(target = "adSoyad", source = "user.adSoyad")
    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    ChannelAuthorizationDto toDto(ChannelAuthorization entity);

    List<ChannelAuthorizationDto> toDtoList(List<ChannelAuthorization> entities);
}
