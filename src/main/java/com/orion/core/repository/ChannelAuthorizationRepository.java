package com.orion.core.repository;

import com.orion.core.domain.ChannelAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChannelAuthorizationRepository extends JpaRepository<ChannelAuthorization, Long> {

    @Query("select c from ChannelAuthorization c join fetch c.user join fetch c.account a "
            + "join fetch a.customer order by c.id")
    List<ChannelAuthorization> findAllFetched();

    @Query("select c from ChannelAuthorization c join fetch c.user u join fetch c.account a "
            + "join fetch a.customer "
            + "where lower(u.kullaniciAdi) like lower(concat('%', :q, '%')) "
            + "or lower(a.hesapNo) like lower(concat('%', :q, '%')) "
            + "or lower(c.kanal) like lower(concat('%', :q, '%')) "
            + "order by c.id")
    List<ChannelAuthorization> search(String q);
}
