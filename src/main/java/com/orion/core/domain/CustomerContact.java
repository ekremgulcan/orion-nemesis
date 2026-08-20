package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_contacts")
@Getter
@Setter
public class CustomerContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "iletisim_tipi", nullable = false)
    private String iletisimTipi;

    @Column(name = "deger", nullable = false)
    private String deger;

    @Column(name = "varsayilan", nullable = false)
    private boolean varsayilan;
}
