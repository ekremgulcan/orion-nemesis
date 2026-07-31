package com.orion.risk.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_profiles")
@Getter
@Setter
public class RiskProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "risk_profile_id")
    private Long id;

    @Column(name = "enstruman_tipi", nullable = false)
    private String enstrumanTipi; // HISSE / SGMK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "alis_kontrol", nullable = false)
    private boolean alisKontrol;

    @Column(name = "satis_kontrol", nullable = false)
    private boolean satisKontrol;

    @Column(name = "acik_satis_kontrol", nullable = false)
    private boolean acikSatisKontrol;

    @Column(name = "grup_a_nakit_kontrol", nullable = false)
    private boolean grupANakitKontrol;

    @Column(name = "grup_b_nakit_kontrol", nullable = false)
    private boolean grupBNakitKontrol;

    @Column(name = "grup_c_nakit_kontrol", nullable = false)
    private boolean grupCNakitKontrol;

    @Column(name = "grup_d_nakit_kontrol", nullable = false)
    private boolean grupDNakitKontrol;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @Column(name = "guncelleme_tarihi", nullable = false)
    private LocalDateTime guncellemeTarihi;
}
