package com.orion.notification.domain;

import com.orion.core.domain.Customer;
import com.orion.core.domain.User;
import com.orion.workflow.domain.WorkflowProcess;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Onay bekleyen musteri bildirim tercihi degisiklik talebi. Musteri basina
 * bir talep satiri olusturulur (customer_id FK). Onaylanirsa yeni tercihler
 * musteri_bildirim_kategori_tercihleri tablosuna yazilir; reddedilirse
 * degisiklik uygulanmaz.
 *
 * Uc JSON kolonu:
 * - oncekiDegerJson: mevcut tercihlerin tam snapshot'i
 * - yeniDegerJson: uygulanacak degisikliklerin listesi (NotifPreferencesUpdateItem[])
 * - degisiklikListesiJson: UI diff popup icin kompakt fark listesi
 *
 * process iliskisi LAZY - repo sorgularinda join fetch kullanilmali.
 */
@Entity
@Table(name = "musteri_bildirim_tercihleri_talepleri")
@Getter
@Setter
public class MusteriBildirimTercihTalebi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "talep_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    private WorkflowProcess process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "talep_eden_user_id", nullable = false)
    private User talepEden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "durum", nullable = false)
    private String durum = "BEKLEMEDE"; // BEKLEMEDE / ONAYLANDI / REDDEDILDI

    @Column(name = "onceki_deger_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String oncekiDegerJson;

    @Column(name = "yeni_deger_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String yeniDegerJson;

    @Column(name = "degisiklik_listesi_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String degisiklikListesiJson;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    private LocalDateTime olusturmaTarihi;

    @Column(name = "karar_tarihi")
    private LocalDateTime kararTarihi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "karar_veren_user_id")
    private User kararVeren;
}
