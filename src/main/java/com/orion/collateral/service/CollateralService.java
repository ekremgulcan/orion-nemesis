package com.orion.collateral.service;

import com.orion.collateral.domain.Collateral;
import com.orion.collateral.domain.CollateralTransfer;
import com.orion.collateral.repository.CollateralRepository;
import com.orion.collateral.repository.CollateralTransferRepository;
import com.orion.core.domain.Account;
import com.orion.core.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Teminat Transfer" ve "Teminat Onay Ekrani" ekranlarinin arkasindaki is
 * mantigi. Depo kalemlerini listeler, transfer taleplerini olusturur ve
 * onay/iptal/revizyon/havuz aksiyonlarini uygular.
 */
@Service
public class CollateralService {

    private final CollateralRepository collateralRepository;
    private final CollateralTransferRepository transferRepository;
    private final AccountRepository accountRepository;

    public CollateralService(CollateralRepository collateralRepository,
                              CollateralTransferRepository transferRepository,
                              AccountRepository accountRepository) {
        this.collateralRepository = collateralRepository;
        this.transferRepository = transferRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * Serbest Depo / Teminat Deposu arasinda yeni bir virman talebi
     * olusturur. Hesap bulunamazsa veya kaynak/hedef depo ayniysa
     * IllegalArgumentException firlatir (TeminatTransferViewModel.talepOlustur
     * ile birebir ayni kural ve mesajlar - ZK ekrani da bu metodu cagirir).
     */
    @Transactional
    public CollateralTransfer talepOlustur(String hesapNo, String piyasa, String saklamaci,
                                            String teminatTipi, String kaynakDepo, String hedefDepo,
                                            String paraBirimi, BigDecimal miktar, String aciklama) {
        Account account = accountRepository.findByHesapNo(hesapNo);
        if (account == null) {
            throw new IllegalArgumentException("Hesap bulunamadi: " + hesapNo);
        }
        if (kaynakDepo.equals(hedefDepo)) {
            throw new IllegalArgumentException("Kaynak ve hedef depo ayni olamaz");
        }

        CollateralTransfer transfer = new CollateralTransfer();
        transfer.setAccount(account);
        transfer.setPiyasa(piyasa);
        transfer.setSaklamaci(saklamaci);
        transfer.setTeminatTipi(teminatTipi);
        transfer.setKaynakDepo(kaynakDepo);
        transfer.setHedefDepo(hedefDepo);
        transfer.setParaBirimi(paraBirimi);
        transfer.setMiktar(miktar == null ? BigDecimal.ZERO : miktar);
        transfer.setDosyaliMi(false);
        transfer.setDurum("BEKLEMEDE");
        transfer.setTalepTarihi(LocalDateTime.now());
        transfer.setAciklama(aciklama);
        return transferRepository.save(transfer);
    }

    public List<Collateral> getAllCollaterals() {
        return collateralRepository.findAllFetched();
    }

    public List<Collateral> searchCollaterals(String q) {
        if (q == null || q.isBlank()) {
            return getAllCollaterals();
        }
        return collateralRepository.search(q.trim());
    }

    public List<CollateralTransfer> getAllTransfers() {
        return transferRepository.findAllFetched();
    }

    public List<CollateralTransfer> getTransfersByDurum(String durum) {
        return transferRepository.findByDurum(durum);
    }

    /**
     * Bekleyen bir teminat transfer talebini onaylayip tamamlar. Talebin
     * durumu TAMAMLANDI'ya cekilir ve kaynak depodaki ilgili varlik kalemi
     * dusulup hedef depoya eklenir (gercek serbest depo <-> teminat deposu
     * virmani). Sadece BEKLEMEDE durumundaki talepler onaylanabilir.
     */
    @Transactional
    public void onayla(Long transferId, Long onaylayanKullaniciId) {
        CollateralTransfer transfer = transferRepository.findById(transferId).orElseThrow();

        if (!"BEKLEMEDE".equals(transfer.getDurum())) {
            throw new IllegalStateException("Sadece BEKLEMEDE durumundaki talepler onaylanabilir (mevcut durum: "
                    + transfer.getDurum() + ")");
        }

        String varlikTipi = teminatTipindenVarlikTipineCevir(transfer.getTeminatTipi(), transfer.getParaBirimi());
        Long instrumentId = transfer.getInstrument() != null ? transfer.getInstrument().getId() : null;
        BigDecimal miktar = transfer.getMiktar();

        List<Collateral> kaynakKalemler = collateralRepository.findMatching(
                transfer.getAccount().getId(), transfer.getKaynakDepo(), varlikTipi, instrumentId, transfer.getParaBirimi());
        if (kaynakKalemler.isEmpty()) {
            throw new IllegalStateException("Kaynak depoda eslesen varlik kalemi bulunamadi (hesap: "
                    + transfer.getAccount().getHesapNo() + ", depo: " + transfer.getKaynakDepo()
                    + ", varlik: " + varlikTipi + ")");
        }
        Collateral kaynak = kaynakKalemler.get(0);
        if (kaynak.getMiktar().compareTo(miktar) < 0) {
            throw new IllegalStateException("Kaynak depoda yetersiz miktar: mevcut " + kaynak.getMiktar()
                    + ", talep edilen " + miktar);
        }
        kaynak.setMiktar(kaynak.getMiktar().subtract(miktar));
        kaynak.setGuncellemeTarihi(LocalDateTime.now());
        collateralRepository.save(kaynak);

        List<Collateral> hedefKalemler = collateralRepository.findMatching(
                transfer.getAccount().getId(), transfer.getHedefDepo(), varlikTipi, instrumentId, transfer.getParaBirimi());
        Collateral hedef;
        if (hedefKalemler.isEmpty()) {
            hedef = new Collateral();
            hedef.setAccount(transfer.getAccount());
            hedef.setDepoTipi(transfer.getHedefDepo());
            hedef.setVarlikTipi(varlikTipi);
            hedef.setInstrument(transfer.getInstrument());
            hedef.setParaBirimi(transfer.getParaBirimi());
            hedef.setMiktar(miktar);
        } else {
            hedef = hedefKalemler.get(0);
            hedef.setMiktar(hedef.getMiktar().add(miktar));
        }
        hedef.setGuncellemeTarihi(LocalDateTime.now());
        collateralRepository.save(hedef);

        transfer.setDurum("TAMAMLANDI");
        transfer.setOnayTarihi(LocalDateTime.now());
        transferRepository.save(transfer);
    }

    private String teminatTipindenVarlikTipineCevir(String teminatTipi, String paraBirimi) {
        if ("NAKIT_DOVIZ".equals(teminatTipi)) {
            return (paraBirimi == null || "TRY".equals(paraBirimi)) ? "NAKIT" : "DOVIZ";
        }
        return teminatTipi; // PAY_SENEDI / BORCLANMA_ARACI / FON ayni isimle esleniyor
    }

    @Transactional
    public void iptalEt(Long transferId) {
        CollateralTransfer transfer = transferRepository.findById(transferId).orElseThrow();
        transfer.setDurum("IPTAL");
        transferRepository.save(transfer);
    }

    @Transactional
    public void revizyonaGonder(Long transferId) {
        CollateralTransfer transfer = transferRepository.findById(transferId).orElseThrow();
        transfer.setDurum("REVIZYONDA");
        transferRepository.save(transfer);
    }

    @Transactional
    public void havuzaGonder(Long transferId) {
        CollateralTransfer transfer = transferRepository.findById(transferId).orElseThrow();
        transfer.setDurum("HAVUZDA");
        transferRepository.save(transfer);
    }
}
