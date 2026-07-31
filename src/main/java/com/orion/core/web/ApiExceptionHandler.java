package com.orion.core.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Butun /api/v1/** REST controller'lari icin ortak hata donusumu. Servis
 * katmani ZK ViewModel'lerinde oldugu gibi is kurali ihlallerini
 * IllegalArgumentException/IllegalStateException ile fırlatiyor - bu
 * sinif bunlari standart bir JSON hata govdesine ({"message": "..."})
 * cevirip uygun HTTP status koduna baglar. Hata mesajlarinin metni
 * (cogunlukla Turkce domain kurallari) oldugu gibi korunur, React
 * tarafinda paraphrase edilmemelidir.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Kayit bulunamadi"));
    }
}
