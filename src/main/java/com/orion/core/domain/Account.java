package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long id;

    @Column(name = "hesap_no", nullable = false, unique = true)
    private String hesapNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "hesap_tipi", nullable = false)
    private String hesapTipi; // NAKIT / KREDI / VIOP

    @Column(name = "durum", nullable = false)
    private String durum; // AKTIF / DONDURULMUS / KAPALI

    @Column(name = "acilis_tarihi", nullable = false, updatable = false)
    private LocalDateTime acilisTarihi;
}
