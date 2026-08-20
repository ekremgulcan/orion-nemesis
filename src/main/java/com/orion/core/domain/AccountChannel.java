package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "account_channels")
@Getter
@Setter
public class AccountChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "acc_channel_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kanal", nullable = false)
    private String kanal;

    @Column(name = "yetkili", nullable = false)
    private boolean yetkili = true;

    @Column(name = "durum", nullable = false)
    private String durum = "AKTIF";
}
