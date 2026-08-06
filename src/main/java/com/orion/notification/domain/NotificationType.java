package com.orion.notification.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Bildirim tipi katalogu (referans veri, uygulama tarafindan degistirilmez).
 * "Musteri Bildirim Tercihleri" ekraninda her satir bir NotificationType'a
 * karsilik gelir. `zorunlu = true` olan tip (VIOP Margin Call) kullanici
 * tarafindan kapatilamaz.
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
}
