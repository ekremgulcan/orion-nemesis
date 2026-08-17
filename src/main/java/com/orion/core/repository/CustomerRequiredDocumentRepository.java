package com.orion.core.repository;

import com.orion.core.domain.CustomerRequiredDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRequiredDocumentRepository extends JpaRepository<CustomerRequiredDocument, Long> {
    List<CustomerRequiredDocument> findByCustomerId(Long customerId);
}
