package com.orion.risk.controller;

import com.orion.risk.dto.RiskProfileDto;
import com.orion.risk.dto.RiskProfileMapper;
import com.orion.risk.dto.UserLimitDto;
import com.orion.risk.dto.UserLimitMapper;
import com.orion.risk.service.RiskProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Yeni Hisse Emir Yonetimi" / "Sabit Getiri Risk Tanimlama" ekranlarinin
 * (risk-parametreleri.zul / RiskParametreleriViewModel) REST API karsiligi.
 * Salt-okunur: sadece RiskProfile ve UserLimit listelerini "tip" (HISSE/SGMK)
 * ve arama parametresiyle dondurur. Ayni RiskProfileService'i ZK ViewModel
 * ile birebir paylasir, is mantigina dokunulmaz.
 */
@RestController
@RequestMapping("/api/v1/risk")
public class RiskParametreleriController {

    private final RiskProfileService service;
    private final RiskProfileMapper riskProfileMapper;
    private final UserLimitMapper userLimitMapper;

    public RiskParametreleriController(RiskProfileService service,
                                        RiskProfileMapper riskProfileMapper,
                                        UserLimitMapper userLimitMapper) {
        this.service = service;
        this.riskProfileMapper = riskProfileMapper;
        this.userLimitMapper = userLimitMapper;
    }

    @GetMapping("/risk-profiles")
    public List<RiskProfileDto> getRiskProfiles(@RequestParam String tip,
                                                 @RequestParam(required = false) String q) {
        return riskProfileMapper.toDtoList(service.searchRiskProfiles(tip, q));
    }

    @GetMapping("/user-limits")
    public List<UserLimitDto> getUserLimits(@RequestParam String tip,
                                             @RequestParam(required = false) String q) {
        return userLimitMapper.toDtoList(service.searchUserLimits(tip, q));
    }
}
