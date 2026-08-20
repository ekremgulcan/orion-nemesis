package com.orion.core.repository;

import com.orion.core.domain.CustomerChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerChannelRepository extends JpaRepository<CustomerChannel, Long> {
    List<CustomerChannel> findByCustomerId(Long customerId);
}
