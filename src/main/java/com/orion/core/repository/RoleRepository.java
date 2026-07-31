package com.orion.core.repository;

import com.orion.core.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByRolAdi(String rolAdi);
}
