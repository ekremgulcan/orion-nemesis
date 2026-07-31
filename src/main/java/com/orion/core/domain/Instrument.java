package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "instruments")
@Getter
@Setter
public class Instrument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "instrument_id")
    private Long id;

    @Column(name = "isin", nullable = false, unique = true)
    private String isin;

    @Column(name = "sembol", nullable = false)
    private String sembol;

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "tip", nullable = false)
    private String tip; // HISSE / VIOP / SGMK / EUROBOND

    @Column(name = "borsa", nullable = false)
    private String borsa;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;
}
