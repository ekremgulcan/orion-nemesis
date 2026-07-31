package com.orion.risk.repository;

import com.orion.risk.domain.UserLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserLimitRepository extends JpaRepository<UserLimit, Long> {

    @Query("select l from UserLimit l join fetch l.user where l.enstrumanTipi = :tip order by l.id")
    List<UserLimit> findByEnstrumanTipi(@Param("tip") String tip);

    @Query("select l from UserLimit l join fetch l.user order by l.id")
    List<UserLimit> findAllFetched();

    @Query("select l from UserLimit l join fetch l.user u "
            + "where l.enstrumanTipi = :tip and lower(u.adSoyad) like lower(concat('%', :q, '%')) "
            + "order by l.id")
    List<UserLimit> searchByEnstrumanTipi(@Param("tip") String tip, @Param("q") String q);
}
