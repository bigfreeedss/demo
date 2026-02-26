package com.afua.demo.service;

import com.afua.demo.exception.*;
import com.afua.demo.model.*;
import com.afua.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final bookingRepository  bookingRepository;
    private final facilityRepository facilityRepository;
    private final userRepository     userRepository;

    // ── GET ALL ──────────────────────────────────────────────────
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ── GET ONE ──────────────────────────────────────────────────
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Booking not found with id: " + id));
    }

    // ── CREATE ───────────────────────────────────────────────────
    public Booking createBooking(Long facilityId, Long userId,
                                 LocalDate date, LocalTime startTime,
                                 LocalTime endTime) {
        validateTimeOrder(startTime, endTime);

        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Facility not found with id: " + facilityId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "User not found with id: " + userId));

        checkConflict(facilityId, date, startTime, endTime, null);

        Booking booking = new Booking();
        booking.setFacility(facility);
        booking.setUser(user);
        booking.setDate(date);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setStatus("pending");

        return bookingRepository.save(booking);
    }

    // ── UPDATE ───────────────────────────────────────────────────
    public Booking updateBooking(Long bookingId, Long facilityId, Long userId,
                                 LocalDate date, LocalTime startTime,
                                 LocalTime endTime, String status) {
        Booking existing = getBookingById(bookingId);

        validateTimeOrder(startTime, endTime);

        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Facility not found with id: " + facilityId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "User not found with id: " + userId));

        // Exclude current booking from conflict check (allows re-saving same slot)
        checkConflict(facilityId, date, startTime, endTime, bookingId);

        existing.setFacility(facility);
        existing.setUser(user);
        existing.setDate(date);
        existing.setStartTime(startTime);
        existing.setEndTime(endTime);
        existing.setStatus(status);

        return bookingRepository.save(existing);
    }

    // ── DELETE (Cancel) ──────────────────────────────────────────
    public void cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus("cancelled");
        bookingRepository.save(booking);
    }

    // ── AVAILABILITY ─────────────────────────────────────────────
    public List<Booking> checkAvailability(Long facilityId, LocalDate date,
                                           LocalTime startTime, LocalTime endTime) {
        facilityRepository.findById(facilityId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Facility not found with id: " + facilityId));
        validateTimeOrder(startTime, endTime);
        return bookingRepository.findConflictingBookings(
            facilityId, date, startTime, endTime, null);
    }

    // ── HELPERS ──────────────────────────────────────────────────
    private void validateTimeOrder(LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException(
                "end_time must be after start_time");
        }
    }

    private void checkConflict(Long facilityId, LocalDate date,
                                LocalTime startTime, LocalTime endTime,
                                Long excludeId) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            facilityId, date, startTime, endTime, excludeId);
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                "Facility is already booked during the requested time slot.");
        }
    }
}