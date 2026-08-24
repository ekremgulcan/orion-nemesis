package com.orion.risk.repository;

import com.orion.risk.domain.HisseRiskParametresi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HisseRiskParametresiRepository extends JpaRepository<HisseRiskParametresi, Long> {

    @Query("select p from HisseRiskParametresi p left join fetch p.account a left join fetch a.customer "
            + "order by p.id")
    List<HisseRiskParametresi> findAllFetched();

    @Query("select p from HisseRiskParametresi p left join fetch p.account a left join fetch a.customer c "
            + "where (:musteriNo is null or lower(c.musteriNo) like lower(concat('%', :musteriNo, '%'))) "
            + "and (:hesapNo is null or lower(a.hesapNo) like lower(concat('%', :hesapNo, '%'))) "
            + "and (:kullaniciTipi is null or p.kullaniciTipi = :kullaniciTipi) "
            + "order by p.id")
    List<HisseRiskParametresi> search(@Param("musteriNo") String musteriNo,
                                       @Param("hesapNo") String hesapNo,
                                       @Param("kullaniciTipi") String kullaniciTipi);

    List<HisseRiskParametresi> findByAccountId(Long accountId);
}
