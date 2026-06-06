const FIREBASE_DB_URL  = process.env.FIREBASE_DB_URL;
const EMAILJS_SVC_ID   = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TMPL_ID  = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY      = process.env.EMAILJS_PUBLIC_KEY;

function getTomorrowWIB() {
    const wibOffsetMs   = 7  * 60 * 60 * 1000;
    const oneDayMs      = 24 * 60 * 60 * 1000;
    const tomorrowWibMs = Date.now() + wibOffsetMs + oneDayMs;
    return new Date(tomorrowWibMs).toISOString().split('T')[0];
}

function formatDateLong(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

function isSunday(dateStr) {
    return new Date(dateStr + 'T00:00:00').getDay() === 0;
}

async function fetchTomorrowBookings(tomorrowDate) {
    const url = `${FIREBASE_DB_URL}/bookings.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firebase fetch failed: ${res.status} ${res.statusText}`);
    const allBookings = await res.json();
    if (!allBookings) return [];
    return Object.values(allBookings)
        .filter(b => b.date === tomorrowDate)
        .sort((a, b) => a.time.localeCompare(b.time));
}

function buildSummaryText(bookings, tomorrowDate) {
    if (isSunday(tomorrowDate)) {
        return 'Sunday — clinic is CLOSED. No appointments scheduled.';
    }
    if (bookings.length === 0) {
        return 'No appointments scheduled for tomorrow.';
    }
    return bookings.map((b, i) => {
        const lines = [
            `${i + 1}. ${b.time}`,
            `   Patient : ${b.name}`,
            `   Phone   : ${b.phone}`,
            `   Service : ${b.service}`,
        ];
        if (b.notes) lines.push(`   Notes   : ${b.notes}`);
        return lines.join('\n');
    }).join('\n\n');
}

async function sendSummaryEmail(tomorrowDate, summaryText, count) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id:      EMAILJS_SVC_ID,
            template_id:     EMAILJS_TMPL_ID,
            user_id:         EMAILJS_KEY,
            template_params: {
                tomorrow_date: formatDateLong(tomorrowDate),
                summary:       summaryText,
                count:         String(count)
            }
        })
    });
    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`EmailJS failed: ${res.status} — ${errBody}`);
    }
}

async function main() {
    const missing = ['FIREBASE_DB_URL','EMAILJS_SERVICE_ID','EMAILJS_TEMPLATE_ID','EMAILJS_PUBLIC_KEY']
        .filter(key => !process.env[key]);
    if (missing.length > 0) throw new Error(`Missing secrets: ${missing.join(', ')}`);

    const tomorrowDate = getTomorrowWIB();
    console.log(`Checking bookings for: ${formatDateLong(tomorrowDate)}`);

    const bookings = await fetchTomorrowBookings(tomorrowDate);
    console.log(`Found ${bookings.length} booking(s).`);

    const summaryText = buildSummaryText(bookings, tomorrowDate);
    await sendSummaryEmail(tomorrowDate, summaryText, bookings.length);
    console.log('Email sent successfully!');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});