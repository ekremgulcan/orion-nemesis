package com.orion.core.repository;

import com.orion.core.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Customer findByMusteriNo(String musteriNo);

    @Query("select max(c.yatirimciNo) from Customer c")
    Long findMaxYatirimciNo();

    @Query("select c from Customer c where lower(c.musteriNo) like lower(concat('%', :q, '%')) " +
            "or lower(c.adSoyadUnvan) like lower(concat('%', :q, '%')) " +
            "or lower(c.tcknVkn) like lower(concat('%', :q, '%')) " +
            "order by c.musteriNo")
    List<Customer> search(String q);
}
