package com.orion.notification.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bildirim tipi katalogu. "Musteri Bildirim Tercihleri" ekraninda her satir
 * bir NotificationType'a karsilik gelir. `zorunlu = true` olan tip (VIOP
 * Margin Call) kullanici tarafindan kapatilamaz. `active` alani "Bildirim
 * Ayarlari" ekranindaki kanallardan bagimsiz genel durumu tutar - bu tek
 * alan haric, satirlar referans veridir ve uygulama tarafindan degistirilmez.
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

    @Column(name = "zorunlu", nullable = false)
    private boolean zorunlu;

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
