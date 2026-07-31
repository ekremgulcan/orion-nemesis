package com.orion.cash.service;

import com.orion.cash.domain.CashTransactionRequest;
import com.orion.cash.repository.CashTransactionRequestRepository;
import com.orion.core.domain.Account;
import com.orion.core.domain.AccountBalance;
import com.orion.core.repository.AccountBalanceRepository;
import com.orion.core.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Nakit Yonetimi > Islem Giris" ekraninin arkasindaki is mantigi.
 */
@Service
public class CashTransactionService {

    private final CashTransactionRequestRepository requestRepository;
    private final AccountRepository accountRepository;
    private final AccountBalanceRepository accountBalanceRepository;

    public CashTransactionService(CashTransactionRequestRepository requestRepository,
                                   AccountRepository accountRepository,
                                   AccountBalanceRepository accountBalanceRepository) {
        this.requestRepository = requestRepository;
        this.accountRepository = accountRepository;
        this.accountBalanceRepository = accountBalanceRepository;
    }

    public List<CashTransactionRequest> getAll() {
        return requestRepository.findAllFetched();
    }

    @Transactional
    public CashTransactionRequest talepOlustur(String hesapNo, String talepKanali, String emirVeren,
                                                LocalDate valorTarihi, BigDecimal tutar, String paraBirimi,
                                                String islemYonu, String yontem, String iban,
                                                String karsiHesapNo, String iymBankaHesabi, String aciklama) {
        Account account = accountRepository.findByHesapNo(hesapNo);
        if (account == null) {
            throw new IllegalArgumentException("Hesap bulunamadi: " + hesapNo);
        }
        if (tutar == null || tutar.signum() <= 0) {
            throw new IllegalArgumentException("Tutar sifirdan buyuk olmalidir");
        }
        if ("IBAN".equals(yontem) && (iban == null || iban.isBlank())) {
            throw new IllegalArgumentException("IBAN yontemi icin IBAN alani zorunludur");
        }
        if ("HESAP".equals(yontem) && (karsiHesapNo == null || karsiHesapNo.isBlank())) {
            throw new IllegalArgumentException("HESAP yontemi icin Karsi Hesap No alani zorunludur");
        }

        CashTransactionRequest request = new CashTransactionRequest();
        request.setAccount(account);
        request.setTalepKanali(talepKanali);
        request.setEmirVeren(emirVeren);
        request.setValorTarihi(valorTarihi);
        request.setTutar(tutar);
        request.setParaBirimi(paraBirimi);
        request.setIslemYonu(islemYonu);
        request.setYontem(yontem);
        request.setIban(iban);
        request.setKarsiHesapNo(karsiHesapNo);
        request.setIymBankaHesabi(iymBankaHesabi);
        request.setDurum("BEKLEMEDE");
        request.setAciklama(aciklama);
        request.setOlusturmaTarihi(LocalDateTime.now());
        return requestRepository.save(request);
    }

    /**
     * Bekleyen bir nakit islem talebini onaylayip tamamlar. Talebin durumu
     * TAMAMLANDI'ya cekilir ve ilgili hesabin bakiyesi islem yonune gore
     * guncellenir (ODEME: bakiyeden dusulur, TAHSILAT: bakiyeye eklenir).
     * Sadece BEKLEMEDE durumundaki talepler onaylanabilir.
     */
    @Transactional
    public CashTransactionRequest onaylaVeTamamla(Long requestId) {
        CashTransactionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadi: " + requestId));

        if (!"BEKLEMEDE".equals(request.getDurum())) {
            throw new IllegalStateException("Sadece BEKLEMEDE durumundaki talepler onaylanabilir (mevcut durum: "
                    + request.getDurum() + ")");
        }

        Account account = request.getAccount();
        AccountBalance balance = accountBalanceRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new IllegalStateException("Hesap icin bakiye kaydi bulunamadi: " + account.getHesapNo()));

        BigDecimal tutar = request.getTutar();
        if ("ODEME".equals(request.getIslemYonu())) {
            BigDecimal kullanilabilirBakiye = balance.getBakiye().subtract(balance.getBlokeliBakiye());
            if (kullanilabilirBakiye.compareTo(tutar) < 0) {
                throw new IllegalStateException("Yetersiz bakiye: kullanilabilir " + kullanilabilirBakiye
                        + ", talep edilen " + tutar);
            }
            balance.setBakiye(balance.getBakiye().subtract(tutar));
        } else if ("TAHSILAT".equals(request.getIslemYonu())) {
            balance.setBakiye(balance.getBakiye().add(tutar));
        } else {
            throw new IllegalStateException("Bilinmeyen islem yonu: " + request.getIslemYonu());
        }
        balance.setGuncellemeTarihi(LocalDateTime.now());
        accountBalanceRepository.save(balance);

        request.setDurum("TAMAMLANDI");
        return requestRepository.save(request);
    }

    @Transactional
    public CashTransactionRequest reddet(Long requestId) {
        CashTransactionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Talep bulunamadi: " + requestId));
        if (!"BEKLEMEDE".equals(request.getDurum())) {
            throw new IllegalStateException("Sadece BEKLEMEDE durumundaki talepler reddedilebilir (mevcut durum: "
                    + request.getDurum() + ")");
        }
        request.setDurum("REDDEDILDI");
        return requestRepository.save(request);
    }
}
