package com.orion.notification.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * Bir bildirim tipi + kanal kombinasyonu icin sablon ve kanal bazli
 * ayarlar ("Bildirim Ayarlari" ekraninda bir kanal secildikten sonra
 * gorunen bolum). `allowedParametreler`, bu bildirim tipinde
 * kullanilabilecek SABIT (Emir Iletim servislerinden gelen, ekrandan
 * degistirilemeyen) parametre listesidir - "Sablonda Kullanilabilecek
 * Parametreler" bu alandan gelir, `templateBody`'nin o anki icerigi
 * ONEMLI DEGILDIR (once boyle turetiliyordu - kullanicinin sablona
 * rastgele yeni bir ${YeniParam} yazip listeye "sahte" bir parametre
 * eklemesine izin veriyordu, bkz. V39 migration). `templateBody` kaydedilirken
 * bu listenin disinda bir `${Param}` kullaniyorsa reddedilir (bkz.
 * BildirimAyarlariService#kanalAyarlariniKaydet).
 */
@Entity
@Table(name = "notif_channel_templates")
@Getter
@Setter
public class NotifChannelTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notif_channel_template_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_type_id", nullable = false)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "kanal", nullable = false, length = 16)
    private BildirimKanali kanal;

    @Column(name = "template_header", nullable = false)
    private String templateHeader;

    @Column(name = "template_body", nullable = false, length = 1000)
    private String templateBody;

    /** Virgulle ayrilmis, sabit/referans parametre listesi (orn. "Symbol,Qty,Price"). Bkz. sinif javadoc'u. */
    @Column(name = "allowed_parametreler", nullable = false, length = 500)
    private String allowedParametreler;

    @Column(name = "max_retry", nullable = false)
    private int maxRetry;

    @Column(name = "error_backoff_time", nullable = false)
    private int errorBackoffTime;

    @Column(name = "musteri_gorur_ve_degistir", nullable = false)
    private boolean musteriGorurVeDegistir;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_time")
    private LocalDateTime createdTime;

    @Column(name = "last_updated_by")
    private String lastUpdatedBy;

    @Column(name = "last_updated_time")
    private LocalDateTime lastUpdatedTime;

    /** {@link #allowedParametreler}'i liste olarak dondurur - bos/blank parcalar elenir. */
    public List<String> getAllowedParametrelerList() {
        if (allowedParametreler == null || allowedParametreler.isBlank()) {
            return List.of();
        }
        return Arrays.stream(allowedParametreler.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
