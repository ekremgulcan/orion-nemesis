package com.orion.notification.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Customer;
import com.orion.core.service.CustomerService;
import com.orion.notification.domain.MusteriBildirimTercihi;
import com.orion.notification.dto.BildirimTercihiGuncelleRequest;
import com.orion.notification.service.MusteriBildirimTercihleriService;
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
    private List<MusteriBildirimTercihi> tercihler;

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

    public List<MusteriBildirimTercihi> getTercihler() {
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
        List<BildirimTercihiGuncelleRequest> guncellemeler = new ArrayList<>();
        for (MusteriBildirimTercihi tercih : tercihler) {
            if (tercih.getNotificationType().isZorunlu()) {
                continue;
            }
            BildirimTercihiGuncelleRequest guncelleme = new BildirimTercihiGuncelleRequest();
            guncelleme.setNotificationTypeId(tercih.getNotificationType().getId());
            guncelleme.setPushAcik(tercih.isPushAcik());
            guncelleme.setSmsAcik(tercih.isSmsAcik());
            guncelleme.setEpostaAcik(tercih.isEpostaAcik());
            guncellemeler.add(guncelleme);
        }
        tercihService.tercihleriKaydet(musteri.getId(), guncellemeler);
        yenidenYukle();
        Clients.showNotification("Bildirim tercihleri kaydedildi.");
    }

    private void yenidenYukle() {
        tercihler = tercihService.tercihleriGetir(musteri.getId());
        sonGuncelleme = tercihler.stream()
                .map(MusteriBildirimTercihi::getSonGuncelleme)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }
}
