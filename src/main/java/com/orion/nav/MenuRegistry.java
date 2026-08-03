package com.orion.nav;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * design-screenshots altindaki ekran gorsellerinden cikarilan 33 modulluk
 * sol menu listesi. Sadece Kredi Islemleri, CRM (Musteri Iletisim Panosu)
 * ve Ana Sayfa/Gorev Listesi gercek ekrana sahiptir; digerleri placeholder
 * ("Yapim Asamasinda") ekranina yonlendirilir.
 */
@Component
public class MenuRegistry {

    public List<MenuItem> getMenuItems() {
        List<MenuItem> items = new ArrayList<>();
        items.add(new MenuItem("Halka Arz Islemleri", null));
        items.add(new MenuItem("VIOP Kotasyon Izleme", "/core/viop-kotasyon.zul"));
        items.add(new MenuItem("Musteri Yonetim Sistemi", "/core/musteriler.zul"));
        items.add(new MenuItem("TradeMaster Yetkilendirme", "/core/trademaster-yetkilendirme.zul"));
        items.add(new MenuItem("VIOP Risk Profili Tanim", "/core/viop-risk-profili.zul"));
        items.add(new MenuItem("Musteri Iletisim Panosu", "/crm/toplu-mesaj-gonder.zul"));
        items.add(new MenuItem("Bildirim Izleme", "/notification/bildirim-izleme.zul"));
        items.add(new MenuItem("SGMK - Ozel Oran Tanimlari", null));
        items.add(new MenuItem("Nakit Yonetimi", "/core/nakit-yonetimi.zul"));
        items.add(new MenuItem("Nakit Islem Giris", "/cash/nakit-islem-giris.zul"));
        items.add(new MenuItem("Yonetim Paneli", "/core/kullanicilar.zul"));
        items.add(new MenuItem("Meta Pozisyon Servisi", "/meta/meta-pozisyon-servisi.zul"));
        items.add(new MenuItem("Volatilite Raporu", null));
        items.add(new MenuItem("IDC Surecleri", null));
        items.add(new MenuItem("CRM", "/crm/toplu-mesaj-gonder.zul"));
        items.add(new MenuItem("Simulasyonlar", null));
        items.add(new MenuItem("Teminat Islemleri", "/collateral/teminat-transfer.zul"));
        items.add(new MenuItem("Teminat Onay Ekrani", "/collateral/teminat-onay.zul"));
        items.add(new MenuItem("Hisse Kotasyon Izleme", "/core/hisse-kotasyon.zul"));
        items.add(new MenuItem("Yeni Hisse Emir Yonetimi", "/risk/risk-parametreleri.zul"));
        items.add(new MenuItem("Hisse Grubu Tanimlama", "/risk/hisse-grubu-tanimlama.zul"));
        items.add(new MenuItem("Hesap/Hisse Bazinda Kontrol", "/risk/hesap-hisse-kontrol.zul"));
        items.add(new MenuItem("Hesap Durdurma Kurallari", null));
        items.add(new MenuItem("Piyasa Veri Yonetimi", "/core/piyasa-veri-yonetimi.zul"));
        items.add(new MenuItem("Is Bankasi", null));
        items.add(new MenuItem("Piyasa Veri Yonetimi (2)", "/core/piyasa-veri-yonetimi.zul"));
        items.add(new MenuItem("Kredi Islemleri", "/credit/kredi-optimizasyon.zul"));
        items.add(new MenuItem("Akilli Emir", null));
        items.add(new MenuItem("Raporlar", null));
        items.add(new MenuItem("Yurtdisi OMS", null));
        items.add(new MenuItem("Kurum Portfoy Islemleri", null));
        items.add(new MenuItem("NOMX", null));
        items.add(new MenuItem("Hisse Repo", null));
        items.add(new MenuItem("Kurum Fifo Mutabakati", null));
        items.add(new MenuItem("Colocation Circuit Breaker", null));
        items.add(new MenuItem("Arastirma", null));
        items.add(new MenuItem("Yasal Raporlamalar", null));
        items.add(new MenuItem("Eurobond Repo", null));
        items.add(new MenuItem("Rapor Yonetimi", "/report/rapor-tanimlari.zul"));
        items.add(new MenuItem("OTC", null));
        return items;
    }
}
