package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "account_custody")
@Getter
@Setter
public class AccountCustody {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "custody_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "saklamaci")
    private String saklamaci;

    @Column(name = "saklama_hesap_no")
    private String saklamaHesapNo;

    @Column(name = "para_birimi")
    private String paraBirimi;
}
