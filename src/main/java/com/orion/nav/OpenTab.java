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
    private final Long incelemeProcessId;

    public OpenTab(String baslik, String zulPath, boolean closable, Long incelemeProcessId) {
        this.baslik = baslik;
        this.zulPath = zulPath;
        this.closable = closable;
        this.incelemeProcessId = incelemeProcessId;
    }

    public String getFullZulPath() {
        if (incelemeProcessId != null) {
            return zulPath + "?incelemeProcessId=" + incelemeProcessId;
        }
        return zulPath;
    }
}
