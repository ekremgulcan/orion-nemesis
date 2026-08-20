package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_webmailer_prefs")
@Getter
@Setter
public class CustomerWebmailerPref {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pref_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "uye_id")
    private String uyeId;

    @Column(name = "rapor_aciklamasi", nullable = false)
    private String raporAciklamasi;

    @Column(name = "eposta")
    private String eposta;

    @Column(name = "secili", nullable = false)
    private boolean secili;
}
