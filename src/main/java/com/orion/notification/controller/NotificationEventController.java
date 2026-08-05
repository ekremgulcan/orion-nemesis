package com.orion.notification.controller;

import com.orion.notification.dto.NotificationEventDto;
import com.orion.notification.dto.NotificationEventMapper;
import com.orion.notification.service.NotificationEventService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * "Bildirim Izleme" ekrani (notification/bildirim-izleme.zul /
 * BildirimIzlemeViewModel) icin REST API karsiligi - nemesis-frontend
 * tarafindan tuketilir. Ayni NotificationEventService'i ZK ViewModel ile
 * birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/notification")
public class NotificationEventController {

    private final NotificationEventService service;
    private final NotificationEventMapper mapper;

    public NotificationEventController(NotificationEventService service, NotificationEventMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/events")
    public Page<NotificationEventDto> getEvents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String hesapNo,
            @RequestParam(required = false) String kullaniciAdi,
            @RequestParam(required = false) String notifHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = service.search(status, dateFrom, dateTo, hesapNo, kullaniciAdi, notifHeader,
                PageRequest.of(page, size));
        return new PageImpl<>(mapper.toDtoList(result.getContent()), result.getPageable(), result.getTotalElements());
    }

    @GetMapping("/events/export")
    public ResponseEntity<byte[]> exportEvents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String hesapNo,
            @RequestParam(required = false) String kullaniciAdi,
            @RequestParam(required = false) String notifHeader) {
        byte[] xlsx = service.exportToExcel(status, dateFrom, dateTo, hesapNo, kullaniciAdi, notifHeader);
        String filename = "events-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(xlsx);
    }
}
