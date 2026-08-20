package com.orion.core.repository;

import com.orion.core.domain.CustomerExternalUserId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerExternalUserIdRepository extends JpaRepository<CustomerExternalUserId, Long> {
    List<CustomerExternalUserId> findByCustomerId(Long customerId);
}
