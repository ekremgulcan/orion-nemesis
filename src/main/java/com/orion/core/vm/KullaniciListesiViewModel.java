package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Role;
import com.orion.core.domain.User;
import com.orion.core.service.UserService;
import org.zkoss.bind.BindUtils;
import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zul.Messagebox;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * "Yonetim Paneli" (kullanicilar.zul) icin ViewModel. Arama ve
 * Ekle/Duzenle/Sil islemlerini, rol atamasini barindirir.
 */
public class KullaniciListesiViewModel {

    private final UserService userService =
            SpringContextHolder.getBean(UserService.class);

    private List<User> kullanicilar;
    private List<Role> tumRoller;
    private String aramaMetni;

    private Long duzenlenenId;
    private String kullaniciAdi;
    private String adSoyad;
    private String email;
    private boolean aktif = true;
    private Set<Role> secilenRoller = new HashSet<>();

    @Init
    public void init() {
        kullanicilar = userService.getAll();
        tumRoller = userService.getAllRoles();
    }

    public List<User> getKullanicilar() {
        return kullanicilar;
    }

    public List<Role> getTumRoller() {
        return tumRoller;
    }

    public String rolleriGetir(User user) {
        return user.getRoller().stream()
                .map(Role::getRolAdi)
                .collect(Collectors.joining(", "));
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    public Long getDuzenlenenId() {
        return duzenlenenId;
    }

    public String getKullaniciAdi() {
        return kullaniciAdi;
    }

    public void setKullaniciAdi(String kullaniciAdi) {
        this.kullaniciAdi = kullaniciAdi;
    }

    public String getAdSoyad() {
        return adSoyad;
    }

    public void setAdSoyad(String adSoyad) {
        this.adSoyad = adSoyad;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isAktif() {
        return aktif;
    }

    public void setAktif(boolean aktif) {
        this.aktif = aktif;
    }

    public Set<Role> getSecilenRoller() {
        return secilenRoller;
    }

    public void setSecilenRoller(Set<Role> secilenRoller) {
        this.secilenRoller = secilenRoller;
    }

    @Command
    @NotifyChange("kullanicilar")
    public void ara() {
        kullanicilar = userService.search(aramaMetni);
    }

    @Command
    @NotifyChange({"kullaniciAdi", "adSoyad", "email", "aktif", "secilenRoller", "duzenlenenId"})
    public void yeniKullanici() {
        temizle();
    }

    @Command
    @NotifyChange({"kullaniciAdi", "adSoyad", "email", "aktif", "secilenRoller", "duzenlenenId"})
    public void duzenle(@BindingParam("item") User item) {
        duzenlenenId = item.getId();
        kullaniciAdi = item.getKullaniciAdi();
        adSoyad = item.getAdSoyad();
        email = item.getEmail();
        aktif = item.isAktif();
        secilenRoller = new HashSet<>(item.getRoller());
    }

    @Command
    @NotifyChange({"kullanicilar", "kullaniciAdi", "adSoyad", "email", "aktif", "secilenRoller", "duzenlenenId"})
    public void kaydet() {
        Set<Long> rolIds = secilenRoller.stream().map(Role::getId).collect(Collectors.toSet());
        try {
            userService.kaydet(duzenlenenId, kullaniciAdi, adSoyad, email, aktif, rolIds);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        kullanicilar = userService.search(aramaMetni);
        Messagebox.show("Kullanici kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("kullanicilar")
    public void sil(@BindingParam("item") User item) {
        Messagebox.show("Kullanici silinsin mi: " + item.getAdSoyad() + " (" + item.getKullaniciAdi() + ")?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            userService.sil(item.getId());
                            kullanicilar = userService.search(aramaMetni);
                            BindUtils.postNotifyChange(null, null, this, "kullanicilar");
                        } catch (IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        kullaniciAdi = null;
        adSoyad = null;
        email = null;
        aktif = true;
        secilenRoller = new HashSet<>();
    }
}
