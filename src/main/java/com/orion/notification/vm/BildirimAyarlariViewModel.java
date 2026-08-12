package com.orion.notification.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.service.BildirimAyarlariService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.util.Clients;

import java.util.List;

/**
 * "Bildirim Ayarlari" ekrani - bildirim tipi secilir, kanallardan bagimsiz
 * genel durum ("Durum") goruntulenir/guncellenir. Bir bildirim kanali
 * secildiginde (Bildirim Kanali) su an sadece bir yer tutucu mesaj
 * gosterilir - bu ekrana ILERIDE eklenecek olan kanal bazli bolum
 * (Sablonda Kullanilabilecek Parametreler, Mevcut Sablon, Diger Ayarlar:
 * Musteri Gorur ve Degistirir / Max Deneme Sayisi / Tekrar Deneme Suresi /
 * Kanal Durumu) icin bilerek genisletilebilir birakildi:
 *   - selectedChannel zaten bir BildirimKanali (enum) tutuyor, ileride bu
 *     deger + selectedType.id ile bir NotifChannelTemplate satiri aranacak.
 *   - getKanalAyarlariMesaji() tek yer tutucu metot; ileride bu metodun
 *     yerine gercek kanal ayarlarini donen bir getter (orn.
 *     getSecilenKanalAyarlari()) eklenip zul'daki tek placeholder div,
 *     yapisi bozulmadan gercek bir panelle degistirilebilir.
 *   - onayaGonder() sadece genel durumu kaydeder; kanal bazli ayarlar
 *     icin ayri bir komut (orn. kanalAyarlariniKaydet) eklenecek.
 */
public class BildirimAyarlariViewModel {

    private final BildirimAyarlariService bildirimAyarlariService =
            SpringContextHolder.getBean(BildirimAyarlariService.class);

    private List<NotificationType> notificationTypes;
    private NotificationType selectedType;
    private BildirimKanali selectedChannel;

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

    @NotifyChange({"selectedType", "selectedChannel", "tipSecilmisMi", "kanalSecilmisMi", "kanalAyarlariMesaji", "genelDurum"})
    public void setSelectedType(NotificationType selectedType) {
        this.selectedType = selectedType;
        // Bildirim tipi degisince kanal secimi de sifirlanir - kanal bazli
        // ayarlar her bildirim tipi icin bagimsizdir.
        this.selectedChannel = null;
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

    @NotifyChange({"selectedChannel", "kanalSecilmisMi", "kanalAyarlariMesaji"})
    public void setSelectedChannel(BildirimKanali selectedChannel) {
        this.selectedChannel = selectedChannel;
    }

    public boolean isKanalSecilmisMi() {
        return selectedChannel != null;
    }

    /**
     * Yer tutucu: kanal secildikten sonra gosterilecek gercek panel
     * (sablon/parametreler/diger ayarlar) henuz uygulanmadi.
     */
    public String getKanalAyarlariMesaji() {
        if (selectedChannel == null) {
            return null;
        }
        return "Bu kanal icin sablon ve diger ayarlar yakinda eklenecektir.";
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
}
