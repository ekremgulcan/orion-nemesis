package com.orion.notification.repository;

import com.orion.notification.domain.MusteriBildirimTercihi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MusteriBildirimTercihiRepository extends JpaRepository<MusteriBildirimTercihi, Long> {

    @Query("select t from MusteriBildirimTercihi t join fetch t.category " +
            "where t.customer.id = :customerId order by t.category.sira")
    List<MusteriBildirimTercihi> findAllByCustomerIdFetched(@Param("customerId") Long customerId);
}
