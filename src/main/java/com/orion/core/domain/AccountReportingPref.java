package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "account_reporting_prefs")
@Getter
@Setter
public class AccountReportingPref {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reporting_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "rapor_tipi", nullable = false)
    private String raporTipi;

    @Column(name = "kanal")
    private String kanal;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;
}
