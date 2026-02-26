/* ============================================
   CAMPUS BOOKING SYSTEM - MAIN APPLICATION
   Correct API Endpoints:
   - GET /facilities
   - GET /bookings
   - POST /bookings
   - DELETE /bookings/{id}
   - GET /bookings/availability
   ============================================ */

const API_BASE = "";

let selectedSlot = null; // Store the user's selected slot
let currentFacilityId = null; // Track current facility for bookings
let currentDate = null; // Track current date for bookings

// ------------------- On Page Load -------------------
window.onload = function () {
    loadFacilities();
    loadBookings();
    setupDatePicker();
};

// ------------------- Setup Date Picker -------------------
function setupDatePicker() {
    const dateInput = document.getElementById("bookingDate");
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
        currentDate = today;
    }
}

// ------------------- Load Facilities -------------------
function loadFacilities() {
    fetch(`${API_BASE}/facilities`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("facilityList");
            const facilitySelect = document.getElementById("facilitySelect");

            list.innerHTML = "";
            facilitySelect.innerHTML = "<option value=''>Choose a facility...</option>";

            data.forEach(facility => {
                // Display in facility list as cards
                const card = document.createElement("div");
                card.className = "facility-card";
                card.onclick = () => selectFacilityFromCard(facility.id);
                card.innerHTML = `
                    <div class="facility-icon">
                        <i class="fas fa-${getFacilityIcon(facility.name)}"></i>
                    </div>
                    <div class="facility-info">
                        <h3>${facility.name}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${facility.location || 'Main Campus'}</p>
                        <span class="facility-id">ID: ${facility.id}</span>
                    </div>
                `;
                list.appendChild(card);

                // Dropdown option
                const option = new Option(facility.name, facility.id);
                facilitySelect.add(option);
            });
        })
        .catch(err => {
            console.error("Error loading facilities:", err);
            showNotification("Failed to load facilities", "error");
        });
}

// ------------------- Select Facility from Card -------------------
function selectFacilityFromCard(facilityId) {
    const select = document.getElementById("facilitySelect");
    select.value = facilityId;
    currentFacilityId = facilityId;
    
    // Switch to availability tab
    switchTab('availability');
    
    // Auto-check availability if date is selected
    const date = document.getElementById("bookingDate").value;
    if (date) {
        checkAvailability();
    }
}

// ------------------- Get Icon for Facility -------------------
function getFacilityIcon(name) {
    const icons = {
        'gym': 'dumbbell',
        'fitness': 'heart',
        'library': 'book',
        'book': 'book-open',
        'conference': 'users',
        'meeting': 'chalkboard-teacher',
        'lab': 'flask',
        'science': 'microscope',
        'computer': 'laptop',
        'auditorium': 'theater-masks',
        'hall': 'building',
        'classroom': 'school',
        'sports': 'futbol',
        'basketball': 'basketball-ball',
        'tennis': 'table-tennis',
        'pool': 'swimmer',
        'default': 'building'
    };
    
    const lower = name.toLowerCase();
    for (let [key, icon] of Object.entries(icons)) {
        if (lower.includes(key)) return icon;
    }
    return icons.default;
}

// ------------------- Generate 30-Minute Slots -------------------
function generateTimeSlots(start = "08:00", end = "18:00", interval = 30) {
    const slots = [];
    let [hour, minute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    while (hour < endHour || (hour === endHour && minute < endMinute)) {
        const slotStart = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        minute += interval;
        if (minute >= 60) {
            hour += Math.floor(minute / 60);
            minute = minute % 60;
        }
        const slotEnd = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        slots.push({
            start: slotStart,
            end: slotEnd,
            display: `${slotStart} - ${slotEnd}`
        });
    }

    return slots;
}

// ------------------- Check Availability -------------------
// Uses GET /bookings/availability?facilityId={id}&date={date}&startTime={start}&endTime={end}
function checkAvailability() {
    const facilityId = document.getElementById("facilitySelect").value;
    const date = document.getElementById("bookingDate").value;
    const availabilityDiv = document.getElementById("availabilityResult");
    const createBtnContainer = document.getElementById("createBookingContainer");
    
    if (!facilityId || !date) {
        showNotification("Please select both facility and date.", "warning");
        return;
    }

    // Hide create button until slot is selected
    createBtnContainer.style.display = "none";
    selectedSlot = null;

    // Store current selection
    currentFacilityId = facilityId;
    currentDate = date;
    
    // Show loading state
    availabilityDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Checking availability...</div>';

    const dayStart = "08:00";
    const dayEnd = "18:00";
    const allSlots = generateTimeSlots(dayStart, dayEnd);

    // Create an array of promises for each time slot
    const availabilityPromises = allSlots.map(slot => {
        const url = `${API_BASE}/bookings/availability?facilityId=${facilityId}&date=${date}&startTime=${slot.start}&endTime=${slot.end}`;
        return fetch(url)
            .then(res => res.json())
            .then(isAvailable => ({
                slot: slot,
                isAvailable: isAvailable
            }))
            .catch(err => {
                console.error(`Error checking slot ${slot.display}:`, err);
                return {
                    slot: slot,
                    isAvailable: false,
                    error: true
                };
            });
    });

    // Execute all availability checks in parallel
    Promise.all(availabilityPromises)
        .then(results => {
            availabilityDiv.innerHTML = "";
            
            // Calculate available count
            const availableSlots = results.filter(r => r.isAvailable === true);
            
            if (allSlots.length === 0) {
                availabilityDiv.innerHTML = '<div class="empty-state">No time slots available</div>';
                return;
            }

            // Create enhanced slots container
            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'slots-container';
            
            // Create header with legend
            const slotsHeader = document.createElement('div');
            slotsHeader.className = 'slots-header';
            slotsHeader.innerHTML = `
                <div class="slots-title">
                    <i class="fas fa-calendar-week"></i>
                    <h3>Available Time Slots <span>(${availableSlots.length} of ${allSlots.length})</span></h3>
                </div>
                <div class="slots-legend">
                    <div class="legend-item">
                        <span class="legend-color available"></span>
                        <span>Available</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color booked"></span>
                        <span>Booked</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color selected"></span>
                        <span>Selected</span>
                    </div>
                </div>
            `;
            slotsContainer.appendChild(slotsHeader);
            
            // Create grid for slots
            const slotsGrid = document.createElement('div');
            slotsGrid.className = 'slots-grid';
            
            // Create buttons for each slot
            results.forEach(result => {
                const button = document.createElement("button");
                button.className = "slot-btn";
                
                // Split the slot into start and end times for display
                const [start, end] = result.slot.display.split(' - ');
                button.innerHTML = `<span class="slot-time">${start}<br>${end}</span>`;

                if (result.error) {
                    button.disabled = true;
                    button.classList.add("error");
                    button.title = "Error checking availability";
                } else if (result.isAvailable === false) {
                    button.disabled = true;
                    button.classList.add("booked");
                    button.title = "This time slot is already booked";
                } else {
                    button.onclick = (e) => {
                        // Remove selected class from all buttons
                        document.querySelectorAll('.slot-btn').forEach(btn => {
                            btn.classList.remove('selected');
                        });
                        // Add selected class to clicked button
                        e.target.classList.add('selected');
                        selectSlot(result.slot.display);
                        
                        // Show create booking button
                        createBtnContainer.style.display = "block";
                    };
                    button.classList.add("available");
                    button.title = "Click to select this slot";
                }

                slotsGrid.appendChild(button);
            });
            
            slotsContainer.appendChild(slotsGrid);
            availabilityDiv.appendChild(slotsContainer);
        })
        .catch(err => {
            console.error("Error checking availability:", err);
            availabilityDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i> Failed to load availability</div>';
            showNotification("Error checking availability", "error");
        });
}

// ------------------- Select Slot -------------------
function selectSlot(slot) {
    selectedSlot = slot;
    showNotification(`Selected: ${slot}`, "success");
}

// ------------------- Create Booking -------------------
// Uses POST /bookings
function createBooking() {
    const facilityId = document.getElementById("facilitySelect").value;
    const date = document.getElementById("bookingDate").value;

    if (!facilityId || !date) {
        showNotification("Please select facility and date before booking.", "warning");
        return;
    }

    if (!selectedSlot) {
        showNotification("Please select a time slot before booking.", "warning");
        return;
    }

    // Parse the selected slot
    const [startTime, endTime] = selectedSlot.split(" - ");

    // Double-check if this slot is still available using the availability endpoint
    fetch(`${API_BASE}/bookings/availability?facilityId=${facilityId}&date=${date}&startTime=${startTime}&endTime=${endTime}`)
        .then(res => res.json())
        .then(isAvailable => {
            if (!isAvailable) {
                showNotification("⛔ This time slot has already been booked by someone else. Please select a different slot.", "error");
                checkAvailability(); // Refresh the slots
                return null;
            }

            // Proceed with booking
            return fetch(`${API_BASE}/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    facilityId: parseInt(facilityId),
                    userId: 1, // Replace with actual user ID if needed
                    date: date,
                    startTime: startTime,
                    endTime: endTime
                })
            });
        })
        .then(response => {
            if (!response) return; // Slot was already booked
            if (!response.ok) {
                throw new Error('Booking failed');
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                showNotification("Booking created successfully!", "success");
                selectedSlot = null; // reset selection
                
                // Remove selected class from all buttons
                document.querySelectorAll('.slot-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Hide create button
                document.getElementById("createBookingContainer").style.display = "none";
                
                // Refresh slots to show the new booking
                checkAvailability();
                
                // Refresh booking history
                loadBookings();
                
                // Switch to bookings tab
                setTimeout(() => switchTab('bookings'), 1000);
            }
        })
        .catch(err => {
            console.error("Error creating booking:", err);
            showNotification("Failed to create booking. Please try again.", "error");
        });
}

// ------------------- Cancel Booking -------------------
// Uses DELETE /bookings/{id}
function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "DELETE"
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to cancel booking');
        showNotification("Booking cancelled successfully", "success");
        loadBookings(); // Refresh booking list
        if (currentFacilityId && currentDate) {
            checkAvailability(); // Refresh availability if we're on that tab
        }
    })
    .catch(err => {
        console.error("Error cancelling booking:", err);
        showNotification("Failed to cancel booking", "error");
    });
}

// ------------------- Load Booking History -------------------
// Uses GET /bookings
function loadBookings() {
    fetch(`${API_BASE}/bookings`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch bookings');
            return res.json();
        })
        .then(data => {
            const grid = document.getElementById("bookingsGrid");
            grid.innerHTML = "";

            if (data.length === 0) {
                grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-calendar-times"></i> No bookings found</div>';
                return;
            }

            // Sort bookings by date (most recent first)
            data.sort((a, b) => new Date(b.date) - new Date(a.date));

            data.forEach(booking => {
                const card = document.createElement("div");
                card.className = "booking-card";
                
                // Determine status color and icon
                let statusClass = '';
                const status = booking.status || 'PENDING';
                
                if (status === 'APPROVED') statusClass = 'approved';
                else if (status === 'PENDING') statusClass = 'pending';
                else if (status === 'CANCELLED') statusClass = 'cancelled';
                
                // Format date nicely
                const bookingDate = new Date(booking.date);
                const formattedDate = bookingDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                // Add cancel button for non-cancelled bookings
                const canCancel = status !== 'CANCELLED';
                
                card.innerHTML = `
                    <div class="booking-card-header">
                        <div class="booking-facility">
                            <i class="fas fa-building"></i>
                            <span>${booking.facility?.name || 'Unknown Facility'}</span>
                        </div>
                        <span class="booking-status-badge ${statusClass}">${status}</span>
                    </div>
                    <div class="booking-details">
                        <div class="booking-detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>Date</span>
                            <strong>${formattedDate}</strong>
                        </div>
                        <div class="booking-detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Time</span>
                            <strong>${booking.startTime} - ${booking.endTime}</strong>
                        </div>
                        <div class="booking-detail-item">
                            <i class="fas fa-hashtag"></i>
                            <span>Booking ID</span>
                            <strong>#${booking.id}</strong>
                        </div>
                    </div>
                    ${canCancel ? `
                        <div class="booking-card-footer">
                            <button class="booking-cancel-btn" onclick="cancelBooking(${booking.id})">
                                <i class="fas fa-times"></i>
                                Cancel Booking
                            </button>
                        </div>
                    ` : ''}
                `;
                
                grid.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Error loading bookings:", err);
            showNotification("Failed to load bookings", "error");
        });
}

// ------------------- Tab Switching -------------------
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked tab button
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(
        btn => btn.getAttribute('onclick')?.includes(tabName)
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Refresh data when switching to certain tabs
    if (tabName === 'bookings') {
        loadBookings();
    } else if (tabName === 'facilities') {
        loadFacilities();
    } else if (tabName === 'availability') {
        // If we have a slot selected, show create button
        if (selectedSlot) {
            document.getElementById("createBookingContainer").style.display = "block";
        } else {
            document.getElementById("createBookingContainer").style.display = "none";
        }
    }
}

// ------------------- Filter Facilities (Search) -------------------
function filterFacilities() {
    const searchTerm = document.getElementById('facilitySearch')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.facility-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        if (title.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// ------------------- Show Notification -------------------
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Show notification
    notification.classList.add('show');
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ------------------- Make functions globally available -------------------
window.switchTab = switchTab;
window.checkAvailability = checkAvailability;
window.createBooking = createBooking;
window.cancelBooking = cancelBooking;
window.selectFacilityFromCard = selectFacilityFromCard;
window.filterFacilities = filterFacilities;