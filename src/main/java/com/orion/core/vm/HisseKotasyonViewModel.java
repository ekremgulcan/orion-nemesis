package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.Instrument;
import com.orion.core.repository.InstrumentRepository;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

import java.util.List;

/**
 * "Hisse Kotasyon Izleme" (hisse-kotasyon.zul) icin ViewModel. Gercek
 * zamanli fiyat akisi Faz 4+ kapsamindadir; simdilik statik enstruman
 * listesini arama destekli gosterir (salt-okunur izleme ekrani, CRUD
 * master veri yonetimi "Piyasa Veri Yonetimi" ekraninda yapilir).
 */
public class HisseKotasyonViewModel {

    private final InstrumentRepository instrumentRepository =
            SpringContextHolder.getBean(InstrumentRepository.class);

    private List<Instrument> hisseler;
    private String aramaMetni;

    @Init
    public void init() {
        hisseler = instrumentRepository.findByTip("HISSE");
    }

    public List<Instrument> getHisseler() {
        return hisseler;
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    @Command
    @NotifyChange("hisseler")
    public void ara() {
        hisseler = (aramaMetni == null || aramaMetni.isBlank())
                ? instrumentRepository.findByTip("HISSE")
                : instrumentRepository.searchByTip("HISSE", aramaMetni.trim());
    }
}
