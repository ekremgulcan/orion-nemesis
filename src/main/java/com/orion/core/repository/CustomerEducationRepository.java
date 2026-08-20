package com.orion.core.repository;

import com.orion.core.domain.CustomerEducation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerEducationRepository extends JpaRepository<CustomerEducation, Long> {
    List<CustomerEducation> findByCustomerId(Long customerId);
}
