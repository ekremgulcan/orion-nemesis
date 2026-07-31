package com.orion.risk.domain;

import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_limits")
@Getter
@Setter
public class UserLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_limit_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "enstruman_tipi", nullable = false)
    private String enstrumanTipi; // HISSE / SGMK

    @Column(name = "gunluk_toplam_limit", nullable = false)
    private BigDecimal gunlukToplamLimit;

    @Column(name = "anlik_islem_limiti", nullable = false)
    private BigDecimal anlikIslemLimiti;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
