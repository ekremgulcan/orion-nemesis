package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "account_hidden_accounts")
@Getter
@Setter
public class AccountHiddenAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hidden_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "gizli_hesap_no", nullable = false)
    private String gizliHesapNo;

    @Column(name = "aciklama")
    private String aciklama;
}
