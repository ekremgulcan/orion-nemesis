package com.orion.risk.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.User;
import com.orion.workflow.domain.WorkflowProcess;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Onay bekleyen hisse risk parametresi degisiklik talebi. Toplu guncelleme
 * akisinda HER hesap icin ayri bir talep satiri olusturulur (account_id FK).
 * Onaylanirsa yeni deger hisse_risk_parametreleri tablosuna yazilir;
 * reddedilirse degisiklik uygulanmaz.
 *
 * Uc JSON kolonu:
 * - oncekiDegerJson: tam onceki snapshot (audit / rollback icin)
 * - yeniDegerJson: onaylanirsa uygulanacak degerler
 * - degisiklikListesiJson: UI diff popup'inda gosterilen kompakt fark listesi
 *
 * process iliskisi LAZY - repo sorgularinda join fetch kullanilmali,
 * aksi halde LazyInitializationException firlatilir.
 */
@Entity
@Table(name = "hisse_risk_parametreleri_talepleri")
@Getter
@Setter
public class HisseRiskParametreTalebi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "talep_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    private WorkflowProcess process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "talep_eden_user_id", nullable = false)
    private User talepEden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "durum", nullable = false)
    private String durum = "BEKLEMEDE"; // BEKLEMEDE / ONAYLANDI / REDDEDILDI

    @Column(name = "onceki_deger_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String oncekiDegerJson;

    @Column(name = "yeni_deger_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String yeniDegerJson;

    @Column(name = "degisiklik_listesi_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String degisiklikListesiJson;

    @Column(name = "aciklama", columnDefinition = "NVARCHAR(500)")
    private String aciklama;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    private LocalDateTime olusturmaTarihi;

    @Column(name = "karar_tarihi")
    private LocalDateTime kararTarihi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "karar_veren_user_id")
    private User kararVeren;
}
