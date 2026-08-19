package com.orion.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * Bir kategorinin TEK bir kanali (push/sms/email) icin durum objesi -
 * servis dokumanindaki notifChannelCode.push/sms/email alanlarinin
 * birebir karsiligi.
 *
 * DIKKAT: Jackson, "isEnabled()" gibi bir getter'dan varsayilan olarak
 * "enabled" (bas "is" atilir) property adi turetir - dokumanin istedigi
 * TAM harfiyle "isEnabled"/"isEditable" JSON alan adlarini garantilemek
 * icin @JsonProperty ile acikca belirtiliyor, Jackson'in varsayilan
 * turetmesine guvenilmiyor.
 */
@Getter
@Setter
public class NotifChannelStatusDto {

    @JsonProperty("isEnabled")
    private boolean enabled;

    @JsonProperty("isEditable")
    private boolean editable;

    public NotifChannelStatusDto() {
    }

    public NotifChannelStatusDto(boolean enabled, boolean editable) {
        this.enabled = enabled;
        this.editable = editable;
    }
}
