package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "viop_risk_profiles")
@Getter
@Setter
public class ViopRiskProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "viop_risk_profile_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "profil_adi", nullable = false)
    private String profilAdi; // Kurum Temkinli 2 Kat / Kurum Standart 1.5 Kat / Takasbank Birebir

    @Column(name = "carpan", nullable = false)
    private BigDecimal carpan;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
