package com.orion.crm.domain;

import com.orion.core.domain.Account;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kanal", nullable = false)
    private String kanal; // EMAIL / SMS

    @Column(name = "icerik", nullable = false)
    private String icerik;

    @Column(name = "gonderim_tarihi", nullable = false)
    private LocalDateTime gonderimTarihi;

    @Column(name = "durum", nullable = false)
    private String durum; // GONDERILDI / HATA
}
