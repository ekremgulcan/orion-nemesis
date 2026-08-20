package com.orion.core.repository;

import com.orion.core.domain.CustomerNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerNoteRepository extends JpaRepository<CustomerNote, Long> {
    List<CustomerNote> findByCustomerId(Long customerId);
}
