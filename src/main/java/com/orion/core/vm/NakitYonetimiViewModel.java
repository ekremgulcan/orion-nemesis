package com.orion.core.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.core.domain.AccountBalance;
import com.orion.core.repository.AccountBalanceRepository;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

import java.util.List;

/**
 * "Nakit Yonetimi" (nakit-yonetimi.zul) icin ViewModel. Hesap bazli
 * bakiye/blokeli bakiye durumunu arama destekli salt-okunur listeler
 * (bakiyeler islemlerden turetildigi icin manuel CRUD burada
 * yapilmamaktadir). Para giris/cikis "Nakit Yonetimi > Islem Giris"
 * ekraninda talep olarak olusturulur; talep "Onayla ve Tamamla" ile
 * onaylandiginda buradaki bakiye otomatik guncellenir (bkz.
 * CashTransactionService#onaylaVeTamamla). Gercek banka/IYM
 * entegrasyonu ve virman islemleri hala Faz 4+ kapsamindadir.
 */
public class NakitYonetimiViewModel {

    private final AccountBalanceRepository accountBalanceRepository =
            SpringContextHolder.getBean(AccountBalanceRepository.class);

    private List<AccountBalance> bakiyeler;
    private String aramaMetni;

    @Init
    public void init() {
        bakiyeler = accountBalanceRepository.findAllFetched();
    }

    public List<AccountBalance> getBakiyeler() {
        return bakiyeler;
    }

    public String getAramaMetni() {
        return aramaMetni;
    }

    public void setAramaMetni(String aramaMetni) {
        this.aramaMetni = aramaMetni;
    }

    @Command
    @NotifyChange("bakiyeler")
    public void ara() {
        bakiyeler = (aramaMetni == null || aramaMetni.isBlank())
                ? accountBalanceRepository.findAllFetched()
                : accountBalanceRepository.search(aramaMetni.trim());
    }
}
