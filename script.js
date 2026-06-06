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
  let selectedDate = null;
  let selectedTime = null;
  let adminOpen = false;

  function renderSlots() {
    fetch('get_slots.php?date=' + selectedDate)
      .then(r => r.text())
      .then(text => {
        const booked = text ? text.split(',') : [];
        buildSlotGrid(booked);
      });
  }

  function buildSlotGrid(booked) {
    document.getElementById('slots-grid').innerHTML = TIME_SLOTS.map(slot => {
      const isBooked = booked.includes(slot);
      return `<button class="slot ${isBooked ? 'booked' : 'available'}" 
              ${isBooked ? 'disabled' : ''} onclick="selectTime('${slot}')">
              ${slot} <small>${isBooked ? 'Booked' : 'Available'}</small></button>`;
    }).join('');
  }

  function submitBooking() {
    const booking = {
      name: document.getElementById('f-name').value,
      phone: document.getElementById('f-phone').value,
      service: document.getElementById('f-service').value,
      notes: document.getElementById('f-notes').value,
      date: selectedDate,
      time: selectedTime
    };

    fetch('book.php', {
      method: 'POST',
      body: JSON.stringify(booking)
    }).then(r => r.text()).then(res => {
      if (res === "success") showStep('confirm');
      else alert('Error: ' + res);
    });
  }

  function toggleAdmin() {
    adminOpen = !adminOpen;
    document.getElementById('admin-panel').style.display = adminOpen ? 'block' : 'none';
    if (adminOpen) renderAdmin();
  }

  function renderAdmin() {
    const pass = prompt("Enter Dentist's Password:");
    if (!pass) return;
    
    fetch('get_all.php?auth=' + encodeURIComponent(pass))
      .then(r => r.text())
      .then(text => {
        const el = document.getElementById('admin-list');
        if (!text.trim()) { el.innerHTML = "No bookings."; return; }
        
        const rows = text.trim().split('\n');
        el.innerHTML = rows.map(row => {
          const [name, phone, service, date, time] = row.split('|');
          return `<div class="booking-card">${date} ${time} - ${name} (${phone})</div>`;
        }).join('');
      });
  }
