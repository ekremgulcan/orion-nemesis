package com.orion.nav;

import com.orion.core.config.SpringContextHolder;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

import java.util.ArrayList;
import java.util.List;

/**
 * Ana sayfa (index.zul) icin ViewModel. Sol menuyu besler; sidebar sürekli
 * görünür kalir, tiklanan her modul (zaten acik degilse) yeni bir sekme
 * olarak acilir (VSCode tarzi cok sekmeli navigasyon). Sekme sayisi
 * sinirsizdir, her sekme kapatilabilir (Ana Sayfa haric).
 */
public class IndexViewModel {

    private static final String HOME_BASLIK = "Ana Sayfa";
    private static final String HOME_ZUL = "/workflow/gorev-listesi.zul";

    private final MenuRegistry menuRegistry = SpringContextHolder.getBean(MenuRegistry.class);

    private List<MenuItem> menuItems;
    private List<OpenTab> openTabs;
    private OpenTab selectedTab;

    @Init
    public void init() {
        menuItems = menuRegistry.getMenuItems();
        openTabs = new ArrayList<>();
        selectedTab = new OpenTab(HOME_BASLIK, HOME_ZUL, false);
        openTabs.add(selectedTab);
    }

    public List<MenuItem> getMenuItems() {
        return menuItems;
    }

    public List<OpenTab> getOpenTabs() {
        return openTabs;
    }

    public OpenTab getSelectedTab() {
        return selectedTab;
    }

    /**
     * Sidebar'dan bir modul tiklandiginda cagrilir. Modul zaten acik bir
     * sekme olarak varsa o sekmeye gecilir, yoksa yeni sekme eklenir.
     */
    @Command
    @NotifyChange({"openTabs", "selectedTab"})
    public void selectMenu(@BindingParam("item") MenuItem item) {
        String zulPath = item.isImplemented() ? item.getZulPath() : "/placeholder.zul";
        String baslik = item.getBaslik();

        OpenTab existing = findTab(zulPath, baslik);
        if (existing != null) {
            selectedTab = existing;
            return;
        }

        OpenTab yeni = new OpenTab(baslik, zulPath, true);
        openTabs.add(yeni);
        selectedTab = yeni;
    }

    @Command
    @NotifyChange({"openTabs", "selectedTab"})
    public void goHome() {
        OpenTab existing = findTab(HOME_ZUL, HOME_BASLIK);
        if (existing != null) {
            selectedTab = existing;
        } else {
            OpenTab home = new OpenTab(HOME_BASLIK, HOME_ZUL, false);
            openTabs.add(0, home);
            selectedTab = home;
        }
    }

    @Command
    @NotifyChange("selectedTab")
    public void selectTab(@BindingParam("tab") OpenTab tab) {
        selectedTab = tab;
    }

    @Command
    @NotifyChange({"openTabs", "selectedTab"})
    public void closeTab(@BindingParam("tab") OpenTab tab) {
        int index = openTabs.indexOf(tab);
        if (index < 0 || !tab.isClosable()) {
            return;
        }
        openTabs.remove(index);
        if (selectedTab == tab) {
            int newIndex = Math.max(0, index - 1);
            selectedTab = openTabs.isEmpty() ? null : openTabs.get(Math.min(newIndex, openTabs.size() - 1));
        }
    }

    private OpenTab findTab(String zulPath, String baslik) {
        for (OpenTab tab : openTabs) {
            if (tab.getZulPath().equals(zulPath) && tab.getBaslik().equals(baslik)) {
                return tab;
            }
        }
        return null;
    }
}
