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

  function renderSlots() {
    fetch('get_slots.php?date=' + selectedDate)
      .then(r => r.json())
      .then(booked => buildSlotGrid(booked));
  }

  function buildSlotGrid(booked) {
    document.getElementById('slots-grid').innerHTML = TIME_SLOTS.map(slot => {
      const isBooked = booked.includes(slot);
      return `<button class="slot ${isBooked ? 'booked' : 'available'}" ${isBooked ? 'disabled' : ''} onclick="selectTime('${slot}')">
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    }).then(r => r.json()).then(res => {
      if (res.success) showStep('confirm');
      else alert('Error saving booking.');
    });
  }

  function renderAdmin() {
    const pass = prompt("Enter Password:");
    fetch('get_all.php?auth=' + encodeURIComponent(pass))
      .then(r => r.json())
      .then(data => {
        document.getElementById('admin-list').innerHTML = data.map(b => 
          `<div class="booking-card">${b.time} - ${b.name} (${b.date})</div>`).join('');
      });
  }
  // Keep your showStep, handleDateChange, etc. as they were.
