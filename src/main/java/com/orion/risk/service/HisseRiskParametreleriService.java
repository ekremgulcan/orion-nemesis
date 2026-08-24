package com.orion.risk.service;

import com.orion.core.domain.Account;
import com.orion.core.repository.AccountRepository;
import com.orion.risk.domain.HisseRiskParametresi;
import com.orion.risk.repository.HisseRiskParametresiRepository;
import com.orion.risk.vm.NetVarlikCarpaniTopluSatir;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class HisseRiskParametreleriService {

    private final HisseRiskParametresiRepository repository;
    private final AccountRepository accountRepository;

    public HisseRiskParametreleriService(HisseRiskParametresiRepository repository,
                                          AccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    public List<HisseRiskParametresi> getAll() {
        return repository.findAllFetched();
    }

    public List<HisseRiskParametresi> search(String musteriNo, String hesapNo, String kullaniciTipi) {
        return repository.search(blankToNull(musteriNo), blankToNull(hesapNo), blankToNull(kullaniciTipi));
    }

    /**
     * "Yeni Ekle" akisinda Hesap No girildikten sonra "Bul" ile hesabi
     * bulmak icin. Musteri No / Musteri Adi burada okunur, ama ekranda
     * hicbir alan bulunduktan sonra kilitlenmez (kullanicinin istegi).
     */
    public Account bulAccountByHesapNo(String hesapNo) {
        if (hesapNo == null || hesapNo.isBlank()) {
            throw new IllegalArgumentException("Hesap No bos birakilamaz");
        }
        Account account = accountRepository.findByHesapNo(hesapNo.trim());
        if (account == null) {
            throw new IllegalArgumentException("Hesap bulunamadi: " + hesapNo.trim());
        }
        return account;
    }

    @Transactional
    public HisseRiskParametresi kaydet(Long id, String hesapNo, String kullaniciTipi,
                                        String alisKontrolTipi, String satisKontrolTipi, String acikSatisKontrolTipi,
                                        BigDecimal acikTakasLimiti, BigDecimal acigaSatisLimiti,
                                        Integer netVarlikLimitCarpani,
                                        boolean kredisizGrupAAlisYapabilir, boolean grupBAlisYapabilir,
                                        boolean grupCAlisYapabilir, boolean grupDAlisYapabilir,
                                        boolean kredisizGrupANakitKontrol, boolean grupBNakitKontrol,
                                        boolean grupCNakitKontrol, boolean grupDNakitKontrol,
                                        boolean kredisizPaylardaKontrolsuzSatis) {
        if (kullaniciTipi == null || kullaniciTipi.isBlank()) {
            throw new IllegalArgumentException("Kullanici Tipi secilmelidir");
        }
        Account account = bulAccountByHesapNo(hesapNo);

        HisseRiskParametresi parametre = id != null
                ? repository.findById(id).orElseThrow(() -> new java.util.NoSuchElementException("Kayit bulunamadi: " + id))
                : new HisseRiskParametresi();

        parametre.setAccount(account);
        parametre.setKullaniciTipi(kullaniciTipi);
        parametre.setAlisKontrolTipi(alisKontrolTipi);
        parametre.setSatisKontrolTipi(satisKontrolTipi);
        parametre.setAcikSatisKontrolTipi(acikSatisKontrolTipi);
        parametre.setAcikTakasLimiti(acikTakasLimiti == null ? BigDecimal.ZERO : acikTakasLimiti);
        parametre.setAcigaSatisLimiti(acigaSatisLimiti == null ? BigDecimal.ZERO : acigaSatisLimiti);
        parametre.setNetVarlikLimitCarpani(netVarlikLimitCarpani == null ? 1 : netVarlikLimitCarpani);
        parametre.setKredisizGrupAAlisYapabilir(kredisizGrupAAlisYapabilir);
        parametre.setGrupBAlisYapabilir(grupBAlisYapabilir);
        parametre.setGrupCAlisYapabilir(grupCAlisYapabilir);
        parametre.setGrupDAlisYapabilir(grupDAlisYapabilir);
        parametre.setKredisizGrupANakitKontrol(kredisizGrupANakitKontrol);
        parametre.setGrupBNakitKontrol(grupBNakitKontrol);
        parametre.setGrupCNakitKontrol(grupCNakitKontrol);
        parametre.setGrupDNakitKontrol(grupDNakitKontrol);
        parametre.setKredisizPaylardaKontrolsuzSatis(kredisizPaylardaKontrolsuzSatis);
        parametre.setAktif(true);
        parametre.setGuncellemeTarihi(LocalDateTime.now());
        return repository.save(parametre);
    }

    @Transactional
    public void sil(Long id) {
        repository.deleteById(id);
    }

    /**
     * "Indir" butonu - ekrandaki filtre setiyle (ama sayfalamasiz, tum
     * eslesen kayitlar) bir Excel (.xlsx) raporu uretir. Ayni desen:
     * NotificationEventService.exportToExcel ("Rapor Olustur" butonu).
     */
    public byte[] exportToExcel(String musteriNo, String hesapNo, String kullaniciTipi) {
        List<HisseRiskParametresi> rows = search(musteriNo, hesapNo, kullaniciTipi);
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Risk Profilleri");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {
                    "Kullanici Tipi", "Hesap Tipi", "Hesap No", "Musteri No", "Musteri Adi",
                    "Alis Kontrol", "Satis Kontrol", "Acik Satis Kontrol",
                    "Acik Takas Limiti", "Aciga Satis Limiti", "Net Varlik Limit Carpani"
            };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (HisseRiskParametresi p : rows) {
                Account account = p.getAccount();
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(p.getKullaniciTipi());
                row.createCell(1).setCellValue(account.getHesapMusteriTipi());
                row.createCell(2).setCellValue(account.getHesapNo());
                row.createCell(3).setCellValue(account.getCustomer().getMusteriNo());
                row.createCell(4).setCellValue(account.getCustomer().getAdSoyadUnvan());
                row.createCell(5).setCellValue(p.getAlisKontrolTipi());
                row.createCell(6).setCellValue(p.getSatisKontrolTipi());
                row.createCell(7).setCellValue(p.getAcikSatisKontrolTipi());
                row.createCell(8).setCellValue(p.getAcikTakasLimiti().doubleValue());
                row.createCell(9).setCellValue(p.getAcigaSatisLimiti().doubleValue());
                row.createCell(10).setCellValue(p.getNetVarlikLimitCarpani());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Risk profilleri raporu olusturulurken hata olustu", ex);
        }
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    /**
     * "Risk profilleri" tab'indaki "Net Varlik Limit Carpani Toplu
     * Guncelleme" ic tabi - yuklenen Excel'in HER satiri icin TEK bir
     * onizleme satiri uretir (Musteri No/Musteri Adi/Kullanici Tipi ekranda
     * gosterilmedigi icin ayri satirlara bolunmuyor - bkz. NetVarlikCarpaniTopluSatir
     * Javadoc). O Hesap No'ya bagli TUM hisse_risk_parametreleri kayitlari
     * (Musteri + Yatirim Danismani, varsa ikisi de) satirin
     * parametreIdListesi'nde toplanir ve "Onaya Gonder" hepsini birden
     * gunceller. Henuz HICBIR DB YAZIMI yapilmaz - bkz. {@link #topluGuncelle}.
     * Beklenen sutunlar: A="Hesap No", B="Net Varlik Limit Carpani".
     */
    @Transactional(readOnly = true)
    public List<NetVarlikCarpaniTopluSatir> excelOnizle(InputStream excelStream) {
        List<NetVarlikCarpaniTopluSatir> sonuc = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(excelStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                String hesapNo = hucreMetni(row, 0);
                if (hesapNo == null || hesapNo.isBlank()) {
                    continue;
                }
                Integer yeniDeger = hucreTamSayi(row, 1);
                sonuc.add(onizlemeSatiriUret(hesapNo.trim(), yeniDeger));
            }
        } catch (IOException ex) {
            throw new UncheckedIOException("Excel dosyasi okunurken hata olustu", ex);
        }
        return sonuc;
    }

    private NetVarlikCarpaniTopluSatir onizlemeSatiriUret(String hesapNo, Integer yeniDeger) {
        NetVarlikCarpaniTopluSatir satir = new NetVarlikCarpaniTopluSatir();
        satir.setHesapNo(hesapNo);
        satir.setYeniDeger(yeniDeger);

        Account account = accountRepository.findByHesapNo(hesapNo);
        if (account == null) {
            satir.setDurum("Hesap Bulunamadi");
            return satir;
        }
        List<HisseRiskParametresi> parametreler = repository.findByAccountId(account.getId());
        if (parametreler.isEmpty()) {
            satir.setDurum("Risk Profili Bulunamadi");
            return satir;
        }

        // Musteri + Yatirim Danismani kayitlari normalde ayni degeri paylasir
        // (bkz. kaydet/topluGuncelle) - "Eski Deger" olarak ilk kaydin degeri
        // gosterilir, ama guncelleme sirasinda TUMU (id listesi) etkilenir.
        satir.setEskiDeger(parametreler.get(0).getNetVarlikLimitCarpani());
        for (HisseRiskParametresi p : parametreler) {
            satir.getParametreIdListesi().add(p.getId());
        }

        boolean degerGecerli = yeniDeger != null && yeniDeger >= 1 && yeniDeger <= 5;
        satir.setGecerli(degerGecerli);
        satir.setDurum(degerGecerli ? "Guncellenecek" : "Gecersiz Deger (1-5 olmali)");
        return satir;
    }

    /**
     * Onizleme tablosundaki "gecerli" satirlari (bkz. {@link #excelOnizle})
     * gercekten DB'ye yazar - her satirin parametreIdListesi'ndeki TUM
     * kayitlari (Musteri + Yatirim Danismani) gunceller. Gecersiz/hata
     * satirlari sessizce atlanir - VM tarafinda kullanicinin "Onaya Gonder"
     * oncesi zaten gormus olmasi beklenir.
     */
    @Transactional
    public int topluGuncelle(List<NetVarlikCarpaniTopluSatir> satirlar) {
        int guncellenen = 0;
        for (NetVarlikCarpaniTopluSatir satir : satirlar) {
            if (!satir.isGecerli() || satir.getParametreIdListesi().isEmpty()) {
                continue;
            }
            for (Long parametreId : satir.getParametreIdListesi()) {
                HisseRiskParametresi parametre = repository.findById(parametreId).orElse(null);
                if (parametre == null) {
                    continue;
                }
                parametre.setNetVarlikLimitCarpani(satir.getYeniDeger());
                parametre.setGuncellemeTarihi(LocalDateTime.now());
                repository.save(parametre);
                guncellenen++;
            }
        }
        return guncellenen;
    }

    /** "Sablon Indir" butonu - toplu guncelleme Excel'inin beklenen 2 sutunlu formatini gosteren ornek dosya. */
    public byte[] topluGuncellemeSablonuOlustur() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Sablon");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {"Hesap No", "Net Varlik Limit Carpani"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row ornekRow = sheet.createRow(1);
            ornekRow.createCell(0).setCellValue("H0001");
            ornekRow.createCell(1).setCellValue(3);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Sablon dosyasi olusturulurken hata olustu", ex);
        }
    }

    private static String hucreMetni(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }
        String deger = cell.getStringCellValue();
        return deger == null ? null : deger.trim();
    }

    private static Integer hucreTamSayi(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) cell.getNumericCellValue();
            }
            String deger = cell.getStringCellValue();
            return (deger == null || deger.isBlank()) ? null : Integer.parseInt(deger.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
