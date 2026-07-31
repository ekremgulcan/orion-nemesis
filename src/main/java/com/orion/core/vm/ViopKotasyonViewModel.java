package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Instrument;
import com.orion.core.repository.InstrumentRepository;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

import java.util.List;

/**
 * "VIOP Kotasyon Izleme" (viop-kotasyon.zul) icin ViewModel. Gercek zamanli
 * fiyat akisi Faz 4+ kapsamindadir; simdilik statik VIOP enstruman
 * listesini arama destekli gosterir (salt-okunur izleme ekrani, CRUD
 * mastere veri yonetimi "Piyasa Veri Yonetimi" ekraninda yapilir).
 */
public class ViopKotasyonViewModel {

    private final InstrumentRepository instrumentRepository =
            SpringContextHolder.getBean(InstrumentRepository.class);

    private List<Instrument> viopSozlesmeleri;
    private String aramaMetni;

    @Init
    public void init() {
        viopSozlesmeleri = instrumentRepository.findByTip("VIOP");
    }

    public List<Instrument> getViopSozlesmeleri() {
        return viopSozlesmeleri;
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    @Command
    @NotifyChange("viopSozlesmeleri")
    public void ara() {
        viopSozlesmeleri = (aramaMetni == null || aramaMetni.isBlank())
                ? instrumentRepository.findByTip("VIOP")
                : instrumentRepository.searchByTip("VIOP", aramaMetni.trim());
    }
}
