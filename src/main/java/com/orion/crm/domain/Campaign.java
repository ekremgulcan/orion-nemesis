package com.orion.crm.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "campaign_id")
    private Long id;

    @Column(name = "kampanya_adi", nullable = false)
    private String kampanyaAdi;

    @Column(name = "baslangic_tarihi", nullable = false)
    private LocalDateTime baslangicTarihi;

    @Column(name = "bitis_tarihi")
    private LocalDateTime bitisTarihi;

    @Column(name = "durum", nullable = false)
    private String durum; // AKTIF / PASIF / TAMAMLANDI
}
