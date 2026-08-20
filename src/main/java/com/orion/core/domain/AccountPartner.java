package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "account_partners")
@Getter
@Setter
public class AccountPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "partner_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kimlik_no")
    private String kimlikNo;

    @Column(name = "isim")
    private String isim;

    @Column(name = "soyisim")
    private String soyisim;

    @Column(name = "ortaklik_payi")
    private BigDecimal ortaklikPayi;

    @Column(name = "mkk_sicil_no")
    private String mkkSicilNo;

    @Column(name = "takasbank_sicil_no")
    private String takasbankSicilNo;

    @Column(name = "yatirimci_durumu")
    private String yatirimciDurumu;
}
