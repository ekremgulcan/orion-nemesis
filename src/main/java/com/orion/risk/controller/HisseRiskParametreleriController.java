package com.orion.risk.controller;

import com.orion.core.domain.Account;
import com.orion.risk.dto.AccountLookupDto;
import com.orion.risk.dto.HisseRiskParametresiDto;
import com.orion.risk.dto.HisseRiskParametresiFormDto;
import com.orion.risk.dto.HisseRiskParametresiMapper;
import com.orion.risk.dto.NetVarlikCarpaniTopluSatirDto;
import com.orion.risk.dto.NetVarlikCarpaniTopluSatirMapper;
import com.orion.risk.service.HisseRiskParametreleriService;
import com.orion.risk.vm.NetVarlikCarpaniTopluSatir;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * "Hisse Risk Parametreleri" ekraninin (risk/hisse-risk-parametreleri.zul /
 * HisseRiskParametreleriViewModel) REST API karsiligi - nemesis-frontend
 * tarafindan tuketilir. Ayni HisseRiskParametreleriService'i ZK ViewModel
 * ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/risk/hisse-risk-parametreleri")
public class HisseRiskParametreleriController {

    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String XLSX_MEDIA_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final HisseRiskParametreleriService service;
    private final HisseRiskParametresiMapper mapper;
    private final NetVarlikCarpaniTopluSatirMapper topluSatirMapper;

    public HisseRiskParametreleriController(HisseRiskParametreleriService service,
                                             HisseRiskParametresiMapper mapper,
                                             NetVarlikCarpaniTopluSatirMapper topluSatirMapper) {
        this.service = service;
        this.mapper = mapper;
        this.topluSatirMapper = topluSatirMapper;
    }

    @GetMapping
    public List<HisseRiskParametresiDto> getAll(@RequestParam(required = false) String musteriNo,
                                                 @RequestParam(required = false) String hesapNo,
                                                 @RequestParam(required = false) String kullaniciTipi) {
        return mapper.toDtoList(service.search(musteriNo, hesapNo, kullaniciTipi));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(required = false) String musteriNo,
                                          @RequestParam(required = false) String hesapNo,
                                          @RequestParam(required = false) String kullaniciTipi) {
        byte[] xlsx = service.exportToExcel(musteriNo, hesapNo, kullaniciTipi);
        String filename = "hisse-risk-parametreleri-" + LocalDate.now().format(FILE_DATE) + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(XLSX_MEDIA_TYPE))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(xlsx);
    }

    /** "Yeni Ekle" akisinda Hesap No girildikten sonra "Bul" butonu. */
    @GetMapping("/account/{hesapNo}")
    public AccountLookupDto lookupAccount(@PathVariable String hesapNo) {
        Account account = service.bulAccountByHesapNo(hesapNo);
        AccountLookupDto dto = new AccountLookupDto();
        dto.setMusteriNo(account.getCustomer().getMusteriNo());
        dto.setMusteriAdi(account.getCustomer().getAdSoyadUnvan());
        dto.setHesapTipi(account.getHesapMusteriTipi());
        return dto;
    }

    @PostMapping
    public HisseRiskParametresiDto create(@RequestBody HisseRiskParametresiFormDto form) {
        return mapper.toDto(kaydet(null, form));
    }

    @PutMapping("/{id}")
    public HisseRiskParametresiDto update(@PathVariable Long id, @RequestBody HisseRiskParametresiFormDto form) {
        return mapper.toDto(kaydet(id, form));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/toplu-guncelleme/onizle")
    public List<NetVarlikCarpaniTopluSatirDto> onizle(@RequestParam("file") MultipartFile file) {
        try {
            List<NetVarlikCarpaniTopluSatir> onizleme = service.excelOnizle(file.getInputStream());
            return topluSatirMapper.toDtoList(onizleme);
        } catch (IOException ex) {
            throw new UncheckedIOException("Excel dosyasi okunurken hata olustu", ex);
        }
    }

    @GetMapping("/toplu-guncelleme/sablon")
    public ResponseEntity<byte[]> sablonIndir() {
        byte[] xlsx = service.topluGuncellemeSablonuOlustur();
        String filename = "net-varlik-limit-carpani-sablon-" + LocalDate.now().format(FILE_DATE) + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(XLSX_MEDIA_TYPE))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(xlsx);
    }

    /**
     * "Onaya Gonder" - React tarafi onizlemede zaten gosterdigi satirlari
     * (bkz. NetVarlikCarpaniTopluSatirDto Javadoc) oldugu gibi geri
     * gonderir, sunucu ayrica bir onizleme oturumu tutmaz. ViewModel'deki
     * ayni ikinci-kapi kontrolu (onizlemeTumuGecerli) burada da tekrarlanir.
     */
    @PostMapping("/toplu-guncelleme")
    public Map<String, Integer> onayaGonder(@RequestBody List<NetVarlikCarpaniTopluSatirDto> satirlar) {
        List<NetVarlikCarpaniTopluSatir> model = topluSatirMapper.toModelList(satirlar);
        if (model.isEmpty() || !model.stream().allMatch(NetVarlikCarpaniTopluSatir::isGecerli)) {
            throw new IllegalArgumentException(
                    "Onizlemede gecersiz satirlar var (hesap/deger hatali). Once Excel dosyasini duzeltip tekrar yukleyin.");
        }
        int guncellenen = service.topluGuncelle(model);
        return Map.of("guncellenen", guncellenen);
    }

    private com.orion.risk.domain.HisseRiskParametresi kaydet(Long id, HisseRiskParametresiFormDto form) {
        return service.kaydet(id, form.getHesapNo(), form.getKullaniciTipi(),
                form.getAlisKontrolTipi(), form.getSatisKontrolTipi(), form.getAcikSatisKontrolTipi(),
                form.getAcikTakasLimiti(), form.getAcigaSatisLimiti(), form.getNetVarlikLimitCarpani(),
                form.isKredisizGrupAAlisYapabilir(), form.isGrupBAlisYapabilir(),
                form.isGrupCAlisYapabilir(), form.isGrupDAlisYapabilir(),
                form.isKredisizGrupANakitKontrol(), form.isGrupBNakitKontrol(),
                form.isGrupCNakitKontrol(), form.isGrupDNakitKontrol(),
                form.isKredisizPaylardaKontrolsuzSatis());
    }
}
