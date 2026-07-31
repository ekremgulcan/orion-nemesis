package com.orion.crm.controller;

import com.orion.crm.dto.BulkMessageRequestDto;
import com.orion.crm.dto.BulkMessageResultDto;
import com.orion.crm.repository.CampaignRepository;
import com.orion.crm.service.BulkMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Toplu Mesaj Gonder" (toplu-mesaj-gonder.zul / TopluMesajViewModel) icin
 * REST API karsiligi - nemesis-frontend tarafindan tuketilir. Ayni
 * BulkMessageService'i ZK ViewModel ile birebir paylasir, is mantigina
 * dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/crm/bulk-messages")
public class BulkMessageController {

    private final BulkMessageService bulkMessageService;
    private final CampaignRepository campaignRepository;

    public BulkMessageController(BulkMessageService bulkMessageService, CampaignRepository campaignRepository) {
        this.bulkMessageService = bulkMessageService;
        this.campaignRepository = campaignRepository;
    }

    @PostMapping
    public ResponseEntity<BulkMessageResultDto> send(@RequestBody BulkMessageRequestDto body) {
        var kampanya = body.getCampaignId() == null
                ? null
                : campaignRepository.findById(body.getCampaignId()).orElse(null);

        var gonderilenler = bulkMessageService.gonder(
                kampanya,
                body.getAliciGrubu(),
                body.getBelirliHesaplar(),
                body.getYontem(),
                body.getMesajIcerigiTipi(),
                body.getYeniMesajIcerigi());

        String mesaj = gonderilenler.size() + " hesaba " + body.getYontem() + " gonderildi.";
        return ResponseEntity.ok(new BulkMessageResultDto(gonderilenler.size(), mesaj));
    }
}
