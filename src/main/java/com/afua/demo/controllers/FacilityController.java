package com.afua.demo.controllers;


import com.afua.demo.model.Facility;
import com.afua.demo.service.FacilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    // GET /facilities
    @GetMapping
    public ResponseEntity<List<Facility>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    // GET /facilities/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }
}