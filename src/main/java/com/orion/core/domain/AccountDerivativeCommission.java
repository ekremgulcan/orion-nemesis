package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "account_derivative_commissions")
@Getter
@Setter
public class AccountDerivativeCommission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deriv_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "islem")
    private String islem;

    @Column(name = "komisyon_degeri")
    private BigDecimal komisyonDegeri;

    @Column(name = "para_birimi")
    private String paraBirimi;
}
