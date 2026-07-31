package com.orion.core.repository;

import com.orion.core.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByKullaniciAdi(String kullaniciAdi);

    @Query("select distinct u from User u left join fetch u.roller order by u.kullaniciAdi")
    List<User> findAllFetched();

    @Query("select distinct u from User u left join fetch u.roller " +
            "where lower(u.kullaniciAdi) like lower(concat('%', :q, '%')) " +
            "or lower(u.adSoyad) like lower(concat('%', :q, '%')) " +
            "or lower(u.email) like lower(concat('%', :q, '%')) " +
            "order by u.kullaniciAdi")
    List<User> search(String q);
}
