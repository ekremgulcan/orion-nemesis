package com.orion.notification.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bir bildirim tipi + kanal kombinasyonu icin sablon ve kanal bazli
 * ayarlar ("Bildirim Ayarlari" ekraninda bir kanal secildikten sonra
 * gorunen bolum). `templateBody` icindeki `${Param}` seklindeki
 * tokenlar, ekranda "Sablonda Kullanilabilecek Parametreler" olarak
 * listelenir (bkz. NotifChannelTemplateMapper).
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
}
