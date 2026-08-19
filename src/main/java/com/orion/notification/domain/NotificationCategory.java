package com.orion.notification.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bildirim kategorisi katalogu (orn. "Emir Durum Bildirimleri", "VIOP
 * Margin Call Bildirimleri"). "Musteri Bildirim Tercihleri" ekraninda her
 * satir artik bir {@link NotificationType} degil, bir NotificationCategory'e
 * karsilik gelir - bir kategorinin altindaki butun NotificationType'lar
 * (bkz. {@link NotificationType#getCategory()}) TEK bir Push/SMS/E-Posta
 * tercihini paylasir (bkz. MusteriBildirimTercihi).
 *
 * Servis dokumanindaki (musteri_bildirim_tercihleri_servis_dokumani.docx)
 * "isEditable" alani IKI ayri, birbirinden BAGIMSIZ kavramdir - burada da
 * ayri kolonlar olarak tutulur:
 *   - {@link #editable} (kategori seviyesinde, TEK deger): dokumanda
 *     "Mobil tarafta gorunurlugu etkileyebilir" olarak aciklanan bir
 *     GORUNURLUK/UI kuralidir (orn. VIOP: "Orion'da musteri kartinda
 *     gorunur ama kullanici aksiyon alamaz, mobilde ise gorunmez").
 *   - {@link #pushEditable}/{@link #smsEditable}/{@link #epostaEditable}
 *     (kanal basina ayri): dokuman section 3.2'de "isEditable=false olan
 *     kombinasyonlar icin update islemi yapilamaz" seklinde aciklanan bir
 *     IS KURALIDIR (VIOP mevzuatsal zorunlu oldugu icin 3 kanalda da
 *     false). Bu iki alan birbirinden TUREtilMEZ - dokumanin kendi ornek
 *     response'u (ORDER_STATUS: kategori isEditable=true ama sms/email
 *     kanal isEditable=false) bunlarin bagimsiz oldugunu zaten gosteriyor.
 *
 * Referans veri olarak bugun sadece VIOP_MARGIN_CALL'un (mevzuatsal
 * zorunlu) hem kategori hem 3 kanalda da kilitli oldugu, ORDER_STATUS'un
 * ise hepsinde acik oldugu kabul edildi (bkz. V40 migration yorumu -
 * dokumanin ORDER_STATUS ornegindeki spesifik sms/email=false degerleri
 * bu uygulamada karsiligi olmayan bir musteriye-ozel duruma ait olabilir,
 * genel bir is kurali degil).
 */
@Entity
@Table(name = "notification_categories")
@Getter
@Setter
public class NotificationCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long id;

    @Column(name = "kod", nullable = false, unique = true)
    private String kod;

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "sira", nullable = false)
    private int sira;

    @Column(name = "is_editable", nullable = false)
    private boolean editable = true;

    @Column(name = "push_editable", nullable = false)
    private boolean pushEditable = true;

    @Column(name = "sms_editable", nullable = false)
    private boolean smsEditable = true;

    @Column(name = "eposta_editable", nullable = false)
    private boolean epostaEditable = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_time")
    private LocalDateTime createdTime;

    @Column(name = "last_updated_by")
    private String lastUpdatedBy;

    @Column(name = "last_updated_time")
    private LocalDateTime lastUpdatedTime;

    /** {@link #pushEditable}/{@link #smsEditable}/{@link #epostaEditable}'i {@link BildirimKanali} ile sorgular. */
    public boolean isEditableFor(BildirimKanali kanal) {
        return switch (kanal) {
            case PUSH -> pushEditable;
            case SMS -> smsEditable;
            case EPOSTA -> epostaEditable;
        };
    }
}
