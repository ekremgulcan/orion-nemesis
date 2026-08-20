package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "account_contracts")
@Getter
@Setter
public class AccountContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "hizmet_tipi")
    private String hizmetTipi;

    @Column(name = "sozlesme_adi")
    private String sozlesmeAdi;

    @Column(name = "getirilis_tarihi")
    private LocalDate getirilisTarihi;

    @Column(name = "versiyon")
    private String versiyon;
}
