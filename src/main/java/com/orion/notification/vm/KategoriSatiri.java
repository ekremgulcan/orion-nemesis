package com.orion.notification.vm;

import lombok.Getter;
import lombok.Setter;

/**
 * "Musteri Bildirim Tercihleri" ekraninin tablo satiri - REST/wire
 * DTO'larinin (NotifCategoryDto/NotifChannelCodeDto) ZK data-binding icin
 * DUZLESTIRILMIS hali. ZK EL, nested property zincirlerini (orn.
 * "each.notifChannelCode.push.enabled") teorik olarak cozebilir, ama
 * projenin diger butun ekranlari (bkz. bildirim-ayarlari.zul) hep DUZ
 * (nested olmayan) checkbox/switch bind'leri kullaniyor - tutarlilik ve
 * iki-yonlu @bind'in guvenilirligi icin bu ekranda da ayni desen
 * korunuyor. `badgeHtml`, o kategorinin icerdigi bildirim tiplerinin
 * (NotifTypeSummaryDto listesi) onceden olusturulmus rozet/badge
 * HTML'idir (bkz. MusteriBildirimTercihleriViewModel#badgeHtmlOlustur).
 */
@Getter
@Setter
public class KategoriSatiri {
    private String categoryCode;
    private String categoryName;
    private boolean categoryEditable;

    /** Her zaman gorunur - "N bildirim" sayac rozeti. */
    private String countBadgeHtml;

    /** Sadece {@link #expanded} true iken gorunur - her bildirim tipi icin ayri rozet. */
    private String detailBadgeHtml;

    /** Satirin genisletilmis/daraltilmis oldugu - varsayilan genisletilmis (mockup'taki gibi). */
    private boolean expanded = true;

    private boolean pushAcik;
    private boolean pushEditable;

    private boolean smsAcik;
    private boolean smsEditable;

    private boolean epostaAcik;
    private boolean epostaEditable;
}
