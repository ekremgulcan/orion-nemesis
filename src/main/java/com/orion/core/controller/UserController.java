package com.orion.core.controller;

import com.orion.core.dto.RoleDto;
import com.orion.core.dto.RoleMapper;
import com.orion.core.dto.UserDto;
import com.orion.core.dto.UserFormDto;
import com.orion.core.dto.UserMapper;
import com.orion.core.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Yonetim Paneli" ekrani (kullanicilar.zul / KullaniciListesiViewModel)
 * icin REST API karsiligi - nemesis-frontend tarafindan tuketilir. Ayni
 * UserService'i ZK ViewModel ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/core/users")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;

    public UserController(UserService userService, UserMapper userMapper, RoleMapper roleMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
    }

    @GetMapping
    public List<UserDto> getAll(@RequestParam(required = false) String q) {
        return userMapper.toDtoList(userService.search(q));
    }

    @GetMapping("/roles")
    public List<RoleDto> getAllRoles() {
        return roleMapper.toDtoList(userService.getAllRoles());
    }

    @PostMapping
    public ResponseEntity<UserDto> create(@RequestBody UserFormDto body) {
        var created = userService.kaydet(null, body.getKullaniciAdi(), body.getAdSoyad(),
                body.getEmail(), body.isAktif(), body.getRolIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(userMapper.toDto(created));
    }

    @PutMapping("/{id}")
    public UserDto update(@PathVariable Long id, @RequestBody UserFormDto body) {
        var updated = userService.kaydet(id, body.getKullaniciAdi(), body.getAdSoyad(),
                body.getEmail(), body.isAktif(), body.getRolIds());
        return userMapper.toDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.sil(id);
        return ResponseEntity.noContent().build();
    }
}
