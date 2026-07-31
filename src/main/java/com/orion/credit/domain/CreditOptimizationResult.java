package com.orion.credit.domain;

import com.orion.core.domain.Account;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "credit_optimization_results")
@Getter
@Setter
public class CreditOptimizationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "result_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private CreditOptimizationRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "serbest_bakiye", nullable = false)
    private BigDecimal serbestBakiye;

    @Column(name = "mevcut_ozkaynak_orani", nullable = false)
    private BigDecimal mevcutOzkaynakOrani;

    @Column(name = "yeni_ozkaynak_orani", nullable = false)
    private BigDecimal yeniOzkaynakOrani;

    @Column(name = "durum", nullable = false)
    private String durum; // UYGUN / UYGUN_DEGIL

    @Column(name = "komposizyon")
    private String komposizyon; // JSON metni

    @Column(name = "uygulandi", nullable = false)
    private boolean uygulandi = false;

    @Column(name = "uygulama_tarihi")
    private java.time.LocalDateTime uygulamaTarihi;
}
