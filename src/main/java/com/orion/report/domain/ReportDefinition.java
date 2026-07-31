package com.orion.report.domain;

import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "report_definitions")
@Getter
@Setter
public class ReportDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @Column(name = "rapor_adi", nullable = false)
    private String raporAdi;

    @Column(name = "rapor_sinifi", nullable = false)
    private String raporSinifi;

    @Column(name = "zamanlama", nullable = false)
    private String zamanlama; // MANUEL / GUNLUK / HAFTALIK / AYLIK

    @Column(name = "mail_gonder", nullable = false)
    private boolean mailGonder;

    @Column(name = "icerik", columnDefinition = "NVARCHAR(MAX)")
    private String icerik;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "olusturan_kullanici_id")
    private User olusturanKullanici;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "degistiren_kullanici_id")
    private User degistirenKullanici;

    @Column(name = "olusturma_tarihi", nullable = false)
    private LocalDateTime olusturmaTarihi;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
