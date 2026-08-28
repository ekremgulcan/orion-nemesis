package com.orion.core.controller;

import com.orion.core.dto.AktifKullaniciRequest;
import com.orion.core.dto.UserDto;
import com.orion.core.dto.UserMapper;
import com.orion.core.service.AktifKullaniciServisi;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Su an "oturum acmis" sayilan (simule edilmis) kullaniciyi okumak/
 * degistirmek icin kucuk bir API - hem ZK tarafinin (index.zul aktif
 * kullanici secici) hem nemesis-frontend'in (TopBar) ayni
 * AktifKullaniciServisi durumunu paylasmasini saglar. Bkz. o sinifin
 * javadoc'u - gercek kimlik dogrulama gelene kadar gecici bir cozumdur.
 */
@RestController
@RequestMapping("/api/v1/core/aktif-kullanici")
public class AktifKullaniciController {

    private final AktifKullaniciServisi aktifKullaniciServisi;
    private final UserMapper userMapper;

    public AktifKullaniciController(AktifKullaniciServisi aktifKullaniciServisi, UserMapper userMapper) {
        this.aktifKullaniciServisi = aktifKullaniciServisi;
        this.userMapper = userMapper;
    }

    @GetMapping
    public UserDto getir() {
        return userMapper.toDto(aktifKullaniciServisi.getAktifKullanici());
    }

    @PutMapping
    public UserDto degistir(@RequestBody AktifKullaniciRequest body) {
        aktifKullaniciServisi.setAktifKullanici(body.getKullaniciAdi());
        return userMapper.toDto(aktifKullaniciServisi.getAktifKullanici());
    }
}
