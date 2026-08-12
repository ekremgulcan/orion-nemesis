package com.orion.notification.controller;

import com.orion.notification.dto.GenelDurumGuncelleRequest;
import com.orion.notification.dto.NotificationTypeDto;
import com.orion.notification.dto.NotificationTypeMapper;
import com.orion.notification.service.BildirimAyarlariService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * "Bildirim Ayarlari" ekrani (notification/bildirim-ayarlari.zul /
 * BildirimAyarlariViewModel) icin REST API karsiligi - nemesis-frontend
 * tarafindan tuketilir. Ayni BildirimAyarlariService'i ZK ViewModel ile
 * birebir paylasir, is mantigina dokunulmaz. Bugun icin sadece bildirim
 * tipi listesi + kanallardan bagimsiz genel durum guncellemesini kapsar -
 * kanal bazli sablon/ayar endpoint'leri o bolum uygulandiginda eklenecek.
 */
@RestController
@RequestMapping("/api/v1/notification/types")
public class BildirimAyarlariController {

    private final BildirimAyarlariService service;
    private final NotificationTypeMapper mapper;

    public BildirimAyarlariController(BildirimAyarlariService service, NotificationTypeMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public List<NotificationTypeDto> tipleriGetir() {
        return mapper.toDtoList(service.tipleriGetir());
    }

    @PostMapping("/{id}/genel-durum")
    public NotificationTypeDto genelDurumGuncelle(@PathVariable Long id,
                                                   @RequestBody GenelDurumGuncelleRequest request) {
        return mapper.toDto(service.genelDurumGuncelle(id, request.isActive()));
    }
}
