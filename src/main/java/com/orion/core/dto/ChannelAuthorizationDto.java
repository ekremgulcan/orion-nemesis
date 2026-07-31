package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ChannelAuthorizationDto {
    private Long id;
    private String kullaniciAdi;
    private String adSoyad;
    private String hesapNo;
    private String customerName;
    private String kanal;
    private String yetkiDurumu;
    private LocalDateTime tanimlamaTarihi;
}
