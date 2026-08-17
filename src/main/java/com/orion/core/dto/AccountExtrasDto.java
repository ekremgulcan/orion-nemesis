package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AccountExtrasDto {
    private List<ProxyDto> vekiller = new ArrayList<>();
    private List<PartnerDto> ortaklar = new ArrayList<>();
    private List<CommissionDto> komisyonlar = new ArrayList<>();
    private List<ContractDto> sozlesmeler = new ArrayList<>();
    private List<InvestorSnapshotDto.ChannelDto> hesapKanallari = new ArrayList<>();
    private List<GroupDto> gruplar = new ArrayList<>();
    private List<CustodyDto> saklama = new ArrayList<>();
    private List<ControlDto> kontroller = new ArrayList<>();
    private List<ReportingDto> raporlar = new ArrayList<>();
    private List<HiddenDto> gizliHesaplar = new ArrayList<>();
    private List<DerivativeDto> turevKomisyonlari = new ArrayList<>();

    @Getter @Setter
    public static class ProxyDto {
        private Long id;
        private String kimlikNo;
        private String isim;
        private String soyisim;
        private String babaAdi;
        private String uyruk;
        private String vergiMukellefiyeti;
        private String cinsiyet;
        private String vekilTipi;
    }

    @Getter @Setter
    public static class PartnerDto {
        private Long id;
        private String kimlikNo;
        private String isim;
        private String soyisim;
        private BigDecimal ortaklikPayi;
        private String mkkSicilNo;
        private String takasbankSicilNo;
        private String yatirimciDurumu;
    }

    @Getter @Setter
    public static class CommissionDto {
        private Long id;
        private String islem;
        private String masrafAciklamasi;
        private String parametreAdi;
        private String paraBirimi;
        private String piyasaAdi;
        private BigDecimal komisyonDegeri;
    }

    @Getter @Setter
    public static class ContractDto {
        private Long id;
        private String hizmetTipi;
        private String sozlesmeAdi;
        private LocalDate getirilisTarihi;
        private String versiyon;
    }

    @Getter @Setter
    public static class GroupDto {
        private Long id;
        private String grupAdi;
        private String aciklama;
    }

    @Getter @Setter
    public static class CustodyDto {
        private Long id;
        private String saklamaci;
        private String saklamaHesapNo;
        private String paraBirimi;
    }

    @Getter @Setter
    public static class ControlDto {
        private Long id;
        private String kontrolAdi;
        private String kontrolDegeri;
    }

    @Getter @Setter
    public static class ReportingDto {
        private Long id;
        private String raporTipi;
        private String kanal;
        private boolean aktif;
    }

    @Getter @Setter
    public static class HiddenDto {
        private Long id;
        private String gizliHesapNo;
        private String aciklama;
    }

    @Getter @Setter
    public static class DerivativeDto {
        private Long id;
        private String islem;
        private BigDecimal komisyonDegeri;
        private String paraBirimi;
    }
}
