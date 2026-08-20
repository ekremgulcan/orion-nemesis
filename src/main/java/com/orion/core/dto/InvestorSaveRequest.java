package com.orion.core.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InvestorSaveRequest {
    private InvestorDto customer;
    private InvestorIdentityDto identity;
}
