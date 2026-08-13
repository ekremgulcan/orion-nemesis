package com.orion.notification.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.domain.NotifChannelTemplate;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.dto.KanalAyarlariGuncelleRequest;
import com.orion.notification.service.BildirimAyarlariService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.util.Clients;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * "Bildirim Ayarlari" ekrani - bildirim tipi secilir, kanallardan bagimsiz
 * genel durum ("Durum") goruntulenir/guncellenir; bir kanal secildiginde
 * o kanala ait sablon + "Diger Ayarlar" (Musteri Gorur ve Degistirir /
 * Max Deneme Sayisi / Tekrar Deneme Suresi / Kanal Durumu) goruntulenir.
 * "Duzenle" ile Mevcut Sablon + Diger Ayarlar duzenlenebilir hale gelir -
 * Bildirim Tipi/Durum/Bildirim Kanali her zaman duzenlenebilir kalir.
 * "Mevcut Sablon" etiketindeki "(Salt Okunur)" ibaresi duzenleme modunda
 * kaybolur (bkz. getMevcutSablonEtiketi()). templateHeader bu ekranda hic
 * gosterilmez/duzenlenmez, sadece templateBody.
 *
 * Alanlar (Musteri Gorur ve Degistirir/Max Deneme Sayisi/Tekrar Deneme
 * Suresi/Kanal Durumu/Mevcut Sablon) genelDurum'un NotificationType.active
 * icin yaptigi gibi DOGRUDAN selectedTemplate entity'sinin alanlarina
 * @bind edilir - ayri bir "duzenlenen deger" tamponu TUTULMAZ. Bunun
 * yerine "Iptal", selectedTemplate'i veritabanindan TAZE tekrar cekerek
 * bellekteki degisiklikleri atar; "Kaydet" ise o an selectedTemplate'te
 * duran (kullanicinin zaten dogrudan degistirmis oldugu) degerleri
 * oldugu gibi gonderir. Once ayri bir tampon (duzenlenenX alanlar)
 * kullanilmisti, ama bu goruntu/tampon ikiliginin senkronize kalmasi
 * gerektigi icin "sadece Duzenle'den sonra gorunuyor", "baska bir
 * kanala gecince eski duzenlenmis metin gorunuyor" gibi tutarsiz
 * hatalara yol acti - dogrudan mutasyon cok daha basit ve guvenilir.
 */
public class BildirimAyarlariViewModel {

    private static final Pattern PARAM_PATTERN = Pattern.compile("\\$\\{(\\w+)}");

    private final BildirimAyarlariService bildirimAyarlariService =
            SpringContextHolder.getBean(BildirimAyarlariService.class);

    private List<NotificationType> notificationTypes;
    private NotificationType selectedType;
    private BildirimKanali selectedChannel;
    private NotifChannelTemplate selectedTemplate;
    private boolean duzenlemeModu;

    @Init
    public void init() {
        notificationTypes = bildirimAyarlariService.tipleriGetir();
    }

    public List<NotificationType> getNotificationTypes() {
        return notificationTypes;
    }

    public NotificationType getSelectedType() {
        return selectedType;
    }

    @NotifyChange({"selectedType", "selectedChannel", "selectedTemplate", "tipSecilmisMi", "kanalSecilmisMi",
            "genelDurum", "parametreler", "parametrelerHtml", "musteriGorur", "maxRetry", "errorBackoff",
            "kanalDurumu", "duzenlemeModu", "mevcutSablon", "mevcutSablonEtiketi"})
    public void setSelectedType(NotificationType selectedType) {
        this.selectedType = selectedType;
        // Bildirim tipi degisince kanal secimi de sifirlanir - kanal bazli
        // ayarlar her bildirim tipi icin bagimsizdir.
        this.selectedChannel = null;
        this.selectedTemplate = null;
        this.duzenlemeModu = false;
    }

    public boolean isTipSecilmisMi() {
        return selectedType != null;
    }

    /**
     * "Durum (Kanallardan Bagimsiz)" combobox'i icin secilen tipin
     * NotificationType.active alanina proxy - Comboitem selectedItem'i
     * dogrudan bir entity'nin nested boolean alanina baglamak yerine
     * (kirilgan EL/tip donusumu) List&lt;Boolean&gt; model + selectedItem
     * ikilisi kullaniliyor, projedeki diger combobox'larla ayni desen.
     */
    public List<Boolean> getDurumSecenekleri() {
        return List.of(Boolean.TRUE, Boolean.FALSE);
    }

    public Boolean getGenelDurum() {
        return selectedType == null ? null : selectedType.isActive();
    }

    @NotifyChange("genelDurum")
    public void setGenelDurum(Boolean genelDurum) {
        if (selectedType != null && genelDurum != null) {
            selectedType.setActive(genelDurum);
        }
    }

    public BildirimKanali[] getKanalSecenekleri() {
        return BildirimKanali.values();
    }

    public BildirimKanali getSelectedChannel() {
        return selectedChannel;
    }

    @NotifyChange({"selectedChannel", "selectedTemplate", "kanalSecilmisMi", "parametreler", "parametrelerHtml",
            "musteriGorur", "maxRetry", "errorBackoff", "kanalDurumu", "duzenlemeModu", "mevcutSablon", "mevcutSablonEtiketi"})
    public void setSelectedChannel(BildirimKanali selectedChannel) {
        this.selectedChannel = selectedChannel;
        this.duzenlemeModu = false;
        this.selectedTemplate = kanalAyarlariniYukle();
    }

    private NotifChannelTemplate kanalAyarlariniYukle() {
        if (selectedType == null || selectedChannel == null) {
            return null;
        }
        return bildirimAyarlariService.kanalAyarlariGetir(selectedType.getId(), selectedChannel).orElse(null);
    }

    public boolean isKanalSecilmisMi() {
        return selectedChannel != null;
    }

    public boolean isDuzenlemeModu() {
        return duzenlemeModu;
    }

    /**
     * "Mevcut Sablon" duzenleme modunda editable hale gelir (referans
     * ekranda "(Salt Okunur)" etiketi de bu sirada kayboluyor, bkz.
     * getMevcutSablonEtiketi()) - templateHeader bu ekranda hic
     * gosterilmez/duzenlenmez, sadece templateBody.
     */
    public String getMevcutSablon() {
        return selectedTemplate == null ? null : selectedTemplate.getTemplateBody();
    }

    @NotifyChange({"mevcutSablon", "parametreler", "parametrelerHtml"})
    public void setMevcutSablon(String mevcutSablon) {
        if (selectedTemplate != null) {
            selectedTemplate.setTemplateBody(mevcutSablon);
        }
    }

    public String getMevcutSablonEtiketi() {
        return duzenlemeModu ? "Mevcut Sablon" : "Mevcut Sablon (Salt Okunur)";
    }

    /**
     * "Sablonda Kullanilabilecek Parametreler" - templateBody icindeki
     * ${Param} tokenlarindan turetilir, ilk gorunme sirasina gore tekrarsiz.
     */
    public List<String> getParametreler() {
        if (selectedTemplate == null) {
            return List.of();
        }
        Set<String> parametreler = new LinkedHashSet<>();
        Matcher matcher = PARAM_PATTERN.matcher(selectedTemplate.getTemplateBody());
        while (matcher.find()) {
            parametreler.add(matcher.group(1));
        }
        return List.copyOf(parametreler);
    }

    /**
     * getParametreler() listesinin hazir stillenmis (pill/badge) HTML
     * gorunumu - duz bir <n:div> container'in model+template destegi
     * olmadigi icin (o destek sadece listbox/combobox/tree gibi
     * "model-aware" bilesenlerde var), sabit sayida olmayan bir liste
     * <html> bileseniyle tek parca render edilir. Parametre adlari
     * regex \\w+ ile sinirlandirildigindan (bkz. PARAM_PATTERN) HTML
     * escape'e gerek yoktur.
     */
    public String getParametrelerHtml() {
        List<String> parametreler = getParametreler();
        if (parametreler.isEmpty()) {
            return "<span style=\"color:#8a97a3;font-size:0.85em\">Bu sablonda parametre bulunmuyor.</span>";
        }
        StringBuilder html = new StringBuilder();
        for (String parametre : parametreler) {
            html.append("<span style=\"display:inline-block;background:#eef4fa;border:1px solid #b8d4ec;")
                    .append("border-radius:12px;padding:2px 10px;margin:0 6px 6px 0;font-size:0.8em;")
                    .append("color:#2f6fad;font-family:monospace\">$&#123;").append(parametre).append("&#125;</span>");
        }
        return html.toString();
    }

    public List<Boolean> getEvetHayirSecenekleri() {
        return List.of(Boolean.TRUE, Boolean.FALSE);
    }

    public Boolean getMusteriGorur() {
        return selectedTemplate == null ? null : selectedTemplate.isMusteriGorurVeDegistir();
    }

    @NotifyChange("musteriGorur")
    public void setMusteriGorur(Boolean musteriGorur) {
        if (selectedTemplate != null && musteriGorur != null) {
            selectedTemplate.setMusteriGorurVeDegistir(musteriGorur);
        }
    }

    public Integer getMaxRetry() {
        return selectedTemplate == null ? null : selectedTemplate.getMaxRetry();
    }

    @NotifyChange("maxRetry")
    public void setMaxRetry(Integer maxRetry) {
        if (selectedTemplate != null && maxRetry != null) {
            selectedTemplate.setMaxRetry(maxRetry);
        }
    }

    public Integer getErrorBackoff() {
        return selectedTemplate == null ? null : selectedTemplate.getErrorBackoffTime();
    }

    @NotifyChange("errorBackoff")
    public void setErrorBackoff(Integer errorBackoff) {
        if (selectedTemplate != null && errorBackoff != null) {
            selectedTemplate.setErrorBackoffTime(errorBackoff);
        }
    }

    public Boolean getKanalDurumu() {
        return selectedTemplate == null ? null : selectedTemplate.isActive();
    }

    @NotifyChange("kanalDurumu")
    public void setKanalDurumu(Boolean kanalDurumu) {
        if (selectedTemplate != null && kanalDurumu != null) {
            selectedTemplate.setActive(kanalDurumu);
        }
    }

    @Command
    @NotifyChange({"duzenlemeModu", "mevcutSablonEtiketi"})
    public void duzenle() {
        if (selectedTemplate == null) {
            return;
        }
        duzenlemeModu = true;
    }

    @Command
    @NotifyChange({"selectedTemplate", "duzenlemeModu", "musteriGorur", "maxRetry", "errorBackoff",
            "kanalDurumu", "mevcutSablon", "mevcutSablonEtiketi", "parametreler", "parametrelerHtml"})
    public void iptal() {
        // Bellekteki (kaydedilmemis) degisiklikleri atmak icin sablonu
        // veritabanindan taze tekrar cek.
        this.selectedTemplate = kanalAyarlariniYukle();
        this.duzenlemeModu = false;
    }

    @Command
    @NotifyChange({"selectedType", "notificationTypes", "genelDurum"})
    public void onayaGonder() {
        if (selectedType == null) {
            return;
        }
        NotificationType guncel = bildirimAyarlariService.genelDurumGuncelle(selectedType.getId(), selectedType.isActive());
        this.selectedType = guncel;
        Clients.showNotification("Genel durum guncellendi.");
    }

    @Command
    @NotifyChange({"selectedTemplate", "duzenlemeModu", "musteriGorur", "maxRetry", "errorBackoff", "kanalDurumu",
            "mevcutSablon", "mevcutSablonEtiketi", "parametreler", "parametrelerHtml"})
    public void kanalAyarlariniKaydet() {
        if (selectedTemplate == null) {
            return;
        }
        KanalAyarlariGuncelleRequest request = new KanalAyarlariGuncelleRequest();
        request.setMusteriGorurVeDegistir(selectedTemplate.isMusteriGorurVeDegistir());
        request.setMaxRetry(selectedTemplate.getMaxRetry());
        request.setErrorBackoffTime(selectedTemplate.getErrorBackoffTime());
        request.setActive(selectedTemplate.isActive());
        request.setTemplateBody(selectedTemplate.getTemplateBody());
        this.selectedTemplate = bildirimAyarlariService.kanalAyarlariniKaydet(selectedTemplate.getId(), request);
        this.duzenlemeModu = false;
        Clients.showNotification("Kanal ayarlari kaydedildi.");
    }
}
