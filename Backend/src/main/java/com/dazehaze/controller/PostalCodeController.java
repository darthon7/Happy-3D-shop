package com.dazehaze.controller;

import com.dazehaze.service.PostalCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public/zipcodes")
@RequiredArgsConstructor
public class PostalCodeController {

    private final PostalCodeService postalCodeService;

    @GetMapping("/{code}")
    public ResponseEntity<Map<String, Object>> getZipCodeDetails(@PathVariable String code) {
        Map<String, Object> details = postalCodeService.getZipCodeDetails(code);
        if (details == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }
}
