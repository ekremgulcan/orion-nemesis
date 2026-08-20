package com.orion.core.repository;

import com.orion.core.domain.CustomerWebmailerPref;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerWebmailerPrefRepository extends JpaRepository<CustomerWebmailerPref, Long> {
    List<CustomerWebmailerPref> findByCustomerId(Long customerId);
}
