package com.orion.core.dto;

import com.orion.core.domain.Account;
import com.orion.core.domain.AccountChannel;
import com.orion.core.domain.AccountCommission;
import com.orion.core.domain.AccountContract;
import com.orion.core.domain.AccountControlValue;
import com.orion.core.domain.AccountCustody;
import com.orion.core.domain.AccountDerivativeCommission;
import com.orion.core.domain.AccountGroup;
import com.orion.core.domain.AccountHiddenAccount;
import com.orion.core.domain.AccountPartner;
import com.orion.core.domain.AccountProxy;
import com.orion.core.domain.AccountReportingPref;
import com.orion.core.domain.Customer;
import com.orion.core.domain.CustomerAddress;
import com.orion.core.domain.CustomerChannel;
import com.orion.core.domain.CustomerContact;
import com.orion.core.domain.CustomerEducation;
import com.orion.core.domain.CustomerExternalBankAccount;
import com.orion.core.domain.CustomerExternalUserId;
import com.orion.core.domain.CustomerIdentity;
import com.orion.core.domain.CustomerNote;
import com.orion.core.domain.CustomerReference;
import com.orion.core.domain.CustomerRequiredDocument;
import com.orion.core.domain.CustomerSuitabilityTest;
import com.orion.core.domain.CustomerWebmailerPref;
import com.orion.core.service.InvestorSnapshot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface InvestorMapper {

    @Mapping(target = "hesaplar", ignore = true)
    Customer toCustomer(InvestorDto dto);

    InvestorDto toInvestorDto(Customer entity);

    CustomerIdentity toIdentity(InvestorIdentityDto dto);

    InvestorIdentityDto toIdentityDto(CustomerIdentity entity);

    Account toAccount(InvestorAccountDto dto);

    InvestorAccountDto toAccountDto(Account entity);

    InvestorSnapshotDto.AddressDto toAddressDto(CustomerAddress entity);

    CustomerAddress toAddress(InvestorSnapshotDto.AddressDto dto);

    InvestorSnapshotDto.ContactDto toContactDto(CustomerContact entity);

    CustomerContact toContact(InvestorSnapshotDto.ContactDto dto);

    InvestorSnapshotDto.ChannelDto toChannelDto(CustomerChannel entity);

    InvestorSnapshotDto.DocumentDto toDocumentDto(CustomerRequiredDocument entity);

    CustomerRequiredDocument toDocument(InvestorSnapshotDto.DocumentDto dto);

    InvestorSnapshotDto.NoteDto toNoteDto(CustomerNote entity);

    InvestorSnapshotDto.ExternalBankDto toExternalBankDto(CustomerExternalBankAccount entity);

    CustomerExternalBankAccount toExternalBank(InvestorSnapshotDto.ExternalBankDto dto);

    InvestorSnapshotDto.EducationDto toEducationDto(CustomerEducation entity);

    CustomerEducation toEducation(InvestorSnapshotDto.EducationDto dto);

    InvestorSnapshotDto.ReferenceDto toReferenceDto(CustomerReference entity);

    CustomerReference toReference(InvestorSnapshotDto.ReferenceDto dto);

    InvestorSnapshotDto.WebmailerDto toWebmailerDto(CustomerWebmailerPref entity);

    CustomerWebmailerPref toWebmailer(InvestorSnapshotDto.WebmailerDto dto);

    InvestorSnapshotDto.SuitabilityDto toSuitabilityDto(CustomerSuitabilityTest entity);

    InvestorSnapshotDto.ExternalUserDto toExternalUserDto(CustomerExternalUserId entity);

    AccountExtrasDto.ProxyDto toProxyDto(AccountProxy entity);

    AccountProxy toProxy(AccountExtrasDto.ProxyDto dto);

    AccountExtrasDto.PartnerDto toPartnerDto(AccountPartner entity);

    AccountPartner toPartner(AccountExtrasDto.PartnerDto dto);

    AccountExtrasDto.CommissionDto toCommissionDto(AccountCommission entity);

    AccountExtrasDto.ContractDto toContractDto(AccountContract entity);

    AccountContract toContract(AccountExtrasDto.ContractDto dto);

    InvestorSnapshotDto.ChannelDto toAccountChannelDto(AccountChannel entity);

    AccountExtrasDto.GroupDto toGroupDto(AccountGroup entity);

    AccountExtrasDto.CustodyDto toCustodyDto(AccountCustody entity);

    AccountCustody toCustody(AccountExtrasDto.CustodyDto dto);

    AccountExtrasDto.ControlDto toControlDto(AccountControlValue entity);

    AccountExtrasDto.ReportingDto toReportingDto(AccountReportingPref entity);

    AccountExtrasDto.HiddenDto toHiddenDto(AccountHiddenAccount entity);

    AccountExtrasDto.DerivativeDto toDerivativeDto(AccountDerivativeCommission entity);

    AccountDerivativeCommission toDerivative(AccountExtrasDto.DerivativeDto dto);

    default InvestorAccountOptionDto toOptionDto(Account account) {
        InvestorAccountOptionDto dto = new InvestorAccountOptionDto();
        dto.setId(account.getId());
        dto.setHesapNo(account.getHesapNo());
        dto.setDurum(account.getDurum());
        dto.setHesapSinifi(account.getHesapSinifi());
        if (account.getCustomer() != null) {
            dto.setCustomerId(account.getCustomer().getId());
            dto.setCustomerName(account.getCustomer().getAdSoyadUnvan());
            dto.setYatirimciNo(account.getCustomer().getYatirimciNo());
            dto.setTcknVkn(account.getCustomer().getTcknVkn());
            dto.setYatirimciDurumu(account.getCustomer().getYatirimciDurumu());
            dto.setMusteriSiniflandirmasi(account.getCustomer().getMusteriSiniflandirmasi());
            dto.setNitelikliYatirimci(account.getCustomer().isNitelikliYatirimci());
        }
        return dto;
    }

    default List<InvestorAccountOptionDto> toOptionDtoList(List<Account> accounts) {
        return accounts.stream().map(this::toOptionDto).collect(Collectors.toList());
    }

    default InvestorSnapshotDto toSnapshotDto(InvestorSnapshot snap) {
        InvestorSnapshotDto dto = new InvestorSnapshotDto();
        dto.setCustomer(toInvestorDto(snap.getCustomer()));
        dto.setIdentity(toIdentityDto(snap.getIdentity()));
        dto.setHesaplar(snap.getHesaplar().stream().map(this::toAccountDto).collect(Collectors.toList()));
        dto.setAdresler(snap.getAdresler().stream().map(this::toAddressDto).collect(Collectors.toList()));
        dto.setIletisimler(snap.getIletisimler().stream().map(this::toContactDto).collect(Collectors.toList()));
        dto.setKanallar(snap.getKanallar().stream().map(this::toChannelDto).collect(Collectors.toList()));
        dto.setBelgeler(snap.getBelgeler().stream().map(this::toDocumentDto).collect(Collectors.toList()));
        dto.setNotlar(snap.getNotlar().stream().map(this::toNoteDto).collect(Collectors.toList()));
        dto.setDisHesaplar(snap.getDisHesaplar().stream().map(this::toExternalBankDto).collect(Collectors.toList()));
        dto.setEgitimler(snap.getEgitimler().stream().map(this::toEducationDto).collect(Collectors.toList()));
        dto.setReferanslar(snap.getReferanslar().stream().map(this::toReferenceDto).collect(Collectors.toList()));
        dto.setWebmailer(snap.getWebmailer().stream().map(this::toWebmailerDto).collect(Collectors.toList()));
        dto.setTestler(snap.getTestler().stream().map(this::toSuitabilityDto).collect(Collectors.toList()));
        dto.setDisKullanicilar(snap.getDisKullanicilar().stream().map(this::toExternalUserDto).collect(Collectors.toList()));
        return dto;
    }
}
