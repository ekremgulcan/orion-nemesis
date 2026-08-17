package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "customer_education")
@Getter
@Setter
public class CustomerEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "education_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "egitim_derecesi")
    private String egitimDerecesi;

    @Column(name = "okul")
    private String okul;

    @Column(name = "fakulte")
    private String fakulte;

    @Column(name = "bolum")
    private String bolum;

    @Column(name = "mezuniyet_tarihi")
    private LocalDate mezuniyetTarihi;
}
