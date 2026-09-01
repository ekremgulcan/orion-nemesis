package com.orion.workflow.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_processes")
@Getter
@Setter
public class WorkflowProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_id")
    private Long id;

    @Column(name = "surec_no", nullable = false, unique = true)
    private String surecNo;

    @Column(name = "surec_tipi", nullable = false)
    private String surecTipi; // CashTransfer / CreditOptimization / CampaignMessage / ...

    @Column(name = "baslangic_tarihi", nullable = false)
    private LocalDateTime baslangicTarihi;

    @Column(name = "durum", nullable = false)
    private String durum; // ACIK / TAMAMLANDI / IPTAL

    @Column(name = "referans_modul")
    private String referansModul; // CREDIT / CRM / null

    @Column(name = "referans_id")
    private Long referansId;

    @Column(name = "islem_sonucu")
    private String islemSonucu; // ONAYLANDI / REDDEDILDI

    /**
     * Surec tipinin kullaniciya gorunecek adi. Gorev listesi ekraninda
     * ham kod yerine bu deger gosterilir. Yeni onay ekranlari eklendiginde
     * buraya bir case daha eklenmeli.
     */
    @Transient
    public String getGorunenAd() {
        if (surecTipi == null) {
            return "";
        }
        switch (surecTipi) {
            case "HISSE_RISK_PARAMETRELERI_ONAY":
                return "Hisse Risk Tanimlama";
            case "MUSTERI_BILDIRIM_TERCIHLERI_ONAY":
                return "Musteri Bildirim Tercihleri";
            default:
                return surecTipi;
        }
    }
}
