package com.orion.core.repository;

import com.orion.core.domain.AccountChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountChannelRepository extends JpaRepository<AccountChannel, Long> {
    List<AccountChannel> findByAccountId(Long accountId);
}
