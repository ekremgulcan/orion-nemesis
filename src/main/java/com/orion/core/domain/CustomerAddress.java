package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_addresses")
@Getter
@Setter
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "adres_tipi", nullable = false)
    private String adresTipi;

    @Column(name = "ulke")
    private String ulke;

    @Column(name = "il")
    private String il;

    @Column(name = "ilce")
    private String ilce;

    @Column(name = "mahalle")
    private String mahalle;

    @Column(name = "cadde_sokak")
    private String caddeSokak;

    @Column(name = "kapi_no")
    private String kapiNo;

    @Column(name = "posta_kodu")
    private String postaKodu;

    @Column(name = "varsayilan", nullable = false)
    private boolean varsayilan;
}
