package com.orion.core.repository;

import com.orion.core.domain.CustomerSuitabilityTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerSuitabilityTestRepository extends JpaRepository<CustomerSuitabilityTest, Long> {
    List<CustomerSuitabilityTest> findByCustomerId(Long customerId);
}
