package com.orion.risk.repository;

import com.orion.risk.domain.AccountInstrumentControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AccountInstrumentControlRepository extends JpaRepository<AccountInstrumentControl, Long> {

    @Query("select c from AccountInstrumentControl c join fetch c.user join fetch c.account a "
            + "join fetch a.customer join fetch c.instrument order by c.id")
    List<AccountInstrumentControl> findAllFetched();

    @Query("select c from AccountInstrumentControl c join fetch c.user u join fetch c.account a "
            + "join fetch a.customer join fetch c.instrument i "
            + "where lower(u.kullaniciAdi) like lower(concat('%', :q, '%')) "
            + "or lower(a.hesapNo) like lower(concat('%', :q, '%')) "
            + "or lower(i.sembol) like lower(concat('%', :q, '%')) "
            + "order by c.id")
    List<AccountInstrumentControl> search(String q);
}
