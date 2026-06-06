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

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
let selectedDate = null;
let selectedTime = null;

// ── Date Handling ───────────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0];
document.getElementById('datePicker').min = todayStr;

function handleDateChange(val) {
    selectedDate = val;
    renderSlots();
    showStep('time');
}

// ── Slot Rendering ──────────────────────────────────────────────────────
function renderSlots() {
    document.getElementById('slots-grid').innerHTML = TIME_SLOTS.map(slot => {
        return `<button class="slot available" onclick="selectTime('${slot}')">${slot}</button>`;
    }).join('');
}

function selectTime(time) {
    selectedTime = time;
    showStep('form');
}

// ── Submit via EmailJS (No backend needed) ──────────────────────────────
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
    
    // Replace with your Service ID and Template ID from EmailJS
    emailjs.send("service_5uu042s", "template_5fdmlsj", templateParams)
        .then(() => {
            document.getElementById('confirm-msg').innerHTML = "Appointment request sent to Wira Dental!";
            showStep('confirm');
        }, (err) => {
            alert("Booking failed. Check console for details.");
            console.error("EmailJS Error:", err);
        });
}

// ── Admin Toggle (Password removed as requested) ────────────────────────
function toggleAdmin() {
    // Redirects to email inbox as the storage location
    window.location.href = "mailto:wiradentalpractice@gmail.com?subject=Booking%20Inquiries";
}

// ── UI Helpers ──────────────────────────────────────────────────────────
function showStep(name) {
    ['date', 'time', 'form', 'confirm'].forEach(s => {
        document.getElementById('step-' + s).style.display = s === name ? 'block' : 'none';
    });
}

function goBack(step) { showStep(step); }

function bookAnother() { location.reload(); }

showStep('date');