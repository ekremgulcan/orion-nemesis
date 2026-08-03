package com.orion.notification.repository;

import com.orion.notification.domain.NotificationEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

/**
 * "Bildirim Izleme" ekraninin arama/filtre repository'si. Diger tum
 * modullerdeki tek serbest-metin `search(q)` konvansiyonundan farkli
 * olarak (ekran filtre gereksinimleri gercekten daha zengin oldugu icin
 * bilincli bir sapma - bkz. modul yorumu), her alan icin ayri, opsiyonel
 * bir parametre alir ve gercek sunucu tarafi sayfalama (Pageable) kullanir
 * - projede ilk kez bir repository Page<T> donuyor.
 *
 * Account/User join'leri @ManyToOne (tekil) oldugu icin JOIN FETCH burada
 * sayfalamayla guvenle bir arada kullanilabilir (klasik "collection fetch +
 * pagination" sorunu sadece @OneToMany/@ManyToMany fetch join'lerinde
 * olusur, bu ikisi icin gecerli degil).
 */
public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {

    String BASE_SELECT = "select e from NotificationEvent e "
            + "join fetch e.account a join fetch a.customer "
            + "join fetch e.user u "
            + "where (:status is null or e.status = :status) "
            + "and (:dateFrom is null or e.logDate >= :dateFrom) "
            + "and (:dateTo is null or e.logDate <= :dateTo) "
            + "and (:hesapNo is null or lower(a.hesapNo) like lower(concat('%', :hesapNo, '%'))) "
            + "and (:kullaniciAdi is null or lower(u.kullaniciAdi) like lower(concat('%', :kullaniciAdi, '%'))) "
            + "and (:notifHeader is null or lower(e.notifHeader) like lower(concat('%', :notifHeader, '%')))";

    String COUNT_SELECT = "select count(e) from NotificationEvent e "
            + "join e.account a "
            + "join e.user u "
            + "where (:status is null or e.status = :status) "
            + "and (:dateFrom is null or e.logDate >= :dateFrom) "
            + "and (:dateTo is null or e.logDate <= :dateTo) "
            + "and (:hesapNo is null or lower(a.hesapNo) like lower(concat('%', :hesapNo, '%'))) "
            + "and (:kullaniciAdi is null or lower(u.kullaniciAdi) like lower(concat('%', :kullaniciAdi, '%'))) "
            + "and (:notifHeader is null or lower(e.notifHeader) like lower(concat('%', :notifHeader, '%')))";

    @Query(value = BASE_SELECT + " order by e.created desc", countQuery = COUNT_SELECT)
    Page<NotificationEvent> search(
            @Param("status") String status,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("hesapNo") String hesapNo,
            @Param("kullaniciAdi") String kullaniciAdi,
            @Param("notifHeader") String notifHeader,
            Pageable pageable);

    @Query(BASE_SELECT + " order by e.created desc")
    java.util.List<NotificationEvent> searchAll(
            @Param("status") String status,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("hesapNo") String hesapNo,
            @Param("kullaniciAdi") String kullaniciAdi,
            @Param("notifHeader") String notifHeader);
}
