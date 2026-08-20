package com.orion.core.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "account_control_values")
@Getter
@Setter
public class AccountControlValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "control_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "kontrol_adi", nullable = false)
    private String kontrolAdi;

    @Column(name = "kontrol_degeri")
    private String kontrolDegeri;
}
