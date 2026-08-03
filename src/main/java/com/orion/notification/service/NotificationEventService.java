package com.orion.notification.service;

import com.orion.notification.domain.NotificationEvent;
import com.orion.notification.repository.NotificationEventRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * "Bildirim Izleme" ekraninin arkasindaki is mantigi. Filtrelenmis/
 * sayfalanmis bildirim log kayitlarini listeler ve ayni filtre setiyle
 * (ama sayfalamasiz, tum eslesen kayitlar) bir Excel (.xlsx) raporu
 * uretir - projedeki Apache POI bagimliliginin ilk gercek kullanimi
 * ("Rapor Olustur" butonu, kredi-optimizasyon.zul'deki bağlanmamis
 * "Excel Olustur" butonunun aksine gercekten calisir).
 */
@Service
public class NotificationEventService {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    private final NotificationEventRepository repository;

    public NotificationEventService(NotificationEventRepository repository) {
        this.repository = repository;
    }

    public Page<NotificationEvent> search(String status, LocalDate dateFrom, LocalDate dateTo,
                                           String hesapNo, String kullaniciAdi, String notifHeader,
                                           Pageable pageable) {
        return repository.search(
                blankToNull(status), dateFrom, dateTo,
                blankToNull(hesapNo), blankToNull(kullaniciAdi), blankToNull(notifHeader),
                pageable);
    }

    /**
     * ZK tarafi icin sayfalamasiz liste - ZK'nin kendi `mold="paging"`
     * listbox'i tum listeyi alip istemci tarafinda sayfalar (projedeki
     * her ZK ekraninin kullandigi ayni desen), bu yuzden ZK ViewModel'i
     * REST tarafindaki Page<T>'yi degil bu metodu cagirir.
     */
    public List<NotificationEvent> list(String status, LocalDate dateFrom, LocalDate dateTo,
                                         String hesapNo, String kullaniciAdi, String notifHeader) {
        return repository.searchAll(
                blankToNull(status), dateFrom, dateTo,
                blankToNull(hesapNo), blankToNull(kullaniciAdi), blankToNull(notifHeader));
    }

    /**
     * "Rapor Olustur" butonu tarafindan cagirilir. Ekrandaki filtrelerle
     * eslesen TUM kayitlari (sayfalamasiz) alip tek sayfalik bir .xlsx
     * dosyasina yazar - "su an ekranda gordugunu indir" davranisi.
     */
    public byte[] exportToExcel(String status, LocalDate dateFrom, LocalDate dateTo,
                                 String hesapNo, String kullaniciAdi, String notifHeader) {
        List<NotificationEvent> rows = repository.searchAll(
                blankToNull(status), dateFrom, dateTo,
                blankToNull(hesapNo), blankToNull(kullaniciAdi), blankToNull(notifHeader));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Bildirim Izleme");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {
                    "Tarih", "Saat", "Yatirimci No", "Kullanici Adi", "Bildirim Tipi", "Mesaj",
                    "Durum", "Deneme Adedi", "Hata Mesaji", "Bildirim Id", "Sablon Id", "Bildirim Log ID (UUID)"
            };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (NotificationEvent e : rows) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(e.getLogDate().toString());
                row.createCell(1).setCellValue(e.getCreated().toLocalTime().format(TIME_FORMAT));
                row.createCell(2).setCellValue(e.getAccount().getHesapNo());
                row.createCell(3).setCellValue(e.getUser().getKullaniciAdi());
                row.createCell(4).setCellValue(e.getNotifHeader());
                row.createCell(5).setCellValue(e.getNotifMessage());
                row.createCell(6).setCellValue(e.getStatus());
                row.createCell(7).setCellValue(e.getRetryCount());
                row.createCell(8).setCellValue(e.getErrorDescription() == null ? "" : e.getErrorDescription());
                row.createCell(9).setCellValue(e.getId());
                row.createCell(10).setCellValue(e.getTemplateId());
                row.createCell(11).setCellValue(e.getUuid());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Bildirim raporu olusturulurken hata olustu", ex);
        }
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
