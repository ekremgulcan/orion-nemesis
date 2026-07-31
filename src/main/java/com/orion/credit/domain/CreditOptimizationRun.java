package com.orion.credit.domain;

import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_optimization_runs")
@Getter
@Setter
public class CreditOptimizationRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "run_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calistiran_kullanici_id", nullable = false)
    private User calistiranKullanici;

    @Column(name = "gun_tipi", nullable = false)
    private String gunTipi; // GUNBASI / GUNICI

    @Column(name = "hedef_ozkaynak_orani", nullable = false)
    private BigDecimal hedefOzkaynakOrani;

    @Column(name = "calisma_tarihi", nullable = false)
    private LocalDateTime calismaTarihi;
}
