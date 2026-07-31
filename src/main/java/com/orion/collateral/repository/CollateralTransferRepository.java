package com.orion.collateral.repository;

import com.orion.collateral.domain.CollateralTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CollateralTransferRepository extends JpaRepository<CollateralTransfer, Long> {

    @Query("select t from CollateralTransfer t join fetch t.account a join fetch a.customer "
            + "left join fetch t.instrument left join fetch t.talepEdenKullanici "
            + "left join fetch t.onaylayanKullanici order by t.talepTarihi desc")
    List<CollateralTransfer> findAllFetched();

    @Query("select t from CollateralTransfer t join fetch t.account a join fetch a.customer "
            + "left join fetch t.instrument left join fetch t.talepEdenKullanici "
            + "left join fetch t.onaylayanKullanici where t.durum = :durum order by t.talepTarihi desc")
    List<CollateralTransfer> findByDurum(@Param("durum") String durum);
}
