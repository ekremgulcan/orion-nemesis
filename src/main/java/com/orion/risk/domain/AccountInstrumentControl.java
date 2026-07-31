package com.orion.risk.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.Instrument;
import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "account_instrument_controls")
@Getter
@Setter
public class AccountInstrumentControl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "control_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id", nullable = false)
    private Instrument instrument;

    @Column(name = "alis_izni", nullable = false)
    private boolean alisIzni;

    @Column(name = "satis_izni", nullable = false)
    private boolean satisIzni;

    @Column(name = "acik_satis_izni", nullable = false)
    private boolean acikSatisIzni;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
