package com.orion.notification.repository;

import com.orion.notification.domain.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationTypeRepository extends JpaRepository<NotificationType, Long> {
    List<NotificationType> findAllByOrderBySiraAsc();
}
