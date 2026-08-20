package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_references")
@Getter
@Setter
public class CustomerReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reference_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "referans_adi")
    private String referansAdi;

    @Column(name = "referans_telefon")
    private String referansTelefon;

    @Column(name = "referans_kurum")
    private String referansKurum;

    @Column(name = "aciklama")
    private String aciklama;
}
