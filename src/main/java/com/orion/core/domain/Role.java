package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "roles")
@Getter
@Setter
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Long id;

    @Column(name = "rol_adi", nullable = false, unique = true)
    private String rolAdi;

    @Column(name = "aciklama")
    private String aciklama;
}
