package com.orion.core.repository;

import com.orion.core.domain.AccountPartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountPartnerRepository extends JpaRepository<AccountPartner, Long> {
    List<AccountPartner> findByAccountId(Long accountId);
}
