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

// ── Date Selection ──────────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0];
document.getElementById('datePicker').min = todayStr;

function handleDateChange(val) {
    selectedDate = val;
    renderSlots();
    showStep('time');
}

// ── Render Slots ────────────────────────────────────────────────────────
function renderSlots() {
    document.getElementById('slots-grid').innerHTML = TIME_SLOTS.map(slot => {
        return `<button class="slot available" onclick="selectTime('${slot}')">
                ${slot}</button>`;
    }).join('');
}

function selectTime(time) {
    selectedTime = time;
    showStep('form');
}

// ── Submit via EmailJS ──────────────────────────────────────────────────
function submitBooking() {
    const templateParams = {
        name: document.getElementById('f-name').value,
        phone: document.getElementById('f-phone').value,
        service: document.getElementById('f-service').value,
        notes: document.getElementById('f-notes').value,
        date: selectedDate,
        time: selectedTime
    };

    if (!templateParams.name || !templateParams.phone) {
        alert('Please fill in your name and WhatsApp number.');
        return;
    }

    // REPLACE WITH YOUR SERVICE ID AND TEMPLATE ID
    emailjs.send("service_4h4h9xq", "template_4vd13ff", templateParams)
        .then(function(response) {
            document.getElementById('confirm-msg').innerHTML = "Booking request sent to Wira Dental!";
            showStep('confirm');
        }, function(error) {
            alert("Booking failed. Please try again.");
            console.error("EmailJS error:", error);
        });
}

// ── Navigation & Helpers ────────────────────────────────────────────────
function showStep(name) {
    ['date','time','form','confirm'].forEach(s => {
        document.getElementById('step-' + s).style.display = s === name ? 'block' : 'none';
    });
}

function toggleAdmin() {
    alert("On GitHub Pages, you can view your bookings in your email inbox.");
}

showStep('date');
