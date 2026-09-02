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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * "Bildirim Ayarlari" ekraninin servis katmani: bir bildirim tipinin
 * kanallardan bagimsiz genel durumunu (NotificationType.active) ve, bir
 * kanal secildikten sonra o kanala ozel sablon/ayarlari
 * (NotifChannelTemplate) yonetir. Sablon (templateHeader/templateBody)
 * her zaman salt okunurdur - bu servis uzerinden hic guncellenmez.
 */
@Service
public class BildirimAyarlariService {

    /**
     * Bu ekranin hem ZK (BildirimAyarlariViewModel) hem REST/React
     * (BildirimAyarlariController) girisleri PAYLASIR - sinir kontrolu
     * burada, tek yerde uygulanir ki dogrudan API cagrisi (orn.
     * Postman) ZK ViewModel'in kendi anlik clamp'ini atlayip gecersiz
     * bir deger kaydedemesin. ZK ViewModel ayrica kendi alaninda ayni
     * sinirlari uygular (kullanici yazarken anlik geri bildirim icin),
     * ama asil yetkili (authoritative) kontrol burasidir.
     */
    private static final int MAX_RETRY_UST_SINIR = 20;
    private static final int ERROR_BACKOFF_UST_SINIR = 86400;
    private static final Pattern PARAM_PATTERN = Pattern.compile("\\$\\{(\\w+)}");

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
        dogrulaSablonParametreleri(template, request.getTemplateBody());
        template.setMusteriGorurVeDegistir(request.isMusteriGorurVeDegistir());
        template.setMaxRetry(sinirla(request.getMaxRetry(), 0, MAX_RETRY_UST_SINIR));
        template.setErrorBackoffTime(sinirla(request.getErrorBackoffTime(), 0, ERROR_BACKOFF_UST_SINIR));
        template.setActive(request.isActive());
        template.setTemplateBody(request.getTemplateBody());
        template.setLastUpdatedBy("orion-admin");
        template.setLastUpdatedTime(LocalDateTime.now());
        return notifChannelTemplateRepository.save(template);
    }

    /**
     * Bu bildirim tipinde kullanilabilecek parametreler SABITTIR
     * (bkz. {@link NotifChannelTemplate} javadoc, V39 migration) -
     * kullanicinin sablona rastgele yeni bir {@code ${YeniParam}} yazip
     * "Sablonda Kullanilabilecek Parametreler" listesine sahte bir
     * parametre eklemesi mumkun OLMAMALIDIR. Submit edilen
     * templateBody'deki her {@code ${Param}} tokeni, template'in
     * (degistirilemeyen) allowedParametreler listesinde yoksa kaydetme
     * islemi tumden reddedilir.
     */
    public static void dogrulaSablonParametreleri(NotifChannelTemplate template, String templateBody) {
        Set<String> izinliParametreler = Set.copyOf(template.getAllowedParametrelerList());
        Set<String> tanimsizParametreler = new LinkedHashSet<>();
        Matcher matcher = PARAM_PATTERN.matcher(templateBody == null ? "" : templateBody);
        while (matcher.find()) {
            String parametre = matcher.group(1);
            if (!izinliParametreler.contains(parametre)) {
                tanimsizParametreler.add(parametre);
            }
        }
        if (!tanimsizParametreler.isEmpty()) {
            String tanimsizListesi = tanimsizParametreler.stream().map(p -> "${" + p + "}").reduce((a, b) -> a + ", " + b).orElse("");
            throw new IllegalArgumentException(
                    "Sablonda tanimli olmayan parametre kullanildi: " + tanimsizListesi +
                            ". Bu bildirim tipinde kullanilabilecek parametreler: " +
                            String.join(", ", izinliParametreler) + ".");
        }
    }

    private static int sinirla(int deger, int minimum, int maksimum) {
        return Math.max(minimum, Math.min(maksimum, deger));
    }
}
