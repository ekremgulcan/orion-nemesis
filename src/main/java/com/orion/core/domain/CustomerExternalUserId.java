package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_external_user_ids")
@Getter
@Setter
public class CustomerExternalUserId {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ext_user_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "dis_sistem", nullable = false)
    private String disSistem;

    @Column(name = "kullanici_kodu", nullable = false)
    private String kullaniciKodu;
}
