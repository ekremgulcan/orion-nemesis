package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Servis dokumanindaki "notifChannelCode" objesi - push/sms/email
 * anahtarlariyla (Ingilizce, kucuk harf) sabit 3 alanli bir obje.
 * BildirimKanali enum'u (PUSH/SMS/EPOSTA, "Bildirim Ayarlari" ekraniyla
 * paylasilir) burada KULLANILMAZ - dokumanin anahtarlari (push/sms/email)
 * o enum'un isimleriyle (PUSH/SMS/EPOSTA) birebir uyusmuyor (ozellikle
 * "email" vs "EPOSTA"), bu yuzden sabit 3 alanli duz bir POJO tercih
 * edildi (Map<BildirimKanali,...> kullanmak Jackson'da anahtar olarak
 * "PUSH"/"SMS"/"EPOSTA" uretirdi, dokumanla uyusmazdi).
 */
@Getter
@Setter
public class NotifChannelCodeDto {
    private NotifChannelStatusDto push;
    private NotifChannelStatusDto sms;
    private NotifChannelStatusDto email;
}
