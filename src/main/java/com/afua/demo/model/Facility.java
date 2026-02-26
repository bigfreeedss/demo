package com.afua.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "facilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Facility name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Location is required")
    @Column(nullable = false)
    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    @Column(nullable = false)
    private int capacity;
}