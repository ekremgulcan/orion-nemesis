package com.orion.notification.domain;

import com.orion.core.domain.Customer;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bir musterinin bir bildirim tipi icin Push/SMS/E-Posta kanal tercihi.
 * Musteri x NotificationType basina en fazla bir satir bulunur (bkz.
 * V34 migration'daki unique kisitlama); satir ilk sorgulandiginda yoksa
 * varsayilan (hepsi acik) olarak otomatik olusturulur - bkz.
 * MusteriBildirimTercihleriService.tercihleriGetir.
 */
@Entity
@Table(name = "musteri_bildirim_tercihleri")
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
    @JoinColumn(name = "notification_type_id", nullable = false)
    private NotificationType notificationType;

    @Column(name = "push_acik", nullable = false)
    private boolean pushAcik = true;

    @Column(name = "sms_acik", nullable = false)
    private boolean smsAcik = true;

    @Column(name = "eposta_acik", nullable = false)
    private boolean epostaAcik = true;

    @Column(name = "son_guncelleme", nullable = false)
    private LocalDateTime sonGuncelleme;
}
