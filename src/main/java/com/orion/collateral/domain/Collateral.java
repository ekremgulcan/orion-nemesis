package com.orion.collateral.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.Instrument;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "collaterals")
@Getter
@Setter
public class Collateral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "collateral_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "depo_tipi", nullable = false)
    private String depoTipi; // SERBEST / TEMINAT

    @Column(name = "varlik_tipi", nullable = false)
    private String varlikTipi; // NAKIT / DOVIZ / PAY_SENEDI / BORCLANMA_ARACI / FON

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private Instrument instrument;

    @Column(name = "para_birimi")
    private String paraBirimi;

    @Column(name = "miktar", nullable = false)
    private BigDecimal miktar;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
