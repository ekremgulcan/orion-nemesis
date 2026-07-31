package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "Yonetim Paneli" (kullanicilar.zul) REST API'sinin JSON govdesi.
 * {@link com.orion.core.domain.User}'in roller iliskisini duz bir
 * RoleDto listesine indirger - hicbir lazy entity referansi disariya
 * sizmaz.
 */
@Getter
@Setter
public class UserDto {
    private Long id;
    private String kullaniciAdi;
    private String adSoyad;
    private String email;
    private boolean aktif;
    private List<RoleDto> roller;
    private LocalDateTime olusturmaTarihi;
}
