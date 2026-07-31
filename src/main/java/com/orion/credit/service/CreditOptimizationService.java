package com.orion.credit.service;

import com.orion.core.domain.User;
import com.orion.core.repository.UserRepository;
import com.orion.credit.domain.CreditAccount;
import com.orion.credit.domain.CreditOptimizationResult;
import com.orion.credit.domain.CreditOptimizationRun;
import com.orion.credit.repository.CreditAccountRepository;
import com.orion.credit.repository.CreditOptimizationResultRepository;
import com.orion.credit.repository.CreditOptimizationRunRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani" ekraninin arkasindaki
 * is mantigi. Ekrandaki "Gunbasi/Gunici Islemlerini Baslat ve Listeyi Getir"
 * butonlari bu servisin startRun metodunu cagirir.
 */
@Service
public class CreditOptimizationService {

    private final CreditAccountRepository creditAccountRepository;
    private final CreditOptimizationRunRepository runRepository;
    private final CreditOptimizationResultRepository resultRepository;
    private final UserRepository userRepository;

    public CreditOptimizationService(CreditAccountRepository creditAccountRepository,
                                      CreditOptimizationRunRepository runRepository,
                                      CreditOptimizationResultRepository resultRepository,
                                      UserRepository userRepository) {
        this.creditAccountRepository = creditAccountRepository;
        this.runRepository = runRepository;
        this.resultRepository = resultRepository;
        this.userRepository = userRepository;
    }

    /**
     * Ekrandaki "Ozkaynak Orani" kutusuna girilen hedef orana gore, tum kredi
     * hesaplarini tarayip her biri icin mevcut/yeni ozkaynak oranini hesaplar
     * ve UYGUN / UYGUN_DEGIL olarak siniflandirir.
     *
     * @param gunTipi          GUNBASI ya da GUNICI
     * @param hedefOzkaynakOrani kullanicinin girdigi hedef oran (orn. 35.0)
     * @param kullaniciAdi     islemi baslatan kullanici
     * @return olusturulan run kaydi
     */
    @Transactional
    public CreditOptimizationRun startRun(String gunTipi, BigDecimal hedefOzkaynakOrani, String kullaniciAdi) {
        if (hedefOzkaynakOrani == null || hedefOzkaynakOrani.signum() < 0
                || hedefOzkaynakOrani.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Ozkaynak orani 0 ile 100 arasinda olmalidir");
        }
        User kullanici = userRepository.findByKullaniciAdi(kullaniciAdi);

        CreditOptimizationRun run = new CreditOptimizationRun();
        run.setCalistiranKullanici(kullanici);
        run.setGunTipi(gunTipi);
        run.setHedefOzkaynakOrani(hedefOzkaynakOrani);
        run.setCalismaTarihi(LocalDateTime.now());
        run = runRepository.save(run);

        List<CreditAccount> creditAccounts = creditAccountRepository.findAll();
        for (CreditAccount ca : creditAccounts) {
            BigDecimal serbest = ca.getSerbestBakiye();
            BigDecimal kredi = ca.getKrediBakiyesi();
            BigDecimal toplam = serbest.add(kredi);

            BigDecimal mevcutOran = toplam.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : serbest.multiply(BigDecimal.valueOf(100))
                        .divide(toplam, 2, RoundingMode.HALF_UP);

            String durum = mevcutOran.compareTo(hedefOzkaynakOrani) >= 0 ? "UYGUN" : "UYGUN_DEGIL";

            CreditOptimizationResult result = new CreditOptimizationResult();
            result.setRun(run);
            result.setAccount(ca.getAccount());
            result.setSerbestBakiye(serbest);
            result.setMevcutOzkaynakOrani(mevcutOran);
            result.setYeniOzkaynakOrani(hedefOzkaynakOrani);
            result.setDurum(durum);
            result.setKomposizyon(String.format(
                    "{\"nakit\":%s,\"kredi\":%s}", serbest.toPlainString(), kredi.toPlainString()));

            resultRepository.save(result);
        }

        return run;
    }

    public List<CreditOptimizationResult> getUygunSonuclar(Long runId) {
        return resultRepository.findByRunIdAndDurum(runId, "UYGUN");
    }

    public List<CreditOptimizationResult> getUygunDegilSonuclar(Long runId) {
        return resultRepository.findByRunIdAndDurum(runId, "UYGUN_DEGIL");
    }

    /**
     * Ekrandaki "Secilenler icin Surec Baslat" butonu tarafindan cagirilir.
     * Verilen run'daki UYGUN_DEGIL ve henuz uygulanmamis tum sonuclar icin,
     * ilgili kredi hesabinin kredi_bakiyesi'ni hedef ozkaynak oranina
     * ulasacak sekilde otomatik olarak duser (serbest_bakiye sabit kalir):
     *
     *   yeni_kredi_bakiyesi = serbest_bakiye * (100 - hedef_oran) / hedef_oran
     *
     * Hesaplanan yeni bakiye mevcut bakiyeden yuksekse (yani zaten hedefin
     * uzerindeyse) hicbir sey yapilmaz, sadece sonuc "uygulandi" olarak
     * isaretlenir. Hedef oran 0 olamaz (formul tanimsizlasir), bu durum
     * zaten ekran tarafinda 0-100 araligiyla sinirlanmis olsa da burada da
     * korunur.
     *
     * @return islem uygulanan sonuc sayisi
     */
    @Transactional
    public int surecBaslat(Long runId) {
        List<CreditOptimizationResult> uygunDegiller = resultRepository.findByRunIdAndDurum(runId, "UYGUN_DEGIL");
        int uygulananSayisi = 0;

        for (CreditOptimizationResult result : uygunDegiller) {
            if (result.isUygulandi()) {
                continue;
            }
            BigDecimal hedefOran = result.getYeniOzkaynakOrani();
            if (hedefOran == null || hedefOran.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            CreditAccount ca = creditAccountRepository.findByAccountId(result.getAccount().getId());
            if (ca == null) {
                continue;
            }

            BigDecimal serbest = ca.getSerbestBakiye();
            BigDecimal yeniKredi = serbest
                    .multiply(BigDecimal.valueOf(100).subtract(hedefOran))
                    .divide(hedefOran, 2, RoundingMode.HALF_UP);
            if (yeniKredi.signum() < 0) {
                yeniKredi = BigDecimal.ZERO;
            }

            if (yeniKredi.compareTo(ca.getKrediBakiyesi()) < 0) {
                ca.setKrediBakiyesi(yeniKredi);
                ca.setGuncellemeTarihi(LocalDateTime.now());
                creditAccountRepository.save(ca);
            }

            result.setUygulandi(true);
            result.setUygulamaTarihi(LocalDateTime.now());
            resultRepository.save(result);
            uygulananSayisi++;
        }

        return uygulananSayisi;
    }
}
