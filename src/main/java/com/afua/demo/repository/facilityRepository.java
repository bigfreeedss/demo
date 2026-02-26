package com.afua.demo.repository;

import com.afua.demo.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface facilityRepository extends JpaRepository<Facility, Long> {
}