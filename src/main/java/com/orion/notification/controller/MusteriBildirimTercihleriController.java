package com.orion.notification.controller;

import com.orion.notification.dto.NotifPreferencesGetAllResponse;
import com.orion.notification.dto.NotifPreferencesUpdateRequest;
import com.orion.notification.dto.NotifPreferencesUpdateResponse;
import com.orion.notification.service.MusteriBildirimTercihleriService;
import org.springframework.web.bind.annotation.*;

/**
 * "Musteri Bildirim Tercihleri" ekrani (notification/musteri-bildirim-tercihleri.zul
 * / MusteriBildirimTercihleriViewModel) icin REST API karsiligi -
 * nemesis-frontend tarafindan tuketilir. Ayni MusteriBildirimTercihleriService'i
 * ZK ViewModel ile birebir paylasir, is mantigina dokunulmaz.
 *
 * Uc nokta yolu/govde sekli, servis dokumaninin (musteri_bildirim_tercihleri_servis_dokumani.docx)
 * GET /notifPreferences/getAll ve POST /notifPreferences/update
 * sozlesmesiyle BIREBIR ayni (username/categoryCode/notifChannelCode/
 * isEnabled/isEditable, per-eleman updatedFields[].status) - sadece
 * bu modulun paylasilan `/api/v1/notification` on-ekinin altina
 * yerlestirildi (kardes controller'lar - NotificationEventController,
 * BildirimAyarlariController - da ayni on-eki kullaniyor; dokumanin
 * ciplak `/notifPreferences/...` yolunu birebir kullanmak bu modulun
 * kendi ic tutarliligini bozardi).
 */
@RestController
@RequestMapping("/api/v1/notification/notifPreferences")
public class MusteriBildirimTercihleriController {

    private final MusteriBildirimTercihleriService service;

    public MusteriBildirimTercihleriController(MusteriBildirimTercihleriService service) {
        this.service = service;
    }

    @GetMapping("/getAll")
    public NotifPreferencesGetAllResponse getAll(@RequestParam String username) {
        return service.getAllForUsername(username);
    }

    @PostMapping("/update")
    public NotifPreferencesUpdateResponse update(@RequestBody NotifPreferencesUpdateRequest request) {
        return service.updateForUsername(request.getUsername(), request.getUpdates());
    }
}
