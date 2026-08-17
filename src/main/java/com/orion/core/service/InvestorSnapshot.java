package com.orion.core.service;

import com.orion.core.domain.Account;
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
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class InvestorSnapshot {
    private Customer customer;
    private CustomerIdentity identity;
    private List<Account> hesaplar = new ArrayList<>();
    private List<CustomerAddress> adresler = new ArrayList<>();
    private List<CustomerContact> iletisimler = new ArrayList<>();
    private List<CustomerChannel> kanallar = new ArrayList<>();
    private List<CustomerRequiredDocument> belgeler = new ArrayList<>();
    private List<CustomerNote> notlar = new ArrayList<>();
    private List<CustomerExternalBankAccount> disHesaplar = new ArrayList<>();
    private List<CustomerEducation> egitimler = new ArrayList<>();
    private List<CustomerReference> referanslar = new ArrayList<>();
    private List<CustomerWebmailerPref> webmailer = new ArrayList<>();
    private List<CustomerSuitabilityTest> testler = new ArrayList<>();
    private List<CustomerExternalUserId> disKullanicilar = new ArrayList<>();
}
