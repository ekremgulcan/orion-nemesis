package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "customer_suitability_tests")
@Getter
@Setter
public class CustomerSuitabilityTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "test_tipi", nullable = false)
    private String testTipi;

    @Column(name = "test_tarihi")
    private LocalDate testTarihi;

    @Column(name = "test_sonucu")
    private String testSonucu;
}
