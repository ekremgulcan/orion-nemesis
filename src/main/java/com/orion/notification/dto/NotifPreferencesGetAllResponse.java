package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * "GET /notifPreferences/getAll" cevabi - servis dokumaninin section 2.5
 * ornek response'uyla birebir ayni sekil.
 */
@Getter
@Setter
public class NotifPreferencesGetAllResponse {
    private String username;
    private List<NotifCategoryDto> notificationCategories;
}
