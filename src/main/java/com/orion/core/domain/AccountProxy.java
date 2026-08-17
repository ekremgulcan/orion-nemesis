package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "account_proxies")
@Getter
@Setter
public class AccountProxy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "proxy_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kimlik_no")
    private String kimlikNo;

    @Column(name = "isim")
    private String isim;

    @Column(name = "soyisim")
    private String soyisim;

    @Column(name = "baba_adi")
    private String babaAdi;

    @Column(name = "uyruk")
    private String uyruk;

    @Column(name = "vergi_mukellefiyeti")
    private String vergiMukellefiyeti;

    @Column(name = "cinsiyet")
    private String cinsiyet;

    @Column(name = "vekil_tipi")
    private String vekilTipi;
}
