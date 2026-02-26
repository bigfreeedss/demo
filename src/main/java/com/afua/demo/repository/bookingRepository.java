package com.afua.demo.repository;


import com.afua.demo.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface bookingRepository extends JpaRepository<Booking, Long> {

    // Find all bookings for a specific facility on a given date
    List<Booking> findByFacilityIdAndDate(Long facilityId, LocalDate date);

    // Conflict check: overlapping time slots for the same facility on the same date
    // Excludes cancelled bookings and optionally excludes a booking by ID (for updates)
    @Query("""
        SELECT b FROM Booking b
        WHERE b.facility.id = :facilityId
          AND b.date = :date
          AND b.status != 'cancelled'
          AND (:excludeId IS NULL OR b.id != :excludeId)
          AND b.startTime < :endTime
          AND b.endTime > :startTime
    """)
    List<Booking> findConflictingBookings(
        @Param("facilityId") Long facilityId,
        @Param("date")       LocalDate date,
        @Param("startTime")  LocalTime startTime,
        @Param("endTime")    LocalTime endTime,
        @Param("excludeId")  Long excludeId
    );
}