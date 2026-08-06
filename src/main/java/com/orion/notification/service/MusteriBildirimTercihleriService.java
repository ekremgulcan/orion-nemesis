package com.orion.notification.service;

import com.orion.core.domain.Customer;
import com.orion.core.repository.CustomerRepository;
import com.orion.core.service.CustomerService;
import com.orion.notification.domain.MusteriBildirimTercihi;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.dto.BildirimTercihiGuncelleRequest;
import com.orion.notification.repository.MusteriBildirimTercihiRepository;
import com.orion.notification.repository.NotificationTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * "Musteri Bildirim Tercihleri" ekraninin is mantigi. ZK ViewModel ve REST
 * controller bu servisi birebir paylasir. Musteri No arama, ortak
 * CustomerService.bulByMusteriNo(...) uzerinden yapilir (bkz. o metodun
 * javadoc'u - baska ekranlarin da kullanabilmesi icin oraya eklendi).
 */
@Service
public class MusteriBildirimTercihleriService {

    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final NotificationTypeRepository notificationTypeRepository;
    private final MusteriBildirimTercihiRepository tercihRepository;

    public MusteriBildirimTercihleriService(CustomerService customerService,
                                             CustomerRepository customerRepository,
                                             NotificationTypeRepository notificationTypeRepository,
                                             MusteriBildirimTercihiRepository tercihRepository) {
        this.customerService = customerService;
        this.customerRepository = customerRepository;
        this.notificationTypeRepository = notificationTypeRepository;
        this.tercihRepository = tercihRepository;
    }

    public Customer musteriBul(String musteriNo) {
        return customerService.bulByMusteriNo(musteriNo);
    }

    /**
     * Musterinin her bildirim tipi icin tercih satirini dondurur. Henuz hic
     * tercih girilmemis bir tip icin satir, varsayilan (hepsi acik) olarak
     * ilk sorguda otomatik olusturulur - boylece ekranda "Son Guncelleme"
     * her zaman gercek bir tarih gosterir.
     */
    @Transactional
    public List<MusteriBildirimTercihi> tercihleriGetir(Long customerId) {
        List<NotificationType> types = notificationTypeRepository.findAllByOrderBySiraAsc();
        List<MusteriBildirimTercihi> mevcut = tercihRepository.findAllByCustomerIdFetched(customerId);
        Map<Long, MusteriBildirimTercihi> tipIdToTercih = mevcut.stream()
                .collect(Collectors.toMap(t -> t.getNotificationType().getId(), t -> t));

        List<MusteriBildirimTercihi> sonuc = new ArrayList<>();
        for (NotificationType type : types) {
            MusteriBildirimTercihi tercih = tipIdToTercih.get(type.getId());
            if (tercih == null) {
                tercih = new MusteriBildirimTercihi();
                tercih.setCustomer(customerRepository.getReferenceById(customerId));
                tercih.setNotificationType(type);
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

    /**
     * Gonderilen tercih guncellemelerini uygular. Zorunlu (VIOP Margin Call)
     * bir tipe yonelik guncelleme sessizce yok sayilir - ekran zaten bu
     * satiri kilitli/degistirilemez gosterir, burada da savunmaci davranilir.
     */
    @Transactional
    public List<MusteriBildirimTercihi> tercihleriKaydet(Long customerId,
                                                          List<BildirimTercihiGuncelleRequest> guncellemeler) {
        List<MusteriBildirimTercihi> mevcut = tercihleriGetir(customerId);
        Map<Long, MusteriBildirimTercihi> tipIdToTercih = mevcut.stream()
                .collect(Collectors.toMap(t -> t.getNotificationType().getId(), t -> t));

        if (guncellemeler != null) {
            for (BildirimTercihiGuncelleRequest guncelleme : guncellemeler) {
                MusteriBildirimTercihi tercih = tipIdToTercih.get(guncelleme.getNotificationTypeId());
                if (tercih == null || tercih.getNotificationType().isZorunlu()) {
                    continue;
                }
                tercih.setPushAcik(guncelleme.isPushAcik());
                tercih.setSmsAcik(guncelleme.isSmsAcik());
                tercih.setEpostaAcik(guncelleme.isEpostaAcik());
                tercih.setSonGuncelleme(LocalDateTime.now());
            }
        }
        return tercihRepository.saveAll(mevcut);
    }
}
