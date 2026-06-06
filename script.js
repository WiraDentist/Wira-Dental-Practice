// =============================================================================
//  WIRA DENTAL PRACTICE — Master Script
// =============================================================================

// ─── 1. CONFIGURATION & IMPORTS ──────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, off } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// -- Replace all values below with your real API keys --
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

const TIME_SLOTS = [
    '12:30','13:00','13:30','14:00','14:30','15:00',
    '15:30','16:00','16:30','17:00','17:30','18:00'
];

// ─── 2. INITIALIZATION ───────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// ─── 3. GLOBAL UI HANDLERS (Navbar & Contact Buttons) ────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    // Banner Hide/Show on Scroll
    const banner = document.querySelector('.banner');
    let lastScrollY = window.scrollY;
    
    if (banner) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY) {
                banner.classList.add('hide');
            } else {
                banner.classList.remove('hide');
            }
            lastScrollY = window.scrollY;
        });
    }

    // Index Page Buttons
    const btnWa = document.getElementById('btn-wa');
    if (btnWa) {
        btnWa.addEventListener('click', () => {
            window.open('https://wa.me/6285813536200?text=Hello!%20I%20would%20like%20to%20book%20an%20appointment.', '_blank');
            document.body.style.backgroundColor = '#e8f4f8';
        });
    }

    // Footer Phone Buttons (Both Pages)
    const phoneBtns = [document.getElementById('btn-phone'), document.getElementById('btn-phone-footer')];
    phoneBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                window.open('https://wa.me/6285813536200?text=Hello!%20I%20would%20like%20to%20ask%20a%20few%20questions.', '_blank');
                document.body.style.backgroundColor = '#e8f4f8';
            });
        }
    });

    const btnAddress = document.getElementById('btn-address');
    if (btnAddress) {
        btnAddress.addEventListener('click', () => {
            window.open('http://maps.google.com/?q=Galeri+Niaga+Mediterania+2+Blok+J8D', '_blank');
        });
    }

    // Initialize Booking Logic if on booking.html
    if (document.getElementById('step-date')) {
        initBookingFlow();
    }
});

// ─── 4. BOOKING SYSTEM LOGIC ─────────────────────────────────────────────────

function initBookingFlow() {
    let selectedDate = null;
    let selectedTime = null;
    let slotsListenerRef = null;

    // Element References
    const datePicker = document.getElementById('datePicker');
    const slotsGrid = document.getElementById('slots-grid');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnBookAnother = document.getElementById('btn-book-another');
    const backBtns = document.querySelectorAll('.btn-back');

    // Restrict Date Picker to future dates
    const todayStr = new Date().toISOString().split('T')[0];
    datePicker.min = todayStr;

    // --- Event Listeners ---
    datePicker.addEventListener('change', (e) => handleDateChange(e.target.value));
    btnConfirm.addEventListener('click', submitBooking);
    btnBookAnother.addEventListener('click', bookAnother);

    backBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-target');
            goBack(target);
        });
    });

    // Event Delegation for dynamically generated time slots
    slotsGrid.addEventListener('click', (e) => {
        const slotBtn = e.target.closest('.slot.available');
        if (slotBtn) {
            selectTime(slotBtn.getAttribute('data-time'));
        }
    });

    // --- Core Functions ---
    function showStep(stepName) {
        ['date', 'time', 'form', 'confirm'].forEach(s => {
            const el = document.getElementById('step-' + s);
            if (el) el.style.display = (s === stepName) ? 'block' : 'none';
        });
    }

    function goBack(stepName) {
        selectedTime = null;
        if (stepName === 'time') listenToSlots();
        if (stepName === 'date') detachSlotsListener();
        showStep(stepName);
    }

    function handleDateChange(val) {
        if (!val) return;

        const dayOfWeek = new Date(val + 'T00:00:00').getDay();
        if (dayOfWeek === 0) { // Sunday
            alert('The clinic is closed on Sundays. Please choose another day.');
            datePicker.value = '';
            return;
        }

        selectedDate = val;
        selectedTime = null;

        document.getElementById('time-sub').textContent = formatDate(val);
        listenToSlots();
        showStep('time');
    }

    function listenToSlots() {
        detachSlotsListener();
        slotsGrid.innerHTML = '<p style="color:#9e8e7e; font-size:13px;">Loading availability...</p>';

        const bookingsRef = ref(db, 'bookings');
        
        // Listen in real-time
        slotsListenerRef = onValue(bookingsRef, (snapshot) => {
            const allBookings = snapshot.val() || {};
            const bookedTimes = Object.values(allBookings)
                .filter(b => b.date === selectedDate)
                .map(b => b.time);

            buildSlotGrid(bookedTimes);
        });
    }

    function detachSlotsListener() {
        if (slotsListenerRef) {
            const bookingsRef = ref(db, 'bookings');
            off(bookingsRef, 'value', slotsListenerRef);
            slotsListenerRef = null;
        }
    }

    function buildSlotGrid(bookedTimes) {
        slotsGrid.innerHTML = TIME_SLOTS.map(slot => {
            const isBooked = bookedTimes.includes(slot);
            return `
                <button class="slot ${isBooked ? 'booked' : 'available'}" 
                        ${isBooked ? 'disabled' : ''} 
                        data-time="${slot}">
                    ${slot}
                    <small>${isBooked ? 'Booked' : 'Available'}</small>
                </button>
            `;
        }).join('');
    }

    function selectTime(time) {
        selectedTime = time;
        document.getElementById('form-sub').textContent = `${formatDateShort(selectedDate)} · ${time}`;
        document.getElementById('form-summary').innerHTML = `
            <strong>📅 Date:</strong> ${formatDate(selectedDate)}<br>
            <strong>🕐 Time:</strong> ${time}
        `;
        showStep('form');
    }

    function submitBooking() {
        const name = document.getElementById('f-name').value.trim();
        const phone = document.getElementById('f-phone').value.trim();
        const service = document.getElementById('f-service').value;
        const notes = document.getElementById('f-notes').value.trim();

        if (!name || !phone) {
            alert('Please fill in your name and WhatsApp number.');
            return;
        }

        // UI Loading State
        const sendingMsg = document.getElementById('sending-msg');
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Sending...';
        sendingMsg.style.display = 'block';

        const bookingData = {
            name: name,
            phone: phone,
            service: service,
            notes: notes || '',
            date: selectedDate,
            time: selectedTime,
            bookedAt: new Date().toISOString()
        };

        // 1. Push to Firebase
        const bookingsRef = ref(db, 'bookings');
        push(bookingsRef, bookingData)
            .then(() => {
                // 2. Send EmailJS
                return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    patient_name: name,
                    patient_phone: phone,
                    service: service,
                    date: formatDate(selectedDate),
                    time: selectedTime,
                    notes: notes || '(none)'
                });
            })
            .then(() => {
                showConfirmation(bookingData);
            })
            .catch(error => {
                console.error('Booking Error:', error);
                // Edge case: Firebase succeeded, EmailJS failed. Still show confirmation to user.
                showConfirmation(bookingData);
            })
            .finally(() => {
                btnConfirm.disabled = false;
                btnConfirm.textContent = '✓ Confirm Appointment';
                sendingMsg.style.display = 'none';
            });
    }

    function showConfirmation(booking) {
        document.getElementById('confirm-details').innerHTML = `
            👤 ${booking.name}<br>
            🦷 ${booking.service}<br>
            📅 ${formatDate(booking.date)}<br>
            🕐 ${booking.time}
            ${booking.notes ? `<br>📝 <em>${booking.notes}</em>` : ''}
        `;
        showStep('confirm');
    }

    function bookAnother() {
        selectedDate = null;
        selectedTime = null;
        detachSlotsListener();
        
        datePicker.value = '';
        ['f-name', 'f-phone', 'f-notes'].forEach(id => {
            document.getElementById(id).value = '';
        });
        
        showStep('date');
    }

    // --- Date Formatting Helpers ---
    function formatDate(str) {
        return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    function formatDateShort(str) {
        return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    }

    // Initialize the flow
    showStep('date');
}
