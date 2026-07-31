package com.orion.nav;

import lombok.Getter;

/**
 * Ana sayfada (index.zul) o an acik olan bir sekmeyi temsil eder. Sidebar'dan
 * tiklanan her modul, zaten acik degilse yeni bir OpenTab olarak eklenir.
 * "Ana Sayfa" sekmesi kapatilamaz (closable=false), digerleri kapatilabilir.
 */
@Getter
public class OpenTab {

    private final String baslik;
    private final String zulPath;
    private final boolean closable;

    public OpenTab(String baslik, String zulPath, boolean closable) {
        this.baslik = baslik;
        this.zulPath = zulPath;
        this.closable = closable;
    }
}
