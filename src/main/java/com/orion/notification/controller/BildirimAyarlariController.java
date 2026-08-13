package com.orion.notification.controller;

import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.dto.GenelDurumGuncelleRequest;
import com.orion.notification.dto.KanalAyarlariGuncelleRequest;
import com.orion.notification.dto.NotifChannelTemplateDto;
import com.orion.notification.dto.NotifChannelTemplateMapper;
import com.orion.notification.dto.NotificationTypeDto;
import com.orion.notification.dto.NotificationTypeMapper;
import com.orion.notification.service.BildirimAyarlariService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * "Bildirim Ayarlari" ekrani (notification/bildirim-ayarlari.zul /
 * BildirimAyarlariViewModel) icin REST API karsiligi - nemesis-frontend
 * tarafindan tuketilir. Ayni BildirimAyarlariService'i ZK ViewModel ile
 * birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/notification")
public class BildirimAyarlariController {

    private final BildirimAyarlariService service;
    private final NotificationTypeMapper mapper;
    private final NotifChannelTemplateMapper channelTemplateMapper;

    public BildirimAyarlariController(BildirimAyarlariService service,
                                       NotificationTypeMapper mapper,
                                       NotifChannelTemplateMapper channelTemplateMapper) {
        this.service = service;
        this.mapper = mapper;
        this.channelTemplateMapper = channelTemplateMapper;
    }

    @GetMapping("/types")
    public List<NotificationTypeDto> tipleriGetir() {
        return mapper.toDtoList(service.tipleriGetir());
    }

    @PostMapping("/types/{id}/genel-durum")
    public NotificationTypeDto genelDurumGuncelle(@PathVariable Long id,
                                                   @RequestBody GenelDurumGuncelleRequest request) {
        return mapper.toDto(service.genelDurumGuncelle(id, request.isActive()));
    }

    @GetMapping("/channel-templates")
    public ResponseEntity<NotifChannelTemplateDto> kanalAyarlariGetir(@RequestParam Long typeId,
                                                                       @RequestParam BildirimKanali kanal) {
        return service.kanalAyarlariGetir(typeId, kanal)
                .map(channelTemplateMapper::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/channel-templates/{id}")
    public NotifChannelTemplateDto kanalAyarlariniKaydet(@PathVariable Long id,
                                                          @RequestBody KanalAyarlariGuncelleRequest request) {
        return channelTemplateMapper.toDto(service.kanalAyarlariniKaydet(id, request));
    }
}
