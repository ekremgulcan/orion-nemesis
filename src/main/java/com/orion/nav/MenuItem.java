package com.orion.nav;

import lombok.Getter;

/**
 * Sol menudeki her bir modulu temsil eder. `zulPath` dolu olanlar gercek
 * ekrana, bos olanlar "Yapim Asamasinda" placeholder ekranina yonlendirilir.
 */
@Getter
public class MenuItem {

    private final String baslik;
    private final String zulPath;

    public MenuItem(String baslik, String zulPath) {
        this.baslik = baslik;
        this.zulPath = zulPath;
    }

    public boolean isImplemented() {
        return zulPath != null && !zulPath.isBlank();
    }
}
