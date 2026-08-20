package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_channels")
@Getter
@Setter
public class CustomerChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "channel_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "kanal", nullable = false)
    private String kanal;

    @Column(name = "yetkili", nullable = false)
    private boolean yetkili = true;

    @Column(name = "durum", nullable = false)
    private String durum = "AKTIF";
}
