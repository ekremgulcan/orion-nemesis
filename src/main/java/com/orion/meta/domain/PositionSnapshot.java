package com.orion.meta.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.Instrument;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "position_snapshots")
@Getter
@Setter
public class PositionSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "snapshot_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private Instrument instrument;

    @Column(name = "miktar", nullable = false)
    private BigDecimal miktar;

    @Column(name = "referans_fiyat", nullable = false)
    private BigDecimal referansFiyat;

    @Column(name = "kayit_tarihi", nullable = false)
    private LocalDateTime kayitTarihi;
}
