package com.orion.notification.controller;

import com.orion.core.domain.Customer;
import com.orion.notification.domain.MusteriBildirimTercihi;
import com.orion.notification.dto.BildirimTercihiGuncelleRequest;
import com.orion.notification.dto.BildirimTercihiMapper;
import com.orion.notification.dto.MusteriBildirimTercihleriDto;
import com.orion.notification.service.MusteriBildirimTercihleriService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "Musteri Bildirim Tercihleri" ekrani (notification/musteri-bildirim-tercihleri.zul
 * / MusteriBildirimTercihleriViewModel) icin REST API karsiligi -
 * nemesis-frontend tarafindan tuketilir. Ayni MusteriBildirimTercihleriService'i
 * ZK ViewModel ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/notification/preferences")
public class MusteriBildirimTercihleriController {

    private final MusteriBildirimTercihleriService service;
    private final BildirimTercihiMapper mapper;

    public MusteriBildirimTercihleriController(MusteriBildirimTercihleriService service,
                                                BildirimTercihiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/customer/{musteriNo}")
    public MusteriBildirimTercihleriDto getir(@PathVariable String musteriNo) {
        Customer customer = service.musteriBul(musteriNo);
        List<MusteriBildirimTercihi> tercihler = service.tercihleriGetir(customer.getId());
        return toDto(customer, tercihler);
    }

    @PostMapping("/customer/{musteriNo}")
    public MusteriBildirimTercihleriDto guncelle(@PathVariable String musteriNo,
                                                  @RequestBody List<BildirimTercihiGuncelleRequest> guncellemeler) {
        Customer customer = service.musteriBul(musteriNo);
        List<MusteriBildirimTercihi> tercihler = service.tercihleriKaydet(customer.getId(), guncellemeler);
        return toDto(customer, tercihler);
    }

    private MusteriBildirimTercihleriDto toDto(Customer customer, List<MusteriBildirimTercihi> tercihler) {
        MusteriBildirimTercihleriDto dto = new MusteriBildirimTercihleriDto();
        dto.setMusteriNo(customer.getMusteriNo());
        dto.setMusteriAdi(customer.getAdSoyadUnvan());
        dto.setTcknVkn(customer.getTcknVkn());
        dto.setDurum(customer.isAktif() ? "Aktif" : "Pasif");
        dto.setSonGuncelleme(tercihler.stream()
                .map(MusteriBildirimTercihi::getSonGuncelleme)
                .max(LocalDateTime::compareTo)
                .orElse(null));
        dto.setTercihler(mapper.toDtoList(tercihler));
        return dto;
    }
}
