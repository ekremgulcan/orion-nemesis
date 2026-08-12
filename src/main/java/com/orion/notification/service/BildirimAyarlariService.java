package com.orion.notification.service;

import com.orion.notification.domain.NotificationType;
import com.orion.notification.repository.NotificationTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "Bildirim Ayarlari" ekraninin servis katmani. Bugun icin sadece bir
 * bildirim tipinin kanallardan bagimsiz genel durumunu (NotificationType.active)
 * yonetir. Kanal secildikten sonraki asama (sablon, Max Deneme Sayisi,
 * Tekrar Deneme Suresi, kanal bazli durum) henuz burada degil - o alanlar
 * icin ayri bir entity (orn. NotifChannelTemplate) ve buraya
 * kanalAyarlariGetir/kanalAyarlariniKaydet metotlari eklenecek.
 */
@Service
public class BildirimAyarlariService {

    private final NotificationTypeRepository notificationTypeRepository;

    public BildirimAyarlariService(NotificationTypeRepository notificationTypeRepository) {
        this.notificationTypeRepository = notificationTypeRepository;
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
}
