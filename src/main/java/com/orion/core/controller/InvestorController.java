package com.orion.core.controller;

import com.orion.core.domain.Account;
import com.orion.core.domain.Customer;
import com.orion.core.domain.CustomerIdentity;
import com.orion.core.dto.AccountExtrasDto;
import com.orion.core.dto.InvestorAccountDto;
import com.orion.core.dto.InvestorAccountOptionDto;
import com.orion.core.dto.InvestorMapper;
import com.orion.core.dto.InvestorSaveRequest;
import com.orion.core.dto.InvestorSnapshotDto;
import com.orion.core.service.InvestorService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Bireysel Yatirimci Bilgileri REST API. InvestorService is kurallarini
 * ZK ViewModel ile birebir paylasir; entity JSON'a cikmaz.
 */
@RestController
@RequestMapping("/api/v1/core/investors")
public class InvestorController {

    private final InvestorService investorService;
    private final InvestorMapper mapper;

    public InvestorController(InvestorService investorService, InvestorMapper mapper) {
        this.investorService = investorService;
        this.mapper = mapper;
    }

    @GetMapping("/accounts")
    public List<InvestorAccountOptionDto> accounts() {
        return mapper.toOptionDtoList(investorService.getHesapSecenekleri());
    }

    @GetMapping("/blank")
    public InvestorSnapshotDto blank() {
        return mapper.toSnapshotDto(investorService.bosSnapshot());
    }

    @GetMapping("/by-account/{accountId}")
    public InvestorSnapshotDto byAccount(@PathVariable Long accountId) {
        return mapper.toSnapshotDto(investorService.yukleByAccountId(accountId));
    }

    @GetMapping("/{customerId}")
    public InvestorSnapshotDto byCustomer(@PathVariable Long customerId) {
        return mapper.toSnapshotDto(investorService.yukleByCustomerId(customerId));
    }

    @PostMapping
    public InvestorSnapshotDto save(@RequestBody InvestorSaveRequest body) {
        Customer form = mapper.toCustomer(body.getCustomer());
        CustomerIdentity identity = mapper.toIdentity(body.getIdentity() == null
                ? new com.orion.core.dto.InvestorIdentityDto()
                : body.getIdentity());
        Customer saved = investorService.kaydetYatirimci(form, identity);
        return mapper.toSnapshotDto(investorService.yukleByCustomerId(saved.getId()));
    }

    @PostMapping("/{customerId}/accounts")
    public InvestorAccountDto saveAccount(@PathVariable Long customerId, @RequestBody InvestorAccountDto body) {
        Account form = mapper.toAccount(body);
        return mapper.toAccountDto(investorService.kaydetHesap(customerId, form));
    }

    @GetMapping("/accounts/{accountId}/extras")
    public AccountExtrasDto extras(@PathVariable Long accountId) {
        AccountExtrasDto dto = new AccountExtrasDto();
        dto.setVekiller(investorService.proxyList(accountId).stream().map(mapper::toProxyDto).toList());
        dto.setOrtaklar(investorService.partnerList(accountId).stream().map(mapper::toPartnerDto).toList());
        dto.setKomisyonlar(investorService.commissionList(accountId).stream().map(mapper::toCommissionDto).toList());
        dto.setSozlesmeler(investorService.contractList(accountId).stream().map(mapper::toContractDto).toList());
        dto.setHesapKanallari(investorService.accountChannelList(accountId).stream().map(mapper::toAccountChannelDto).toList());
        dto.setGruplar(investorService.groupList(accountId).stream().map(mapper::toGroupDto).toList());
        dto.setSaklama(investorService.custodyList(accountId).stream().map(mapper::toCustodyDto).toList());
        dto.setKontroller(investorService.controlList(accountId).stream().map(mapper::toControlDto).toList());
        dto.setRaporlar(investorService.reportingList(accountId).stream().map(mapper::toReportingDto).toList());
        dto.setGizliHesaplar(investorService.hiddenList(accountId).stream().map(mapper::toHiddenDto).toList());
        dto.setTurevKomisyonlari(investorService.derivativeList(accountId).stream().map(mapper::toDerivativeDto).toList());
        return dto;
    }

    @PostMapping("/{customerId}/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.AddressDto addAddress(@PathVariable Long customerId,
                                                     @RequestBody InvestorSnapshotDto.AddressDto body) {
        return mapper.toAddressDto(investorService.adresEkle(customerId, mapper.toAddress(body)));
    }

    @DeleteMapping("/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@PathVariable Long id) {
        investorService.adresSil(id);
    }

    @PostMapping("/{customerId}/contacts")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.ContactDto addContact(@PathVariable Long customerId,
                                                     @RequestBody InvestorSnapshotDto.ContactDto body) {
        return mapper.toContactDto(investorService.iletisimEkle(customerId, mapper.toContact(body)));
    }

    @PostMapping("/{customerId}/channels")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.ChannelDto addChannel(@PathVariable Long customerId,
                                                     @RequestBody Map<String, String> body) {
        return mapper.toChannelDto(investorService.kanalEkle(customerId, body.get("kanal")));
    }

    @PutMapping("/{customerId}/documents")
    public void saveDocuments(@PathVariable Long customerId,
                              @RequestBody List<InvestorSnapshotDto.DocumentDto> body) {
        investorService.belgelerKaydet(body.stream().map(mapper::toDocument).toList());
    }

    @PostMapping("/{customerId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.NoteDto addNote(@PathVariable Long customerId,
                                               @RequestBody InvestorSnapshotDto.NoteDto body) {
        return mapper.toNoteDto(investorService.notEkle(customerId, body.getNotTipi(), body.getNotMetni()));
    }

    @DeleteMapping("/notes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(@PathVariable Long id) {
        investorService.notSil(id);
    }

    @PostMapping("/{customerId}/external-banks")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.ExternalBankDto addBank(@PathVariable Long customerId,
                                                       @RequestBody InvestorSnapshotDto.ExternalBankDto body) {
        return mapper.toExternalBankDto(investorService.disHesapEkle(customerId, mapper.toExternalBank(body)));
    }

    @PostMapping("/{customerId}/education")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.EducationDto addEducation(@PathVariable Long customerId,
                                                         @RequestBody InvestorSnapshotDto.EducationDto body) {
        return mapper.toEducationDto(investorService.egitimEkle(customerId, mapper.toEducation(body)));
    }

    @PostMapping("/{customerId}/references")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.ReferenceDto addReference(@PathVariable Long customerId,
                                                         @RequestBody InvestorSnapshotDto.ReferenceDto body) {
        return mapper.toReferenceDto(investorService.referansEkle(customerId, mapper.toReference(body)));
    }

    @PutMapping("/{customerId}/webmailer")
    public void saveWebmailer(@PathVariable Long customerId,
                              @RequestBody List<InvestorSnapshotDto.WebmailerDto> body) {
        investorService.webmailerKaydet(body.stream().map(mapper::toWebmailer).toList());
    }

    @PostMapping("/{customerId}/tests")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.SuitabilityDto addTest(@PathVariable Long customerId,
                                                      @RequestBody InvestorSnapshotDto.SuitabilityDto body) {
        LocalDate tarih = body.getTestTarihi() == null ? LocalDate.now() : body.getTestTarihi();
        return mapper.toSuitabilityDto(investorService.testEkle(customerId, body.getTestTipi(), tarih, body.getTestSonucu()));
    }

    @PostMapping("/{customerId}/external-user-ids")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.ExternalUserDto addExternalUser(@PathVariable Long customerId,
                                                               @RequestBody InvestorSnapshotDto.ExternalUserDto body) {
        return mapper.toExternalUserDto(investorService.disKullaniciEkle(customerId, body.getDisSistem(), body.getKullaniciKodu()));
    }

    @PostMapping("/accounts/{accountId}/proxies")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.ProxyDto addProxy(@PathVariable Long accountId, @RequestBody AccountExtrasDto.ProxyDto body) {
        return mapper.toProxyDto(investorService.proxyEkle(accountId, mapper.toProxy(body)));
    }

    @PostMapping("/accounts/{accountId}/partners")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.PartnerDto addPartner(@PathVariable Long accountId, @RequestBody AccountExtrasDto.PartnerDto body) {
        return mapper.toPartnerDto(investorService.partnerEkle(accountId, mapper.toPartner(body)));
    }

    @PostMapping("/accounts/{accountId}/commissions/template")
    public void commissionTemplate(@PathVariable Long accountId, @RequestBody Map<String, BigDecimal> body) {
        investorService.komisyonSablonuGetir(accountId, body.get("deger"));
    }

    @PostMapping("/accounts/{accountId}/contracts")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.ContractDto addContract(@PathVariable Long accountId, @RequestBody AccountExtrasDto.ContractDto body) {
        return mapper.toContractDto(investorService.sozlesmeEkle(accountId, mapper.toContract(body)));
    }

    @PostMapping("/accounts/{accountId}/channels")
    @ResponseStatus(HttpStatus.CREATED)
    public InvestorSnapshotDto.ChannelDto addAccountChannel(@PathVariable Long accountId, @RequestBody Map<String, String> body) {
        return mapper.toAccountChannelDto(investorService.accountKanalEkle(accountId, body.get("kanal")));
    }

    @PostMapping("/accounts/{accountId}/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.GroupDto addGroup(@PathVariable Long accountId, @RequestBody Map<String, String> body) {
        return mapper.toGroupDto(investorService.grupEkle(accountId, body.get("grupAdi")));
    }

    @PostMapping("/accounts/{accountId}/custody")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.CustodyDto addCustody(@PathVariable Long accountId, @RequestBody AccountExtrasDto.CustodyDto body) {
        return mapper.toCustodyDto(investorService.saklamaEkle(accountId, mapper.toCustody(body)));
    }

    @PostMapping("/accounts/{accountId}/controls")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.ControlDto addControl(@PathVariable Long accountId, @RequestBody AccountExtrasDto.ControlDto body) {
        return mapper.toControlDto(investorService.kontrolEkle(accountId, body.getKontrolAdi(), body.getKontrolDegeri()));
    }

    @PostMapping("/accounts/{accountId}/reporting")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.ReportingDto addReporting(@PathVariable Long accountId, @RequestBody AccountExtrasDto.ReportingDto body) {
        return mapper.toReportingDto(investorService.raporEkle(accountId, body.getRaporTipi(), body.getKanal()));
    }

    @PostMapping("/accounts/{accountId}/hidden")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.HiddenDto addHidden(@PathVariable Long accountId, @RequestBody AccountExtrasDto.HiddenDto body) {
        return mapper.toHiddenDto(investorService.gizliHesapEkle(accountId, body.getGizliHesapNo()));
    }

    @PostMapping("/accounts/{accountId}/derivatives")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountExtrasDto.DerivativeDto addDerivative(@PathVariable Long accountId, @RequestBody AccountExtrasDto.DerivativeDto body) {
        return mapper.toDerivativeDto(investorService.turevEkle(accountId, mapper.toDerivative(body)));
    }
}
