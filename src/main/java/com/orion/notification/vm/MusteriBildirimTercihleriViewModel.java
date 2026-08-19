package com.orion.notification.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Customer;
import com.orion.core.service.CustomerService;
import com.orion.notification.domain.MusteriBildirimTercihi;
import com.orion.notification.dto.NotifTypeSummaryDto;
import com.orion.notification.dto.NotifChannelCodeDto;
import com.orion.notification.dto.NotifCategoryDto;
import com.orion.notification.dto.NotifPreferencesUpdateItem;
import com.orion.notification.service.MusteriBildirimTercihleriService;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.util.Clients;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * "Musteri Bildirim Tercihleri" (notification/musteri-bildirim-tercihleri.zul)
 * icin ViewModel.
 *
 * Sayfanin ust kismindaki "Musteri Sorgulama" kutusu ve "Musteri Bilgileri"
 * ozet paneli, ortak/yeniden kullanilabilir macro component'lerdir
 * (common/musteri-sorgulama-kutusu.zul, common/musteri-bilgi-paneli.zul).
 * Bu iki macro `inline="true"` oldugu icin dogrudan bu ViewModel'in
 * idspace'ine baglanir; bu VM asagidaki sozlesmeye uyar:
 *   - musteriNo (bind), musteriAra (@Command), musteriSorgulamaHata (load)
 *   - musteriBulunduMu / musteriAdi / musteriTcknVkn / musteriDurum /
 *     musteriSonGuncelleme (hepsi load)
 * Ileride "musteri no girip musteri bilgisi gosterme" ihtiyaci olan her
 * yeni ekran, ViewModel'ine bu ayni getter/command isimlerini kazandirarak
 * bu iki macro'yu oldugu gibi tekrar kullanabilir.
 *
 * V40'tan itibaren ekran KATEGORI bazinda calisir (bkz.
 * MusteriBildirimTercihleriService javadoc) - musteri arama hala "Musteri
 * No" ile yapilir (CustomerService.bulByMusteriNo, degismedi), ama musteri
 * bulunduktan SONRA bildirim tercihleri servis dokumaniyla birebir uyumlu
 * REST sozlesmesi (getAllForUsername/updateForUsername) customer.getUsername()
 * ile cagrilir - ZK ViewModel ile REST controller BIREBIR ayni servis
 * metotlarini kullanir. Wire DTO'lari (NotifCategoryDto/NotifChannelCodeDto),
 * ZK data-binding icin {@link KategoriSatiri}'ye duzlestirilir (bkz. o
 * sinifin javadoc'u).
 */
public class MusteriBildirimTercihleriViewModel {

    private static final DateTimeFormatter SON_GUNCELLEME_FORMAT =
            DateTimeFormatter.ofPattern("dd.MMM.yyyy HH:mm:ss");

    private final CustomerService customerService = SpringContextHolder.getBean(CustomerService.class);
    private final MusteriBildirimTercihleriService tercihService =
            SpringContextHolder.getBean(MusteriBildirimTercihleriService.class);

    private String musteriNo;
    private String musteriSorgulamaHata;

    private Customer musteri;
    private LocalDateTime sonGuncelleme;
    private List<KategoriSatiri> tercihler;

    public String getMusteriNo() {
        return musteriNo;
    }

    public void setMusteriNo(String musteriNo) {
        this.musteriNo = musteriNo;
    }

    public String getMusteriSorgulamaHata() {
        return musteriSorgulamaHata;
    }

    public boolean isMusteriBulunduMu() {
        return musteri != null;
    }

    public String getMusteriAdi() {
        return musteri == null ? null : musteri.getAdSoyadUnvan();
    }

    public String getMusteriTcknVkn() {
        return musteri == null ? null : musteri.getTcknVkn();
    }

    public String getMusteriDurum() {
        return musteri == null ? null : (musteri.isAktif() ? "Aktif" : "Pasif");
    }

    public String getMusteriSonGuncelleme() {
        return sonGuncelleme == null ? null : sonGuncelleme.format(SON_GUNCELLEME_FORMAT);
    }

    public List<KategoriSatiri> getTercihler() {
        return tercihler;
    }

    @Command("musteriAra")
    @NotifyChange({"musteriSorgulamaHata", "musteriBulunduMu", "musteriAdi", "musteriTcknVkn",
            "musteriDurum", "musteriSonGuncelleme", "tercihler"})
    public void musteriAra() {
        musteriSorgulamaHata = null;
        musteri = null;
        tercihler = null;
        sonGuncelleme = null;
        try {
            musteri = customerService.bulByMusteriNo(musteriNo);
            yenidenYukle();
        } catch (IllegalArgumentException ex) {
            musteriSorgulamaHata = ex.getMessage();
        }
    }

    @Command
    @NotifyChange({"tercihler", "musteriSonGuncelleme"})
    public void onayaGonder() {
        if (musteri == null || tercihler == null) {
            return;
        }
        List<NotifPreferencesUpdateItem> updates = new ArrayList<>();
        for (KategoriSatiri satir : tercihler) {
            ekleGuncellemeyeUygunsa(updates, satir.getCategoryCode(), "push", satir.isPushEditable(), satir.isPushAcik());
            ekleGuncellemeyeUygunsa(updates, satir.getCategoryCode(), "sms", satir.isSmsEditable(), satir.isSmsAcik());
            ekleGuncellemeyeUygunsa(updates, satir.getCategoryCode(), "email", satir.isEpostaEditable(), satir.isEpostaAcik());
        }
        tercihService.updateForUsername(musteri.getUsername(), updates);
        yenidenYukle();
        Clients.showNotification("Bildirim tercihleri kaydedildi.");
    }

    /**
     * "Kategori Icerigi" kolonundaki genislet/daralt oku - satirin
     * detay rozetlerini (each bildirim tipi icin ayri rozet) gosterip
     * gizler, "N bildirim" sayaci her zaman gorunur kalir. Satir nesnesi
     * dogrudan (bind edilen liste icindeki referans) mutasyona ugratilir -
     * ayri bir index/id araması gerekmez.
     */
    @Command
    @NotifyChange("tercihler")
    public void kategoriGenisletDaralt(@BindingParam("kategori") KategoriSatiri kategori) {
        kategori.setExpanded(!kategori.isExpanded());
    }

    private static void ekleGuncellemeyeUygunsa(List<NotifPreferencesUpdateItem> updates, String categoryCode,
                                                 String notifChannelCode, boolean editable, boolean acik) {
        // Kilitli (editable=false) kanallar zaten ekranda disabled - onlar
        // icin update elemani hic gonderilmez (gereksiz FAILED sonucu
        // birikmesin diye).
        if (!editable) {
            return;
        }
        NotifPreferencesUpdateItem item = new NotifPreferencesUpdateItem();
        item.setCategoryCode(categoryCode);
        item.setNotifChannelCode(notifChannelCode);
        item.setEnabled(acik);
        updates.add(item);
    }

    private void yenidenYukle() {
        List<MusteriBildirimTercihi> entities = tercihService.tercihleriGetir(musteri.getId());
        sonGuncelleme = entities.stream()
                .map(MusteriBildirimTercihi::getSonGuncelleme)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        tercihler = tercihService.getAllForUsername(musteri.getUsername())
                .getNotificationCategories().stream()
                .map(MusteriBildirimTercihleriViewModel::toSatir)
                .toList();
    }

    private static KategoriSatiri toSatir(NotifCategoryDto kategori) {
        KategoriSatiri satir = new KategoriSatiri();
        satir.setCategoryCode(kategori.getCategoryCode());
        satir.setCategoryName(kategori.getCategoryName());
        satir.setCategoryEditable(kategori.isEditable());
        satir.setCountBadgeHtml(countBadgeHtmlOlustur(kategori.getNotifications()));
        satir.setDetailBadgeHtml(detailBadgeHtmlOlustur(kategori.getNotifications()));

        NotifChannelCodeDto kanal = kategori.getNotifChannelCode();
        satir.setPushAcik(kanal.getPush().isEnabled());
        satir.setPushEditable(kanal.getPush().isEditable());
        satir.setSmsAcik(kanal.getSms().isEnabled());
        satir.setSmsEditable(kanal.getSms().isEditable());
        satir.setEpostaAcik(kanal.getEmail().isEnabled());
        satir.setEpostaEditable(kanal.getEmail().isEditable());
        return satir;
    }

    /** "N bildirim" sayac rozeti - her zaman gorunur (bkz. KategoriSatiri#expanded). */
    private static String countBadgeHtmlOlustur(List<NotifTypeSummaryDto> notifications) {
        int adet = notifications == null ? 0 : notifications.size();
        return "<span style=\"display:inline-block;background:#e2e8ee;border-radius:12px;"
                + "padding:2px 10px;margin:0 6px 6px 0;font-size:0.8em;color:#4a5a68;font-weight:600\">"
                + adet + " bildirim</span>";
    }

    /**
     * Her bildirim tipi icin bir rozet/badge - bildirim-ayarlari.zul'un
     * parametre rozetleriyle ayni gorsel desen, sadece satir genisletilmisken
     * gosterilir. templateHeader serbest metin oldugundan (bildirim-ayarlari'nin
     * \\w+ ile sinirli parametre adlarinin aksine) basit bir HTML escape uygulanir.
     */
    private static String detailBadgeHtmlOlustur(List<NotifTypeSummaryDto> notifications) {
        if (notifications == null || notifications.isEmpty()) {
            return "";
        }
        StringBuilder html = new StringBuilder();
        for (NotifTypeSummaryDto notification : notifications) {
            html.append("<span style=\"display:inline-block;background:#eef4fa;border:1px solid #b8d4ec;")
                    .append("border-radius:12px;padding:2px 10px;margin:0 6px 6px 0;font-size:0.8em;color:#2f6fad\">")
                    .append(htmlEscape(notification.getTemplateHeader())).append("</span>");
        }
        return html.toString();
    }

    private static String htmlEscape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
