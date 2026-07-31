package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "channel_authorizations")
@Getter
@Setter
public class ChannelAuthorization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "channel_auth_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kanal", nullable = false)
    private String kanal; // TRADEMASTER / INTERNET_SUBESI / MOBIL / CAGRI_MERKEZI

    @Column(name = "yetki_durumu", nullable = false)
    private String yetkiDurumu; // AKTIF / PASIF

    @Column(name = "tanimlama_tarihi", nullable = false)
    private LocalDateTime tanimlamaTarihi;
}
