// =============================================================================
//  WIRA DENTAL PRACTICE — Master Script
// =============================================================================

// ─── 1. CONFIGURATION & IMPORTS ──────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, off } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Initialize EmailJS directly in the script
(function(){
    emailjs.init("xflDajxK7KdzCGn-8"); // Your public key
})();

// -- Replace all values below with your real API keys --
const firebaseConfig = {
    apiKey: "AIzaSyCCUFVM4AR54ImP_RrQvYvNiXZq6SkcMp0",
    authDomain: "wiradentist-1947f.firebaseapp.com",
    databaseURL: "https://wiradentist-1947f-default-rtdb.firebaseio.com",
    projectId: "wiradentist-1947f",
    storageBucket: "wiradentist-1947f.firebasestorage.app",
    messagingSenderId: "916884972357",
    appId: "1:916884972357:web:1227db147595e129f9d42c",
};

const EMAILJS_PUBLIC_KEY = "xflDajxK7KdzCGn-8";
var EMAILJS_SERVICE_ID = "service_5uu042s";
var EMAILJS_TEMPLATE_ID = "template_5fdmlsj";

const TIME_SLOTS = [
    '13:00/13.30','14:00/14.30','15:00/15:30','16:00/16:30','17:00/17:30','18:00/18.30'
];

// ─── 2. INITIALIZATION ───────────────────────────────────────────────────────

let app, db;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "xflDajxK7KdzCGn-8") {
    emailjs.init(xflDajxK7KdzCGn-8);
}

// ─── 3. GLOBAL UI HANDLERS (Navbar & Contact Buttons) ────────────────────────

// Modules execute after the DOM is parsed, so we invoke initialization immediately
// rather than waiting for DOMContentLoaded, which causes race conditions.
initGlobalUI();

if (document.getElementById('step-date')) {
    initBookingFlow();
}

function initGlobalUI() {
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
        btnWa.addEventListener('click', function () {
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
}

// ─── 4. BOOKING SYSTEM LOGIC ─────────────────────────────────────────────────

// Add your Google Apps Script Web App URL here
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxh0clStshUrZ7e4Gij40fBgcU0HCjCkrnum1w4j_Gva3e9q6XEm0FFa_2l1RbJIQ39/exec";

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

        if (!db) {
            console.warn("Database not initialized. Displaying all slots as available.");
            buildSlotGrid([]);
            return;
        }

        const bookingsRef = ref(db, 'bookings');
        
        slotsListenerRef = onValue(bookingsRef, (snapshot) => {
            const allBookings = snapshot.val() || {};
            const bookedTimes = Object.values(allBookings)
                .filter(b => b.date === selectedDate)
                .map(b => b.time);

            buildSlotGrid(bookedTimes);
        }, (error) => {
            console.error("Firebase Read Error:", error);
            buildSlotGrid([]); 
        });
    }

    function detachSlotsListener() {
        if (slotsListenerRef && db) {
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

        if (!db) {
            processExternalWebhooks(bookingData);
            return;
        }

        const bookingsRef = ref(db, 'bookings');
        push(bookingsRef, bookingData)
            .then(() => {
                processExternalWebhooks(bookingData);
            })
            .catch(error => {
                console.error('Firebase Push Error:', error);
                processExternalWebhooks(bookingData);
            });
    }

    // Runs EmailJS and Google Apps Script in parallel
    function processExternalWebhooks(bookingData) {
        Promise.all([
            sendEmailAsync(bookingData),
            sendToGoogleScript(bookingData)
        ]).finally(() => {
            finalizeBooking(bookingData);
        });
    }

    // Google Apps Script Webhook
    function sendToGoogleScript(bookingData) {
        return new Promise((resolve) => {
            if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
                console.warn("GAS URL not set. Skipping Google Sheets sync.");
                return resolve();
            }

            fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                // text/plain bypasses strict CORS preflight checks for Google Apps Script
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(bookingData)
            })
            .then(() => resolve())
            .catch(err => {
                console.error('Google Script Error:', err);
                resolve(); // resolve anyway so UI doesn't freeze
            });
        });
    }

    // Refactored EmailJS to use Promises
    function sendEmailAsync(bookingData) {
        return new Promise((resolve) => {
            if (typeof emailjs === "undefined" || EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
                console.warn("EmailJS not fully configured. Skipping email.");
                return resolve();
            }

            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                patient_name: bookingData.name,
                patient_phone: bookingData.phone,
                service: bookingData.service,
                date: formatDate(bookingData.date),
                time: bookingData.time,
                notes: bookingData.notes || '(none)'
            })
            .then(() => resolve())
            .catch(error => {
                console.error('EmailJS Error:', error);
                resolve();
            });
        });
    }

    function finalizeBooking(bookingData) {
        btnConfirm.disabled = false;
        btnConfirm.textContent = '✓ Confirm Appointment';
        document.getElementById('sending-msg').style.display = 'none';
        
        document.getElementById('confirm-details').innerHTML = `
            👤 ${bookingData.name}<br>
            📞 ${bookingData.phone}<br>
            🦷 ${bookingData.service}<br>
            📅 ${formatDate(bookingData.date)}<br>
            🕐 ${bookingData.time}
            ${bookingData.notes ? `<br>📝 <em>${bookingData.notes}</em>` : ''}
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
