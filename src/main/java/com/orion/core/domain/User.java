package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "kullanici_adi", nullable = false, unique = true)
    private String kullaniciAdi;

    @Column(name = "ad_soyad", nullable = false)
    private String adSoyad;

    @Column(name = "email")
    private String email;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    private LocalDateTime olusturmaTarihi;

    @ManyToMany
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roller = new HashSet<>();
}
