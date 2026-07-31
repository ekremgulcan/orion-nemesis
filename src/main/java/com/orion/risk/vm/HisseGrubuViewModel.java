package com.orion.risk.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Instrument;
import com.orion.risk.domain.InstrumentGroup;
import com.orion.risk.service.RiskProfileService;
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
 * "Hisse Grubu Tanimlama" ekrani icin ViewModel. Arama ve
 * Ekle/Duzenle/Sil islemlerini barindirir.
 */
public class HisseGrubuViewModel {

    private final RiskProfileService riskProfileService = SpringContextHolder.getBean(RiskProfileService.class);

    private List<InstrumentGroup> gruplar;
    private List<Instrument> tumEnstrumanlar;
    private String aramaMetni;

    private Long duzenlenenId;
    private String grupKodu;
    private String aciklama;
    private boolean aktif = true;
    private Set<Instrument> secilenEnstrumanlar = new HashSet<>();

    @Init
    public void init() {
        gruplar = riskProfileService.getInstrumentGroups();
        tumEnstrumanlar = riskProfileService.getAllInstruments();
    }

    public List<InstrumentGroup> getGruplar() {
        return gruplar;
    }

    public List<Instrument> getTumEnstrumanlar() {
        return tumEnstrumanlar;
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

    public String getGrupKodu() {
        return grupKodu;
    }

    public void setGrupKodu(String grupKodu) {
        this.grupKodu = grupKodu;
    }

    public String getAciklama() {
        return aciklama;
    }

    public void setAciklama(String aciklama) {
        this.aciklama = aciklama;
    }

    public boolean isAktif() {
        return aktif;
    }

    public void setAktif(boolean aktif) {
        this.aktif = aktif;
    }

    public Set<Instrument> getSecilenEnstrumanlar() {
        return secilenEnstrumanlar;
    }

    public void setSecilenEnstrumanlar(Set<Instrument> secilenEnstrumanlar) {
        this.secilenEnstrumanlar = secilenEnstrumanlar;
    }

    @Command
    @NotifyChange("gruplar")
    public void ara() {
        gruplar = riskProfileService.searchInstrumentGroups(aramaMetni);
    }

    @Command
    @NotifyChange({"grupKodu", "aciklama", "aktif", "secilenEnstrumanlar", "duzenlenenId"})
    public void yeniGrup() {
        temizle();
    }

    @Command
    @NotifyChange({"grupKodu", "aciklama", "aktif", "secilenEnstrumanlar", "duzenlenenId"})
    public void duzenle(@BindingParam("item") InstrumentGroup item) {
        duzenlenenId = item.getId();
        grupKodu = item.getGrupKodu();
        aciklama = item.getAciklama();
        aktif = item.isAktif();
        secilenEnstrumanlar = new HashSet<>(item.getUyeler());
    }

    @Command
    @NotifyChange({"gruplar", "grupKodu", "aciklama", "aktif", "secilenEnstrumanlar", "duzenlenenId"})
    public void kaydet() {
        Set<Long> instrumentIds = secilenEnstrumanlar.stream().map(Instrument::getId).collect(Collectors.toSet());
        try {
            riskProfileService.kaydetInstrumentGroup(duzenlenenId, grupKodu, aciklama, aktif, instrumentIds);
        } catch (IllegalArgumentException ex) {
            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        temizle();
        gruplar = riskProfileService.searchInstrumentGroups(aramaMetni);
        Messagebox.show("Grup kaydedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
    }

    @Command
    @NotifyChange("gruplar")
    public void sil(@BindingParam("item") InstrumentGroup item) {
        Messagebox.show("Grup silinsin mi: " + item.getGrupKodu() + "?",
                "Onay", Messagebox.YES | Messagebox.NO, Messagebox.QUESTION,
                event -> {
                    if (Messagebox.ON_YES.equals(event.getName())) {
                        try {
                            riskProfileService.silInstrumentGroup(item.getId());
                            gruplar = riskProfileService.searchInstrumentGroups(aramaMetni);
                            BindUtils.postNotifyChange(null, null, this, "gruplar");
                        } catch (IllegalStateException ex) {
                            Messagebox.show(ex.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
                        }
                    }
                });
    }

    private void temizle() {
        duzenlenenId = null;
        grupKodu = null;
        aciklama = null;
        aktif = true;
        secilenEnstrumanlar = new HashSet<>();
    }
}
