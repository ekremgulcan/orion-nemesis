package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "customer_required_documents")
@Getter
@Setter
public class CustomerRequiredDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "dokuman_tipi", nullable = false)
    private String dokumanTipi;

    @Column(name = "getirilis_tarihi")
    private LocalDate getirilisTarihi;

    @Column(name = "gecerlilik_tarihi")
    private LocalDate gecerlilikTarihi;

    @Column(name = "versiyon")
    private String versiyon;

    @Column(name = "secili", nullable = false)
    private boolean secili;
}
