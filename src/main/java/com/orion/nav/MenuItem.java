package com.orion.nav;

import lombok.Getter;

import java.util.List;

/**
 * Sol menudeki her bir modulu temsil eder. `zulPath` dolu olanlar gercek
 * ekrana, bos olanlar "Yapim Asamasinda" placeholder ekranina yonlendirilir.
 * Bir alt-menu grubu icin (orn. Musteri Iletisim Panosu -> Bildirim
 * Izleme) `children` doldurulur; boyle bir item'in kendi `zulPath`'i de
 * olabilir (tiklaninca hem kendi ekranina gider hem alt menusunu acar).
 */
@Getter
public class MenuItem {

    private final String baslik;
    private final String zulPath;
    private final List<MenuItem> children;

    public MenuItem(String baslik, String zulPath) {
        this(baslik, zulPath, List.of());
    }

    public MenuItem(String baslik, String zulPath, List<MenuItem> children) {
        this.baslik = baslik;
        this.zulPath = zulPath;
        this.children = children == null ? List.of() : children;
    }

    public boolean isImplemented() {
        return zulPath != null && !zulPath.isBlank();
    }

    public boolean isHasChildren() {
        return !children.isEmpty();
    }
}
