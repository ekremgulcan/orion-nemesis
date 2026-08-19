package com.orion.notification.repository;

import com.orion.notification.domain.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationCategoryRepository extends JpaRepository<NotificationCategory, Long> {
    List<NotificationCategory> findAllByOrderBySiraAsc();

    Optional<NotificationCategory> findByKod(String kod);
}
