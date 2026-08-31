package com.orion.workflow.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Hangi onay surec tipinin hangi rol tarafindan onaylanacagini belirleyen
 * generic eslestirme tablosu. Her yeni onay ekrani buraya bir satir ekler
 * (V47 seed: HISSE_RISK_PARAMETRELERI_ONAY -> OPERASYON). Ileride eklenecek
 * ekranlar (Bildirim Ayarlari, Musteri Bildirim Tercihleri vb.) icin de
 * ayni tablo kullanilir.
 */
@Entity
@Table(name = "surec_tipi_onay_rolleri")
@Getter
@Setter
public class SurecTipiOnayRolu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "surec_tipi", nullable = false)
    private String surecTipi;

    @Column(name = "rol_adi", nullable = false)
    private String rolAdi;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    private LocalDateTime olusturmaTarihi;
}
