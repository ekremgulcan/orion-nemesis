package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class InvestorSnapshotDto {
    private InvestorDto customer;
    private InvestorIdentityDto identity;
    private List<InvestorAccountDto> hesaplar = new ArrayList<>();
    private List<AddressDto> adresler = new ArrayList<>();
    private List<ContactDto> iletisimler = new ArrayList<>();
    private List<ChannelDto> kanallar = new ArrayList<>();
    private List<DocumentDto> belgeler = new ArrayList<>();
    private List<NoteDto> notlar = new ArrayList<>();
    private List<ExternalBankDto> disHesaplar = new ArrayList<>();
    private List<EducationDto> egitimler = new ArrayList<>();
    private List<ReferenceDto> referanslar = new ArrayList<>();
    private List<WebmailerDto> webmailer = new ArrayList<>();
    private List<SuitabilityDto> testler = new ArrayList<>();
    private List<ExternalUserDto> disKullanicilar = new ArrayList<>();

    @Getter @Setter
    public static class AddressDto {
        private Long id;
        private String adresTipi;
        private String ulke;
        private String il;
        private String ilce;
        private String mahalle;
        private String caddeSokak;
        private String kapiNo;
        private String postaKodu;
        private boolean varsayilan;
    }

    @Getter @Setter
    public static class ContactDto {
        private Long id;
        private String iletisimTipi;
        private String deger;
        private boolean varsayilan;
    }

    @Getter @Setter
    public static class ChannelDto {
        private Long id;
        private String kanal;
        private boolean yetkili;
        private String durum;
    }

    @Getter @Setter
    public static class DocumentDto {
        private Long id;
        private String dokumanTipi;
        private LocalDate getirilisTarihi;
        private LocalDate gecerlilikTarihi;
        private String versiyon;
        private boolean secili;
    }

    @Getter @Setter
    public static class NoteDto {
        private Long id;
        private String notTipi;
        private String notMetni;
        private LocalDateTime guncellemeTarihi;
    }

    @Getter @Setter
    public static class ExternalBankDto {
        private Long id;
        private String referansKurum;
        private String subeAdi;
        private String hesapNo;
        private String iban;
        private String paraBirimi;
        private boolean gvtVar;
        private String hesapSahibi;
        private String hesapTipi;
    }

    @Getter @Setter
    public static class EducationDto {
        private Long id;
        private String egitimDerecesi;
        private String okul;
        private String fakulte;
        private String bolum;
        private LocalDate mezuniyetTarihi;
    }

    @Getter @Setter
    public static class ReferenceDto {
        private Long id;
        private String referansAdi;
        private String referansTelefon;
        private String referansKurum;
        private String aciklama;
    }

    @Getter @Setter
    public static class WebmailerDto {
        private Long id;
        private String uyeId;
        private String raporAciklamasi;
        private String eposta;
        private boolean secili;
    }

    @Getter @Setter
    public static class SuitabilityDto {
        private Long id;
        private String testTipi;
        private LocalDate testTarihi;
        private String testSonucu;
    }

    @Getter @Setter
    public static class ExternalUserDto {
        private Long id;
        private String disSistem;
        private String kullaniciKodu;
    }
}
