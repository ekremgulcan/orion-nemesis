package com.orion.notification.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bildirim tipi katalogu. "Bildirim Ayarlari" ekraninda her satir bir
 * NotificationType'a karsilik gelir (kanal sablonu bu tip x kanal bazinda
 * yonetilir, bkz. NotifChannelTemplate). "Musteri Bildirim Tercihleri"
 * ekraninda ise artik NotificationType degil, {@link #category} (bkz.
 * NotificationCategory) satir birimidir - bir kategorinin altindaki butun
 * NotificationType'lar TEK bir Push/SMS/E-Posta tercihini paylasir; bu tip
 * satirlari o ekranda sadece kategorinin icerigini (rozet listesi) gosterir
 * (V40 oncesi burada bir `zorunlu` alani vardi, artik kategoriye tasindi -
 * bkz. NotificationCategory javadoc). `active` alani "Bildirim Ayarlari"
 * ekranindaki kanallardan bagimsiz genel durumu tutar - bu tek alan haric,
 * satirlar referans veridir ve uygulama tarafindan degistirilmez.
 */
@Entity
@Table(name = "notification_types")
@Getter
@Setter
public class NotificationType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_type_id")
    private Long id;

    @Column(name = "kod", nullable = false, unique = true)
    private String kod;

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "aciklama")
    private String aciklama;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private NotificationCategory category;

    @Column(name = "sira", nullable = false)
    private int sira;

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
