package com.orion.risk.service;

import com.orion.core.domain.Account;
import com.orion.core.domain.User;
import com.orion.core.repository.AccountRepository;
import com.orion.risk.domain.HisseRiskParametreTalebi;
import com.orion.risk.domain.HisseRiskParametresi;
import com.orion.risk.repository.HisseRiskParametreTalebiRepository;
import com.orion.risk.repository.HisseRiskParametresiRepository;
import com.orion.risk.vm.NetVarlikCarpaniTopluSatir;
import com.orion.workflow.domain.WorkflowProcess;
import com.orion.workflow.repository.WorkflowProcessRepository;
import com.orion.workflow.service.WorkflowTaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Hisse Risk Parametreleri ekranina ozel onay (approve/reject) is mantigi.
 * Generic surec/gorev olusturma icin WorkflowTaskService'i kullanir.
 * Ileride Bildirim Ayarlari, Musteri Bildirim Tercihleri gibi ekranlar icin
 * benzer modül-spesifik onay servisleri olusturulacak.
 */
@Service
public class HisseRiskOnayService {

    private static final String SUREC_TIPI = "HISSE_RISK_PARAMETRELERI_ONAY";
    private static final String GOREV_OZETI = "Net Varlik Limit Carpani Toplu Guncelleme Onay Islemi";

    private final WorkflowProcessRepository processRepository;
    private final WorkflowTaskService workflowTaskService;
    private final HisseRiskParametreTalebiRepository talepRepository;
    private final HisseRiskParametresiRepository parametreRepository;
    private final AccountRepository accountRepository;
    private final HisseRiskParametreleriService hisseRiskParametreleriService;
    private final ObjectMapper objectMapper;

    public HisseRiskOnayService(WorkflowProcessRepository processRepository,
                                 WorkflowTaskService workflowTaskService,
                                 HisseRiskParametreTalebiRepository talepRepository,
                                 HisseRiskParametresiRepository parametreRepository,
                                 AccountRepository accountRepository,
                                 HisseRiskParametreleriService hisseRiskParametreleriService,
                                 ObjectMapper objectMapper) {
        this.processRepository = processRepository;
        this.workflowTaskService = workflowTaskService;
        this.talepRepository = talepRepository;
        this.parametreRepository = parametreRepository;
        this.accountRepository = accountRepository;
        this.hisseRiskParametreleriService = hisseRiskParametreleriService;
        this.objectMapper = objectMapper;
    }

    /**
     * Toplu guncelleme onizleme satirlarini onay surecine gonderir.
     * 1) Bekleyen surec kontrolu (varsa hata firlat)
     * 2) WorkflowProcess olustur (surecNo = process_id)
     * 3) Her gecerli satir icin HisseRiskParametreTalebi olustur
     * 4) Onayci rolundeki kullanicilara gorev olustur (gondereni haric)
     *
     * @throws IllegalStateException bekleyen surec varsa
     */
    @Transactional
    public WorkflowProcess onayaGonder(List<NetVarlikCarpaniTopluSatir> satirlar, User talepEden) {
        if (workflowTaskService.hasPendingProcess(SUREC_TIPI)) {
            throw new IllegalStateException(
                    "Bu islem icin bekleyen bir onay sureci bulunmaktadir. "
                    + "Mevcut surec tamamlanmadan yeni bir onay gonderilemez.");
        }

        // 1) Surec olustur
        WorkflowProcess process = new WorkflowProcess();
        process.setSurecTipi(SUREC_TIPI);
        process.setBaslangicTarihi(LocalDateTime.now());
        process.setDurum("ACIK");
        process.setSurecNo("TEMP"); // gecici - save sonrasi guncellenir
        process.setReferansModul("RISK");
        process = processRepository.save(process);
        process.setSurecNo(String.valueOf(process.getId()));
        process = processRepository.save(process);

        // 2) Her gecerli satir icin talep olustur
        for (NetVarlikCarpaniTopluSatir satir : satirlar) {
            if (!satir.isGecerli() || satir.getParametreIdListesi().isEmpty()) {
                continue;
            }
            Account account = accountRepository.findById(
                    parametreRepository.findById(satir.getParametreIdListesi().get(0))
                            .orElseThrow().getAccount().getId()
            ).orElseThrow();

            HisseRiskParametreTalebi talep = new HisseRiskParametreTalebi();
            talep.setProcess(process);
            talep.setTalepEden(talepEden);
            talep.setAccount(account);
            talep.setDurum("BEKLEMEDE");
            talep.setTalepTuru("TOPLU_GUNCELLEME");
            talep.setOlusturmaTarihi(LocalDateTime.now());

            // JSON snapshots
            String eskiDeger = String.valueOf(satir.getEskiDeger());
            String yeniDeger = String.valueOf(satir.getYeniDeger());
            talep.setOncekiDegerJson("{\"netVarlikLimitCarpani\":" + eskiDeger + "}");
            talep.setYeniDegerJson("{\"netVarlikLimitCarpani\":" + yeniDeger + "}");
            talep.setDegisiklikListesiJson(
                    "[{\"hesapNo\":\"" + satir.getHesapNo()
                    + "\",\"alan\":\"Net Varlik Limit Carpani\""
                    + ",\"eskiDeger\":\"" + eskiDeger
                    + "\",\"yeniDeger\":\"" + yeniDeger + "\"}]");

            talepRepository.save(talep);
        }

        // 3) Onayci gorevleri olustur
        workflowTaskService.createOnayTasksForRole(process, SUREC_TIPI,
                talepEden.getId(), GOREV_OZETI);

        return process;
    }

    /**
     * Tekil (Ekle, Duzenle, Sil) talebi onay surecine gonderir.
     */
    @Transactional
    public WorkflowProcess onayaGonderTekil(com.orion.risk.dto.HisseRiskParametresiFormDto yeniDeger,
                                            com.orion.risk.dto.HisseRiskParametresiFormDto eskiDeger,
                                            User talepEden,
                                            String talepTuru) {
        if (workflowTaskService.hasPendingProcess(SUREC_TIPI)) {
            throw new IllegalStateException("Bu islem icin bekleyen bir onay sureci bulunmaktadir. Mevcut surec tamamlanmadan yeni bir onay gonderilemez.");
        }

        WorkflowProcess process = new WorkflowProcess();
        process.setSurecTipi(SUREC_TIPI);
        process.setBaslangicTarihi(LocalDateTime.now());
        process.setDurum("ACIK");
        process.setSurecNo("TEMP");
        process.setReferansModul("RISK");
        process = processRepository.save(process);
        process.setSurecNo(String.valueOf(process.getId()));
        process = processRepository.save(process);

        String hesapNo = "SIL".equals(talepTuru) ? eskiDeger.getHesapNo() : yeniDeger.getHesapNo();
        Account account = accountRepository.findByHesapNo(hesapNo);

        HisseRiskParametreTalebi talep = new HisseRiskParametreTalebi();
        talep.setProcess(process);
        talep.setTalepEden(talepEden);
        talep.setAccount(account);
        talep.setDurum("BEKLEMEDE");
        talep.setTalepTuru(talepTuru);
        talep.setOlusturmaTarihi(LocalDateTime.now());

        try {
            talep.setOncekiDegerJson(eskiDeger == null ? "{}" : objectMapper.writeValueAsString(eskiDeger));
            talep.setYeniDegerJson(yeniDeger == null ? "{}" : objectMapper.writeValueAsString(yeniDeger));
            talep.setDegisiklikListesiJson(hesaplaFark(eskiDeger, yeniDeger, talepTuru));
        } catch (Exception e) {
            throw new RuntimeException("JSON donusum hatasi", e);
        }

        talepRepository.save(talep);

        workflowTaskService.createOnayTasksForRole(process, SUREC_TIPI, talepEden.getId(),
                "Risk Profili " + talepTuru + " Onay Islemi (" + hesapNo + ")");

        return process;
    }

    private String hesaplaFark(com.orion.risk.dto.HisseRiskParametresiFormDto eskiDto, com.orion.risk.dto.HisseRiskParametresiFormDto yeniDto, String talepTuru) throws Exception {
        List<Map<String, String>> farkListesi = new ArrayList<>();
        if ("SIL".equals(talepTuru)) {
            farkListesi.add(Map.of("alan", "Tüm Kayıt", "eskiDeger", "Mevcut", "yeniDeger", "SİLİNECEK"));
            return objectMapper.writeValueAsString(farkListesi);
        }
        if ("EKLE".equals(talepTuru)) {
            farkListesi.add(Map.of("alan", "Tüm Kayıt", "eskiDeger", "-", "yeniDeger", "YENI EKLENECEK"));
            return objectMapper.writeValueAsString(farkListesi);
        }

        // DUZENLE
        compareField(farkListesi, "Kullanici Tipi", eskiDto.getKullaniciTipi(), yeniDto.getKullaniciTipi());
        compareField(farkListesi, "Alis Kontrol Tipi", eskiDto.getAlisKontrolTipi(), yeniDto.getAlisKontrolTipi());
        compareField(farkListesi, "Satis Kontrol Tipi", eskiDto.getSatisKontrolTipi(), yeniDto.getSatisKontrolTipi());
        compareField(farkListesi, "Acik Satis Kontrol Tipi", eskiDto.getAcikSatisKontrolTipi(), yeniDto.getAcikSatisKontrolTipi());
        compareField(farkListesi, "Acik Takas Limiti", eskiDto.getAcikTakasLimiti(), yeniDto.getAcikTakasLimiti());
        compareField(farkListesi, "Aciga Satis Limiti", eskiDto.getAcigaSatisLimiti(), yeniDto.getAcigaSatisLimiti());
        compareField(farkListesi, "Net Varlik Limit Carpani", eskiDto.getNetVarlikLimitCarpani(), yeniDto.getNetVarlikLimitCarpani());
        compareField(farkListesi, "Kredisiz A Grubu Alis", eskiDto.isKredisizGrupAAlisYapabilir(), yeniDto.isKredisizGrupAAlisYapabilir());
        compareField(farkListesi, "B Grubu Alis", eskiDto.isGrupBAlisYapabilir(), yeniDto.isGrupBAlisYapabilir());
        compareField(farkListesi, "C Grubu Alis", eskiDto.isGrupCAlisYapabilir(), yeniDto.isGrupCAlisYapabilir());
        compareField(farkListesi, "D Grubu Alis", eskiDto.isGrupDAlisYapabilir(), yeniDto.isGrupDAlisYapabilir());
        compareField(farkListesi, "Kredisiz A Grubu Nakit Kontrol", eskiDto.isKredisizGrupANakitKontrol(), yeniDto.isKredisizGrupANakitKontrol());
        compareField(farkListesi, "B Grubu Nakit Kontrol", eskiDto.isGrupBNakitKontrol(), yeniDto.isGrupBNakitKontrol());
        compareField(farkListesi, "C Grubu Nakit Kontrol", eskiDto.isGrupCNakitKontrol(), yeniDto.isGrupCNakitKontrol());
        compareField(farkListesi, "D Grubu Nakit Kontrol", eskiDto.isGrupDNakitKontrol(), yeniDto.isGrupDNakitKontrol());
        compareField(farkListesi, "Kredisiz Paylarda Kontrolsuz Satis", eskiDto.isKredisizPaylardaKontrolsuzSatis(), yeniDto.isKredisizPaylardaKontrolsuzSatis());

        return objectMapper.writeValueAsString(farkListesi);
    }

    private void compareField(List<Map<String, String>> list, String alan, Object eskiDeger, Object yeniDeger) {
        if (!Objects.equals(eskiDeger, yeniDeger)) {
            Map<String, String> map = new HashMap<>();
            map.put("alan", alan);
            map.put("eskiDeger", eskiDeger != null ? eskiDeger.toString() : "");
            map.put("yeniDeger", yeniDeger != null ? yeniDeger.toString() : "");
            list.add(map);
        }
    }


    /**
     * Talepleri onaylar: yeniDegerJson'daki degerleri hisse_risk_parametreleri
     * tablosuna uygular, talepleri ONAYLANDI yapar, sureci kapatir.
     */
    @Transactional
    public void onayla(Long processId, User kararVeren) {
        List<HisseRiskParametreTalebi> talepler = talepRepository.findByProcessId(processId);
        LocalDateTime now = LocalDateTime.now();

        for (HisseRiskParametreTalebi talep : talepler) {
            if (!"BEKLEMEDE".equals(talep.getDurum())) {
                continue;
            }

            if ("TOPLU_GUNCELLEME".equals(talep.getTalepTuru())) {
                Integer yeniDeger = parseNetVarlikLimitCarpani(talep.getYeniDegerJson());
                if (yeniDeger != null) {
                    List<HisseRiskParametresi> parametreler = parametreRepository.findByAccountId(talep.getAccount().getId());
                    for (HisseRiskParametresi parametre : parametreler) {
                        parametre.setNetVarlikLimitCarpani(yeniDeger);
                        parametre.setGuncellemeTarihi(now);
                        parametreRepository.save(parametre);
                    }
                }
            } else if ("SIL".equals(talep.getTalepTuru())) {
                List<HisseRiskParametresi> parametreler = parametreRepository.findByAccountId(talep.getAccount().getId());
                for (HisseRiskParametresi parametre : parametreler) {
                    hisseRiskParametreleriService.sil(parametre.getId());
                }
            } else { // EKLE veya DUZENLE
                try {
                    com.orion.risk.dto.HisseRiskParametresiFormDto dto = objectMapper.readValue(talep.getYeniDegerJson(), com.orion.risk.dto.HisseRiskParametresiFormDto.class);
                    Long id = null;
                    if ("DUZENLE".equals(talep.getTalepTuru())) {
                        List<HisseRiskParametresi> parametreler = parametreRepository.findByAccountId(talep.getAccount().getId());
                        if (!parametreler.isEmpty()) {
                            id = parametreler.get(0).getId();
                        }
                    }
                    hisseRiskParametreleriService.kaydet(id, dto.getHesapNo(), dto.getKullaniciTipi(),
                            dto.getAlisKontrolTipi(), dto.getSatisKontrolTipi(), dto.getAcikSatisKontrolTipi(),
                            dto.getAcikTakasLimiti(), dto.getAcigaSatisLimiti(), dto.getNetVarlikLimitCarpani(),
                            dto.isKredisizGrupAAlisYapabilir(), dto.isGrupBAlisYapabilir(), dto.isGrupCAlisYapabilir(), dto.isGrupDAlisYapabilir(),
                            dto.isKredisizGrupANakitKontrol(), dto.isGrupBNakitKontrol(), dto.isGrupCNakitKontrol(), dto.isGrupDNakitKontrol(),
                            dto.isKredisizPaylardaKontrolsuzSatis());
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                    throw new RuntimeException("Onaylama islemi sirasinda JSON hatasi", e);
                }
            }

            talep.setDurum("ONAYLANDI");
            talep.setKararTarihi(now);
            talep.setKararVeren(kararVeren);
            talepRepository.save(talep);
        }

        // Sureci kapat
        WorkflowProcess process = processRepository.findById(processId).orElseThrow();
        process.setDurum("TAMAMLANDI");
        processRepository.save(process);

        // Tum gorevleri kapat
        workflowTaskService.closeAllTasksForProcess(processId);
    }

    /**
     * Talepleri reddeder: degisiklik uygulanmaz, talepler REDDEDILDI olarak
     * isaretlenir, surec kapatilir.
     */
    @Transactional
    public void reddet(Long processId, User kararVeren) {
        List<HisseRiskParametreTalebi> talepler = talepRepository.findByProcessId(processId);
        LocalDateTime now = LocalDateTime.now();

        for (HisseRiskParametreTalebi talep : talepler) {
            if (!"BEKLEMEDE".equals(talep.getDurum())) {
                continue;
            }
            talep.setDurum("REDDEDILDI");
            talep.setKararTarihi(now);
            talep.setKararVeren(kararVeren);
            talepRepository.save(talep);
        }

        // Sureci kapat
        WorkflowProcess process = processRepository.findById(processId).orElseThrow();
        process.setDurum("TAMAMLANDI");
        processRepository.save(process);

        // Tum gorevleri kapat
        workflowTaskService.closeAllTasksForProcess(processId);
    }

    /**
     * Inceleme ekrani icin tum talepleri (join fetch ile) dondurur.
     */
    @Transactional(readOnly = true)
    public List<HisseRiskParametreTalebi> getTaleplerForReview(Long processId) {
        return talepRepository.findByProcessIdFetched(processId);
    }

    /**
     * Basit JSON parser — {"netVarlikLimitCarpani":3} formatindan degeri okur.
     * Tam bir JSON kutuphanesi bagimliligini onlemek icin string manipulasyonu.
     */
    private static Integer parseNetVarlikLimitCarpani(String json) {
        if (json == null) {
            return null;
        }
        try {
            // {"netVarlikLimitCarpani":3}
            int idx = json.indexOf("\"netVarlikLimitCarpani\":");
            if (idx < 0) {
                return null;
            }
            String afterKey = json.substring(idx + "\"netVarlikLimitCarpani\":".length());
            // afterKey is now "3}" or " 3 }"
            StringBuilder sb = new StringBuilder();
            for (char c : afterKey.toCharArray()) {
                if (Character.isDigit(c)) {
                    sb.append(c);
                } else if (sb.length() > 0) {
                    break;
                }
            }
            return sb.length() > 0 ? Integer.parseInt(sb.toString()) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
