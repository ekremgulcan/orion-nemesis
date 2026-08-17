package com.orion.notification.repository;

import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.domain.NotifChannelTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotifChannelTemplateRepository extends JpaRepository<NotifChannelTemplate, Long> {
    Optional<NotifChannelTemplate> findByNotificationTypeIdAndKanal(Long notificationTypeId, BildirimKanali kanal);
}
