package com.orion.notification.service;

import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.domain.NotifChannelTemplate;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.dto.KanalAyarlariGuncelleRequest;
import com.orion.notification.repository.NotifChannelTemplateRepository;
import com.orion.notification.repository.NotificationTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * "Bildirim Ayarlari" ekraninin servis katmani: bir bildirim tipinin
 * kanallardan bagimsiz genel durumunu (NotificationType.active) ve, bir
 * kanal secildikten sonra o kanala ozel sablon/ayarlari
 * (NotifChannelTemplate) yonetir. Sablon (templateHeader/templateBody)
 * her zaman salt okunurdur - bu servis uzerinden hic guncellenmez.
 */
@Service
public class BildirimAyarlariService {

    private final NotificationTypeRepository notificationTypeRepository;
    private final NotifChannelTemplateRepository notifChannelTemplateRepository;

    public BildirimAyarlariService(NotificationTypeRepository notificationTypeRepository,
                                    NotifChannelTemplateRepository notifChannelTemplateRepository) {
        this.notificationTypeRepository = notificationTypeRepository;
        this.notifChannelTemplateRepository = notifChannelTemplateRepository;
    }

    public List<NotificationType> tipleriGetir() {
        return notificationTypeRepository.findAllByOrderBySiraAsc();
    }

    @Transactional
    public NotificationType genelDurumGuncelle(Long notificationTypeId, boolean acik) {
        NotificationType tip = notificationTypeRepository.findById(notificationTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Bildirim tipi bulunamadi: " + notificationTypeId));
        tip.setActive(acik);
        // Bu ekranda gercek bir oturum acmis kullanici kavrami yok (uygulama
        // genelinde auth altyapisi henuz yok), bu yuzden sabit bir deger kullanilir.
        tip.setLastUpdatedBy("orion-admin");
        tip.setLastUpdatedTime(LocalDateTime.now());
        return notificationTypeRepository.save(tip);
    }

    public Optional<NotifChannelTemplate> kanalAyarlariGetir(Long notificationTypeId, BildirimKanali kanal) {
        return notifChannelTemplateRepository.findByNotificationTypeIdAndKanal(notificationTypeId, kanal);
    }

    @Transactional
    public NotifChannelTemplate kanalAyarlariniKaydet(Long templateId, KanalAyarlariGuncelleRequest request) {
        NotifChannelTemplate template = notifChannelTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Kanal sablonu bulunamadi: " + templateId));
        template.setMusteriGorurVeDegistir(request.isMusteriGorurVeDegistir());
        template.setMaxRetry(request.getMaxRetry());
        template.setErrorBackoffTime(request.getErrorBackoffTime());
        template.setActive(request.isActive());
        template.setTemplateBody(request.getTemplateBody());
        template.setLastUpdatedBy("orion-admin");
        template.setLastUpdatedTime(LocalDateTime.now());
        return notifChannelTemplateRepository.save(template);
    }
}
