package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
@Getter
@Setter
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long id;

    @Column(name = "musteri_no", nullable = false, unique = true)
    private String musteriNo;

    /**
     * Musterinin login/kullanici adi (V41). "Musteri Bildirim Tercihleri"
     * servis dokumaninin GET/POST uc noktalari musteriyi bununla tanimlar,
     * musteri_no ile degil - ekranin kendisi hala "Musteri No" ile arama
     * yapar (bkz. musteriSorgulamaKutusu.zul), musteri bulunduktan SONRA bu
     * alan uzerinden bildirim tercihleri servisiyle konusulur.
     */
    @Column(name = "username", nullable = false, unique = true, length = 80)
    private String username;

    @Column(name = "ad_soyad_unvan", nullable = false)
    private String adSoyadUnvan;

    @Column(name = "musteri_tipi", nullable = false)
    private String musteriTipi; // BIREYSEL / KURUMSAL

    @Column(name = "tckn_vkn", nullable = false, unique = true)
    private String tcknVkn;

    @Column(name = "risk_grubu", nullable = false)
    private String riskGrubu; // DUSUK / ORTA / YUKSEK

    @Column(name = "telefon")
    private String telefon;

    @Column(name = "email")
    private String email;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    private LocalDateTime olusturmaTarihi;

    @Column(name = "aktif", nullable = false)
    private boolean aktif = true;

    @OneToMany(mappedBy = "customer")
    private List<Account> hesaplar = new ArrayList<>();
}
