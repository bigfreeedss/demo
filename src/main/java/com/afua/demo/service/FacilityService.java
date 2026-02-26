package com.afua.demo.service;

import com.afua.demo.exception.ResourceNotFoundException;
import com.afua.demo.model.Facility;
import com.afua.demo.repository.facilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final facilityRepository facilityRepository;

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public Facility getFacilityById(Long id) {
        return facilityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Facility not found with id: " + id));
    }
}