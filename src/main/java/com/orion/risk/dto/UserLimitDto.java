package com.orion.risk.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UserLimitDto {
    private Long id;
    private String enstrumanTipi;
    private String userName;
    private BigDecimal gunlukToplamLimit;
    private BigDecimal anlikIslemLimiti;
}
