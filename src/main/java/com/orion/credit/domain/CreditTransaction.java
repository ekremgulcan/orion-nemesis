package com.orion.credit.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_transactions")
@Getter
@Setter
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_transaction_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_account_id", nullable = false)
    private CreditAccount creditAccount;

    @Column(name = "tutar", nullable = false)
    private BigDecimal tutar;

    @Column(name = "islem_tipi", nullable = false)
    private String islemTipi; // ODEME / KULLANIM

    @Column(name = "gun_tipi", nullable = false)
    private String gunTipi; // GUNBASI / GUNICI

    @Column(name = "islem_tarihi", nullable = false)
    private LocalDateTime islemTarihi;
}
