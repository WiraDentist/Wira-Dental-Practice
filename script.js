const button1 = document.getElementById('button-1');
button1.addEventListener('click', function() {
    window.open('https://wa.me//6285813536200?text=Hello!%20I%20would%20like%20to%20book%20an%20appointment.', '_blank');
    document.body.style.backgroundColor = '#e8f4f8';
    alert('Thank you for booking your appointment with us!');
});

const button2 = document.getElementById('button-2');
button2.addEventListener('click', function() {
    window.open('https://wa.me//6285813536200?text=Hello!%20I%20would%20like%20to%20ask%20a%20few%20questions.', '_blank');
    document.body.style.backgroundColor = '#e8f4f8';
    alert('Thank you for contacting us!');
});

document.addEventListener("DOMContentLoaded", function() {
    
    const banner = document.querySelector('.banner');
    let lastScrollY = window.scrollY;
    if (!banner) {
        console.error("Error: Could not find the '.banner' element.");
        return;
    }
    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY) {
            banner.classList.add('hide');
        } else {
            banner.classList.remove('hide');
        }
        lastScrollY = window.scrollY;
    });
    
});

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
  // 12:00 is skipped (lunch break)

  // ── State ─────────────────────────────────────────────────────────────────
  let selectedDate = null;
  let selectedTime = null;

  // ── Data layer ────────────────────────────────────────────────────────────
  // This demo uses localStorage. In your real website, replace these two
  // functions with fetch() calls to get_slots.php and book.php (see those files).

  function getBookedSlots(date) {
    const all = JSON.parse(localStorage.getItem('dental_bookings') || '[]');
    return all.filter(b => b.date === date).map(b => b.time);
  }

  function getAllBookings() {
    return JSON.parse(localStorage.getItem('dental_bookings') || '[]');
  }

  function saveBooking(booking) {
    const all = getAllBookings();
    all.push(booking);
    localStorage.setItem('dental_bookings', JSON.stringify(all));
  }

  // ── Step navigation ───────────────────────────────────────────────────────
  function showStep(name) {
    ['date','time','form','confirm'].forEach(s => {
      document.getElementById('step-' + s).style.display = s === name ? 'block' : 'none';
    });
  }

  function goBack(step) {
    selectedTime = null;
    if (step === 'time') renderSlots();
    showStep(step);
  }

  // ── Date selection ────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('datePicker').min = todayStr;

  function handleDateChange(val) {
    if (!val) return;
    const dayOfWeek = new Date(val + 'T00:00:00').getDay();
    if (dayOfWeek === 0) { // Sunday
      alert('The clinic is closed on Sundays. Please choose another day.');
      document.getElementById('datePicker').value = '';
      return;
    }
    selectedDate = val;
    selectedTime = null;
    document.getElementById('time-sub').textContent = formatDate(val);
    renderSlots();
    showStep('time');
  }

  // ── Render time slots ─────────────────────────────────────────────────────
  function renderSlots() {
    // REAL SITE: swap the line below with a fetch to get_slots.php
    // fetch('/get_slots.php?date=' + selectedDate)
    //   .then(r => r.json()).then(booked => buildSlotGrid(booked));
    buildSlotGrid(getBookedSlots(selectedDate)); // demo version
  }

  function buildSlotGrid(booked) {
    document.getElementById('slots-grid').innerHTML = TIME_SLOTS.map(slot => {
      const isBooked = booked.includes(slot);
      return `<button class="slot ${isBooked ? 'booked' : 'available'}"
        ${isBooked ? 'disabled' : ''}
        onclick="selectTime('${slot}')">
        ${slot}
        <small>${isBooked ? 'Booked' : 'Available'}</small>
      </button>`;
    }).join('');
  }

  function selectTime(time) {
    selectedTime = time;
    document.getElementById('form-sub').textContent = formatDateShort(selectedDate) + ' · ' + time;
    document.getElementById('form-summary').innerHTML =
      `<strong>📅 Date:</strong> ${formatDate(selectedDate)}<br>` +
      `<strong>🕐 Time:</strong> ${time}`;
    showStep('form');
  }

  // ── Submit booking ────────────────────────────────────────────────────────
  function submitBooking() {
    const name    = document.getElementById('f-name').value.trim();
    const phone   = document.getElementById('f-phone').value.trim();
    const service = document.getElementById('f-service').value;
    const notes   = document.getElementById('f-notes').value.trim();

    if (!name || !phone) {
      alert('Please fill in your name and WhatsApp number.');
      return;
    }

    const booking = { id: Date.now(), name, phone, service, notes, date: selectedDate, time: selectedTime };

    // REAL SITE: replace saveBooking() with:
    // fetch('/book.php', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(booking)
    // });
    saveBooking(booking); // demo version

    document.getElementById('confirm-msg').innerHTML =
      `We'll send a reminder to WhatsApp <strong>${phone}</strong> shortly.`;
    document.getElementById('confirm-details').innerHTML =
      `👤 ${name}<br>🦷 ${service}<br>📅 ${formatDate(selectedDate)}<br>🕐 ${selectedTime}` +
      (notes ? `<br>📝 <em>${notes}</em>` : '');

    showStep('confirm');
    if (document.getElementById('admin-panel').style.display !== 'none') renderAdmin();
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function bookAnother() {
    selectedDate = null; selectedTime = null;
    document.getElementById('datePicker').value = '';
    ['f-name','f-phone','f-notes'].forEach(id => document.getElementById(id).value = '');
    showStep('date');
  }

  // ── Admin / Doctor's View ─────────────────────────────────────────────────
  let adminOpen = false;
  function toggleAdmin() {
    adminOpen = !adminOpen;
    document.getElementById('admin-panel').style.display = adminOpen ? 'block' : 'none';
    document.getElementById('admin-btn').textContent = adminOpen ? '▲ Hide Doctor\'s View' : '▼ Doctor\'s View';
    if (adminOpen) renderAdmin();
  }

  function renderAdmin() {
    const password = prompt("Enter Doctor's Password:");
    if (!password) return; // Exit if they click cancel

    fetch('allbooks.php?auth=' + password)
        .then(r => {
            if (r.status === 403) {
                alert("Incorrect password!");
                return [];
            }
            return r.json();
        })
        .then(bookings => {
            if (!Array.isArray(bookings)) return;
            const el = document.getElementById('admin-list');
            // ... (rest of your existing render code here)
            el.innerHTML = bookings.reverse().map(b => `
              <div class="booking-card">
                <span class="bc-badge">${b.time}</span>
                <div class="bc-name">${b.name}</div>
                <div class="bc-info">${b.service} · ${b.date} · ${b.phone}</div>
              </div>`).join('');
        });
}

    }
    el.innerHTML = bookings.map(b => `
      <div class="booking-card">
        <span class="bc-badge">${b.time}</span>
        <div class="bc-name">${b.name}</div>
        <div class="bc-info">${b.service} · ${b.date} · ${b.phone}</div>
        ${b.notes ? `<div class="bc-info" style="font-style:italic;">📝 ${b.notes}</div>` : ''}
      </div>`).join('');
  }

  // ── Date helpers ──────────────────────────────────────────────────────────
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

  showStep('date');
