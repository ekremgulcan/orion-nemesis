package com.orion.notification.domain;

import com.orion.core.domain.Customer;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bir musterinin bir bildirim KATEGORISI icin Push/SMS/E-Posta kanal
 * tercihi (V40'tan itibaren - oncesinde NotificationType basinaydi, bkz.
 * NotificationCategory javadoc). Musteri x NotificationCategory basina en
 * fazla bir satir bulunur (bkz. V40 migration'daki unique kisitlama);
 * satir ilk sorgulandiginda yoksa varsayilan (hepsi acik) olarak otomatik
 * olusturulur - bkz. MusteriBildirimTercihleriService.tercihleriGetir.
 */
@Entity
@Table(name = "musteri_bildirim_kategori_tercihleri")
@Getter
@Setter
public class MusteriBildirimTercihi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tercih_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private NotificationCategory category;

    @Column(name = "push_acik", nullable = false)
    private boolean pushAcik = true;

    @Column(name = "sms_acik", nullable = false)
    private boolean smsAcik = true;

    @Column(name = "eposta_acik", nullable = false)
    private boolean epostaAcik = true;

    @Column(name = "son_guncelleme", nullable = false)
    private LocalDateTime sonGuncelleme;
}
