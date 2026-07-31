package com.orion.credit.domain;

import com.orion.core.domain.Account;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_accounts")
@Getter
@Setter
public class CreditAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_account_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kredi_limiti", nullable = false)
    private BigDecimal krediLimiti;

    @Column(name = "kredi_bakiyesi", nullable = false)
    private BigDecimal krediBakiyesi;

    @Column(name = "serbest_bakiye", nullable = false)
    private BigDecimal serbestBakiye;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
