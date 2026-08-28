package com.orion.nav;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.User;
import com.orion.core.repository.UserRepository;
import com.orion.core.service.AktifKullaniciServisi;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Ana sayfa (index.zul) icin ViewModel. Sol menuyu besler; sidebar sürekli
 * görünür kalir, tiklanan her modul (zaten acik degilse) yeni bir sekme
 * olarak acilir (VSCode tarzi cok sekmeli navigasyon). Sekme sayisi
 * sinirsizdir, her sekme kapatilabilir (Ana Sayfa haric).
 *
 * Alt menusu olan (MenuItem.children dolu) ogeler icin genisletme/daraltma
 * durumu `expandedMenus` (baslik bazinda) ile tutulur ve `getMenuRows()`
 * bu agaci her cagrida duz bir satir listesine cozer - bkz. MenuRow.
 */
public class IndexViewModel {

    private static final String HOME_BASLIK = "Ana Sayfa";
    private static final String HOME_ZUL = "/workflow/gorev-listesi.zul";

    private final MenuRegistry menuRegistry = SpringContextHolder.getBean(MenuRegistry.class);
    private final UserRepository userRepository = SpringContextHolder.getBean(UserRepository.class);
    private final AktifKullaniciServisi aktifKullaniciServisi =
            SpringContextHolder.getBean(AktifKullaniciServisi.class);

    private List<MenuItem> menuItems;
    private final Set<String> expandedMenus = new HashSet<>();
    private List<OpenTab> openTabs;
    private OpenTab selectedTab;
    private List<User> kullaniciSecenekleri;
    private String aktifKullaniciAdi;

    @Init
    public void init() {
        menuItems = menuRegistry.getMenuItems();
        openTabs = new ArrayList<>();
        selectedTab = new OpenTab(HOME_BASLIK, HOME_ZUL, false);
        openTabs.add(selectedTab);
        kullaniciSecenekleri = userRepository.findAllFetched();
        aktifKullaniciAdi = aktifKullaniciServisi.getAktifKullaniciAdi();
    }

    public List<User> getKullaniciSecenekleri() {
        return kullaniciSecenekleri;
    }

    public String getAktifKullaniciAdi() {
        return aktifKullaniciAdi;
    }

    /**
     * Ust bar'daki aktif kullanici secicisinden cagrilir. Gercek bir
     * oturum olmadigi icin degisiklik surec genelinde AktifKullaniciServisi
     * uzerinden tutulur (bkz. o sinifin javadoc'u). Kullanici degisince
     * "Ana Sayfa" (gorev-listesi.zul) sekmesi, yeni kullanicinin gorevlerini
     * gostermesi icin yeniden acilir.
     */
    @Command
    @NotifyChange({"aktifKullaniciAdi", "openTabs", "selectedTab"})
    public void kullaniciDegistir(@BindingParam("kullaniciAdi") String kullaniciAdi) {
        aktifKullaniciServisi.setAktifKullanici(kullaniciAdi);
        aktifKullaniciAdi = kullaniciAdi;

        OpenTab eskiHome = findTab(HOME_ZUL, HOME_BASLIK);
        if (eskiHome != null) {
            int index = openTabs.indexOf(eskiHome);
            openTabs.remove(index);
            OpenTab yeniHome = new OpenTab(HOME_BASLIK, HOME_ZUL, false);
            openTabs.add(index, yeniHome);
            if (selectedTab == eskiHome) {
                selectedTab = yeniHome;
            }
        }
    }

    public List<MenuItem> getMenuItems() {
        return menuItems;
    }

    public List<MenuRow> getMenuRows() {
        List<MenuRow> rows = new ArrayList<>();
        for (MenuItem item : menuItems) {
            boolean expanded = expandedMenus.contains(item.getBaslik());
            rows.add(new MenuRow(item, false, expanded));
            if (item.isHasChildren() && expanded) {
                for (MenuItem child : item.getChildren()) {
                    rows.add(new MenuRow(child, true, false));
                }
            }
        }
        return rows;
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
     * Alt menusu olan bir ust-oge tiklandiginda, satirin tamami tek bir
     * tiklama hedefi oldugundan (bkz. index.zul yorumu), ayni tiklama
     * navigasyonla birlikte alt menuyu de acar/kapatir (toggle).
     */
    @Command
    @NotifyChange({"openTabs", "selectedTab", "menuRows"})
    public void selectMenu(@BindingParam("item") MenuItem item) {
        if (item.isHasChildren()) {
            String key = item.getBaslik();
            if (!expandedMenus.remove(key)) {
                expandedMenus.add(key);
            }
        }
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
