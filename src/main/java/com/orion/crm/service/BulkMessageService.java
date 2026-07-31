package com.orion.crm.service;

import com.orion.core.domain.Account;
import com.orion.core.repository.AccountRepository;
import com.orion.crm.domain.Campaign;
import com.orion.crm.domain.CampaignTarget;
import com.orion.crm.domain.Message;
import com.orion.crm.repository.CampaignTargetRepository;
import com.orion.crm.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * "Toplu Mesaj Gonder" ekraninin arkasindaki is mantigi. Alici grubuna
 * (Hepsi/Onaylayanlar/Onaylamayanlar/Aksiyon Almayanlar/Belirli Hesaplar)
 * gore hedef hesap listesini cikarir ve her biri icin bir Message kaydi
 * olusturur. Gercek SMS/Email saglayicisina baglanmadan, gonderimi
 * DB'ye "GONDERILDI" olarak yazarak simule eder.
 *
 * Validasyon kurallari (eskiden TopluMesajViewModel'de duran, buraya
 * tasinan is mantigi):
 * - kampanya secilmemisse hata
 * - aliciGrubu=BELIRLI_HESAPLAR ise belirliHesaplar bos olamaz
 * - mesajIcerigiTipi=YENI ise yeniMesajIcerigi bos olamaz
 */
@Service
public class BulkMessageService {

    private final CampaignTargetRepository campaignTargetRepository;
    private final MessageRepository messageRepository;
    private final AccountRepository accountRepository;

    public BulkMessageService(CampaignTargetRepository campaignTargetRepository,
                               MessageRepository messageRepository,
                               AccountRepository accountRepository) {
        this.campaignTargetRepository = campaignTargetRepository;
        this.messageRepository = messageRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * @param aliciGrubu HEPSI / ONAYLAYANLAR / ONAYLAMAYANLAR / AKSIYON_ALMAYANLAR / BELIRLI_HESAPLAR
     * @param belirliHesaplar aliciGrubu=BELIRLI_HESAPLAR ise virgul/satir ile ayrilmis hesap no listesi (serbest metin)
     * @param mesajIcerigiTipi SABLON / YENI
     */
    @Transactional
    public List<Message> gonder(Campaign campaign, String aliciGrubu, String belirliHesaplar,
                                 String kanal, String mesajIcerigiTipi, String yeniMesajIcerigi) {
        if (campaign == null) {
            throw new IllegalArgumentException("Once bir kampanya seciniz");
        }
        if ("BELIRLI_HESAPLAR".equals(aliciGrubu) && (belirliHesaplar == null || belirliHesaplar.isBlank())) {
            throw new IllegalArgumentException(
                    "Belirli Hesaplar secildiginde en az bir hesap numarasi girilmelidir");
        }
        if ("YENI".equals(mesajIcerigiTipi) && (yeniMesajIcerigi == null || yeniMesajIcerigi.isBlank())) {
            throw new IllegalArgumentException("Yeni mesaj icerigi bos birakilamaz");
        }

        List<String> hesapNolari = "BELIRLI_HESAPLAR".equals(aliciGrubu)
                ? Arrays.asList(belirliHesaplar.split("[,\\n]"))
                : List.of();

        String icerik = "YENI".equals(mesajIcerigiTipi)
                ? yeniMesajIcerigi
                : "E-Mail/SMS sablonuyla ayni icerik";

        List<Account> hedefHesaplar = resolveHedefHesaplar(campaign, aliciGrubu, hesapNolari);

        List<Message> gonderilenler = new ArrayList<>();
        for (Account account : hedefHesaplar) {
            Message message = new Message();
            message.setCampaign(campaign);
            message.setAccount(account);
            message.setKanal(kanal);
            message.setIcerik(icerik);
            message.setGonderimTarihi(LocalDateTime.now());
            message.setDurum("GONDERILDI");
            gonderilenler.add(messageRepository.save(message));
        }
        return gonderilenler;
    }

    private List<Account> resolveHedefHesaplar(Campaign campaign, String aliciGrubu, List<String> belirliHesapNolari) {
        if ("BELIRLI_HESAPLAR".equals(aliciGrubu)) {
            List<Account> result = new ArrayList<>();
            for (String hesapNo : belirliHesapNolari) {
                Account account = accountRepository.findByHesapNo(hesapNo.trim());
                if (account != null) {
                    result.add(account);
                }
            }
            return result;
        }

        List<CampaignTarget> targets;
        switch (aliciGrubu) {
            case "ONAYLAYANLAR":
                targets = campaignTargetRepository.findByCampaignIdAndOnayDurumu(campaign.getId(), "ONAYLADI");
                break;
            case "ONAYLAMAYANLAR":
                targets = campaignTargetRepository.findByCampaignIdAndOnayDurumu(campaign.getId(), "ONAYLAMADI");
                break;
            case "AKSIYON_ALMAYANLAR":
                targets = campaignTargetRepository.findByCampaignIdAndOnayDurumu(campaign.getId(), "AKSIYON_ALMADI");
                break;
            case "HEPSI":
            default:
                targets = campaignTargetRepository.findByCampaignId(campaign.getId());
                break;
        }

        List<Account> result = new ArrayList<>();
        for (CampaignTarget t : targets) {
            result.add(t.getAccount());
        }
        return result;
    }
}
