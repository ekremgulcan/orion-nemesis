package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * "POST /notifPreferences/update" istek govdesi - servis dokumaninin
 * section 3.3/3.4 ile birebir ayni sekil.
 */
@Getter
@Setter
public class NotifPreferencesUpdateRequest {
    private String username;
    private List<NotifPreferencesUpdateItem> updates;
}
