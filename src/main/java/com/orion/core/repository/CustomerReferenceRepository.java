package com.orion.core.repository;

import com.orion.core.domain.CustomerReference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerReferenceRepository extends JpaRepository<CustomerReference, Long> {
    List<CustomerReference> findByCustomerId(Long customerId);
}
