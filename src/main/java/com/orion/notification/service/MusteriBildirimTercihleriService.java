package com.orion.notification.service;

import com.orion.core.domain.Customer;
import com.orion.core.repository.CustomerRepository;
import com.orion.core.service.CustomerService;
import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.domain.MusteriBildirimTercihi;
import com.orion.notification.domain.NotificationCategory;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.dto.NotifTypeSummaryDto;
import com.orion.notification.dto.NotifChannelStatusDto;
import com.orion.notification.dto.NotifChannelCodeDto;
import com.orion.notification.dto.NotifCategoryDto;
import com.orion.notification.dto.NotifPreferencesGetAllResponse;
import com.orion.notification.dto.NotifPreferencesUpdateItem;
import com.orion.notification.dto.NotifPreferencesUpdateResponse;
import com.orion.notification.dto.NotifPreferencesUpdateResultItem;
import com.orion.notification.repository.MusteriBildirimTercihiRepository;
import com.orion.notification.repository.NotificationCategoryRepository;
import com.orion.notification.repository.NotificationTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * "Musteri Bildirim Tercihleri" ekraninin is mantigi. ZK ViewModel ve REST
 * controller bu servisi birebir paylasir.
 *
 * V40'tan itibaren tercihler bildirim TIPI degil, bildirim KATEGORISI
 * bazindadir (bkz. NotificationCategory javadoc) ve REST tarafi
 * (getAllForUsername/updateForUsername), servis dokumaninin
 * (musteri_bildirim_tercihleri_servis_dokumani.docx) GET/POST
 * sozlesmesiyle BIREBIR ayni JSON sekli uretir/tuketir - musteri
 * "username" ile tanimlanir (Customer.username, bkz. o alanin javadoc'u),
 * "Musteri No" ile degil. Musteri No arama, ortak
 * CustomerService.bulByMusteriNo(...) uzerinden yapilir; bu servis,
 * musteri BULUNDUKTAN SONRA customer.getUsername() ile cagrilir.
 */
@Service
public class MusteriBildirimTercihleriService {

    /** {@link NotifPreferencesUpdateResponse#getStatus()} (istegin GENEL sonucu) icin degerler. */
    private static final String GENEL_SONUC_SUCCESS = "SUCCESS";
    private static final String GENEL_SONUC_PARTIAL_SUCCESS = "PARTIAL_SUCCESS";
    private static final String GENEL_SONUC_FAIL = "FAIL";

    /** {@link NotifPreferencesUpdateResultItem#getStatus()} (TEK kombinasyonun sonucu) icin degerler - dikkat, GENEL sonuctan farkli kelimeler. */
    private static final String ITEM_SONUC_SUCCESS = "SUCCESS";
    private static final String ITEM_SONUC_FAILED = "FAILED";

    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final NotificationCategoryRepository categoryRepository;
    private final NotificationTypeRepository notificationTypeRepository;
    private final MusteriBildirimTercihiRepository tercihRepository;

    public MusteriBildirimTercihleriService(CustomerService customerService,
                                             CustomerRepository customerRepository,
                                             NotificationCategoryRepository categoryRepository,
                                             NotificationTypeRepository notificationTypeRepository,
                                             MusteriBildirimTercihiRepository tercihRepository) {
        this.customerService = customerService;
        this.customerRepository = customerRepository;
        this.categoryRepository = categoryRepository;
        this.notificationTypeRepository = notificationTypeRepository;
        this.tercihRepository = tercihRepository;
    }

    public Customer musteriBul(String musteriNo) {
        return customerService.bulByMusteriNo(musteriNo);
    }

    /**
     * Musterinin her kategori icin tercih satirini dondurur. Henuz hic
     * tercih girilmemis bir kategori icin satir, varsayilan (hepsi acik)
     * olarak ilk sorguda otomatik olusturulur - boylece "Son Guncelleme"
     * her zaman gercek bir tarih gosterir.
     */
    @Transactional
    public List<MusteriBildirimTercihi> tercihleriGetir(Long customerId) {
        List<NotificationCategory> categories = categoryRepository.findAllByOrderBySiraAsc();
        List<MusteriBildirimTercihi> mevcut = tercihRepository.findAllByCustomerIdFetched(customerId);
        Map<Long, MusteriBildirimTercihi> categoryIdToTercih = mevcut.stream()
                .collect(Collectors.toMap(t -> t.getCategory().getId(), t -> t));

        List<MusteriBildirimTercihi> sonuc = new ArrayList<>();
        for (NotificationCategory category : categories) {
            MusteriBildirimTercihi tercih = categoryIdToTercih.get(category.getId());
            if (tercih == null) {
                tercih = new MusteriBildirimTercihi();
                tercih.setCustomer(customerRepository.getReferenceById(customerId));
                tercih.setCategory(category);
                tercih.setPushAcik(true);
                tercih.setSmsAcik(true);
                tercih.setEpostaAcik(true);
                tercih.setSonGuncelleme(LocalDateTime.now());
                tercih = tercihRepository.save(tercih);
            }
            sonuc.add(tercih);
        }
        return sonuc;
    }

    /** "GET /notifPreferences/getAll" - bkz. sinif javadoc'u. */
    @Transactional
    public NotifPreferencesGetAllResponse getAllForUsername(String username) {
        Customer customer = customerService.bulByUsername(username);
        List<MusteriBildirimTercihi> tercihler = tercihleriGetir(customer.getId());

        NotifPreferencesGetAllResponse response = new NotifPreferencesGetAllResponse();
        response.setUsername(customer.getUsername());
        response.setNotificationCategories(tercihler.stream().map(this::toKategoriDto).toList());
        return response;
    }

    private NotifCategoryDto toKategoriDto(MusteriBildirimTercihi tercih) {
        NotificationCategory category = tercih.getCategory();
        List<NotificationType> types = notificationTypeRepository.findAllByCategoryIdOrderBySiraAsc(category.getId());

        NotifCategoryDto dto = new NotifCategoryDto();
        dto.setCategoryCode(category.getKod());
        dto.setCategoryName(category.getAd());
        dto.setEditable(category.isEditable());
        dto.setNotifications(types.stream()
                .map(t -> new NotifTypeSummaryDto(t.getKod(), t.getAd()))
                .toList());

        NotifChannelCodeDto kanalKodu = new NotifChannelCodeDto();
        kanalKodu.setPush(new NotifChannelStatusDto(tercih.isPushAcik(), category.isPushEditable()));
        kanalKodu.setSms(new NotifChannelStatusDto(tercih.isSmsAcik(), category.isSmsEditable()));
        kanalKodu.setEmail(new NotifChannelStatusDto(tercih.isEpostaAcik(), category.isEpostaEditable()));
        dto.setNotifChannelCode(kanalKodu);
        return dto;
    }

    /**
     * "POST /notifPreferences/update" - her (categoryCode, notifChannelCode)
     * kombinasyonu BAGIMSIZ islenir: kilitli (editable=false) bir
     * kombinasyona yonelik istek o kombinasyon icin FAILED doner ve
     * kaydedilmez, digerleri etkilenmez. Genel `status`, tum
     * kombinasyonlarin sonucuna gore SUCCESS/PARTIAL_SUCCESS/FAIL olarak
     * hesaplanir (bkz. bu sinifin ITEM_SONUC ve GENEL_SONUC ile baslayan
     * sabitlerinin javadoc'u - item ve genel sonuc icin dokuman KASITLI
     * farkli kelimeler kullanir).
     */
    @Transactional
    public NotifPreferencesUpdateResponse updateForUsername(String username, List<NotifPreferencesUpdateItem> updates) {
        Customer customer = customerService.bulByUsername(username);
        List<MusteriBildirimTercihi> mevcut = tercihleriGetir(customer.getId());
        Map<String, MusteriBildirimTercihi> kodToTercih = mevcut.stream()
                .collect(Collectors.toMap(t -> t.getCategory().getKod(), t -> t));

        List<NotifPreferencesUpdateResultItem> sonuclar = new ArrayList<>();
        int basariliSayisi = 0;

        if (updates != null) {
            for (NotifPreferencesUpdateItem update : updates) {
                NotifPreferencesUpdateResultItem sonuc = new NotifPreferencesUpdateResultItem();
                sonuc.setCategoryCode(update.getCategoryCode());
                sonuc.setNotifChannelCode(update.getNotifChannelCode());
                sonuc.setEnabled(update.isEnabled());

                MusteriBildirimTercihi tercih = kodToTercih.get(update.getCategoryCode());
                BildirimKanali kanal = kanaldanCoz(update.getNotifChannelCode());
                if (tercih == null || kanal == null || !tercih.getCategory().isEditableFor(kanal)) {
                    sonuc.setStatus(ITEM_SONUC_FAILED);
                } else {
                    kanalDegeriniUygula(tercih, kanal, update.isEnabled());
                    tercih.setSonGuncelleme(LocalDateTime.now());
                    sonuc.setStatus(ITEM_SONUC_SUCCESS);
                    basariliSayisi++;
                }
                sonuclar.add(sonuc);
            }
        }
        tercihRepository.saveAll(mevcut);

        NotifPreferencesUpdateResponse response = new NotifPreferencesUpdateResponse();
        response.setUsername(customer.getUsername());
        response.setUpdatedCount(basariliSayisi);
        response.setUpdatedFields(sonuclar);
        response.setStatus(genelSonucHesapla(sonuclar, basariliSayisi));
        return response;
    }

    private static String genelSonucHesapla(List<NotifPreferencesUpdateResultItem> sonuclar, int basariliSayisi) {
        if (sonuclar.isEmpty() || basariliSayisi == sonuclar.size()) {
            return GENEL_SONUC_SUCCESS;
        }
        if (basariliSayisi == 0) {
            return GENEL_SONUC_FAIL;
        }
        return GENEL_SONUC_PARTIAL_SUCCESS;
    }

    /** Dokumanin "push"/"sms"/"email" (kucuk harf, Ingilizce) anahtarlarini {@link BildirimKanali}'ye cozer. */
    private static BildirimKanali kanaldanCoz(String notifChannelCode) {
        if (notifChannelCode == null) {
            return null;
        }
        return switch (notifChannelCode.toLowerCase(Locale.ROOT)) {
            case "push" -> BildirimKanali.PUSH;
            case "sms" -> BildirimKanali.SMS;
            case "email" -> BildirimKanali.EPOSTA;
            default -> null;
        };
    }

    private static void kanalDegeriniUygula(MusteriBildirimTercihi tercih, BildirimKanali kanal, boolean enabled) {
        switch (kanal) {
            case PUSH -> tercih.setPushAcik(enabled);
            case SMS -> tercih.setSmsAcik(enabled);
            case EPOSTA -> tercih.setEpostaAcik(enabled);
        }
    }
}
