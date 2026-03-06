package com.skillbridge.backend.controller;

import com.skillbridge.backend.enums.CompanyRole;
import com.skillbridge.backend.service.CompanyMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/company-member")
public class CompanyMember {
    @Autowired
    CompanyMemberService companyMemberService;

    @GetMapping("/getRole")
    public CompanyRole getRle (){
        return companyMemberService.getRole();
    }
}
