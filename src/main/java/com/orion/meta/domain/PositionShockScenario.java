package com.orion.meta.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "position_shock_scenarios")
@Getter
@Setter
public class PositionShockScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scenario_id")
    private Long id;

    @Column(name = "senaryo_adi", nullable = false)
    private String senaryoAdi;

    @Column(name = "currency_pair", nullable = false)
    private String currencyPair;

    @Column(name = "sok_yuzdesi", nullable = false)
    private BigDecimal sokYuzdesi;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @Column(name = "olusturma_tarihi", nullable = false)
    private LocalDateTime olusturmaTarihi;
}
