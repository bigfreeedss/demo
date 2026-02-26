package com.afua.demo.controllers;

import com.afua.demo.model.Booking;
import com.afua.demo.service.BookingService;
import lombok.RequiredArgsConstructor;

import org.antlr.v4.runtime.misc.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Validated
public class BookingController {

    private final BookingService bookingService;

    // ── GET /bookings ─────────────────────────────────────────────
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ── POST /bookings ────────────────────────────────────────────
    // Request body example:
    // {
    //   "facilityId": 1,
    //   "userId": 2,
    //   "date": "2025-06-10",
    //   "startTime": "09:00",
    //   "endTime": "11:00"
    // }
    @PostMapping("/bookings")
    public ResponseEntity<Booking> createBooking(@RequestBody Map<String, Object> body) {
        Long facilityId  = Long.parseLong(body.get("facilityId").toString());
        Long userId      = Long.parseLong(body.get("userId").toString());
        LocalDate date   = LocalDate.parse(body.get("date").toString());
        LocalTime start  = LocalTime.parse(body.get("startTime").toString());
        LocalTime end    = LocalTime.parse(body.get("endTime").toString());

        Booking created = bookingService.createBooking(
            facilityId, userId, date, start, end);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── PUT /bookings/{id} ────────────────────────────────────────
    @PutMapping("/bookings/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Long facilityId  = Long.parseLong(body.get("facilityId").toString());
        Long userId      = Long.parseLong(body.get("userId").toString());
        LocalDate date   = LocalDate.parse(body.get("date").toString());
        LocalTime start  = LocalTime.parse(body.get("startTime").toString());
        LocalTime end    = LocalTime.parse(body.get("endTime").toString());
        String status    = body.get("status").toString();

        Booking updated = bookingService.updateBooking(
            id, facilityId, userId, date, start, end, status);
        return ResponseEntity.ok(updated);
    }

    // ── DELETE /bookings/{id} ─────────────────────────────────────
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, String>> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.ok(Map.of(
            "message", "Booking " + id + " has been cancelled."));
    }

    // ── GET /availability ─────────────────────────────────────────
    // Query params: facilityId, date, startTime, endTime
    // Example: GET /availability?facilityId=1&date=2025-06-10&startTime=09:00&endTime=11:00
    @GetMapping("/availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam @NotNull Long facilityId,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {

        List<Booking> conflicts = bookingService.checkAvailability(
            facilityId, date, startTime, endTime);

        boolean available = conflicts.isEmpty();
        return ResponseEntity.ok(Map.of(
            "facilityId",  facilityId,
            "date",        date,
            "startTime",   startTime,
            "endTime",     endTime,
            "available",   available,
            "conflicts",   conflicts
        ));
    }
}