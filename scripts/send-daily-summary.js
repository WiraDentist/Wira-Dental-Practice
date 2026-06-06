// =============================================================================
//  WIRA DENTAL — Daily Appointment Summary Emailer  (v4 — plain text fix)
// =============================================================================

const FIREBASE_DB_URL    = 'https://wiradentist-1947f-default-rtdb.firebaseio.com';
const EMAILJS_SVC_ID     = 'service_5uu042s';
const EMAILJS_TMPL_ID    = 'template_16k53bi';
const EMAILJS_KEY        = 'xflDajxK7KdzCGn-8';

// ─── DATE HELPERS (WIB = UTC+7) ──────────────────────────────────────────────

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

// ─── FIREBASE REST API ────────────────────────────────────────────────────────

async function fetchTomorrowBookings(tomorrowDate) {
    const url = `${FIREBASE_DB_URL}/bookings.json`;
    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firebase fetch failed: ${res.status} ${res.statusText}`);
    const allBookings = await res.json();
    if (!allBookings) return [];
    return Object.values(allBookings)
        .filter(b => b.date === tomorrowDate)
        .sort((a, b) => a.time.localeCompare(b.time));
}

// ─── PLAIN TEXT SUMMARY BUILDER ───────────────────────────────────────────────
// No HTML tags — just clean formatted text.
// The EmailJS template wraps this in a styled box via its own HTML.

function buildSummaryText(bookings, tomorrowDate) {

    if (isSunday(tomorrowDate)) {
        return '🏖️  Sunday — Clinic is CLOSED.\nNo appointments scheduled.';
    }

    if (bookings.length === 0) {
        return '✅  No appointments scheduled for tomorrow.';
    }

    const divider = '─────────────────────────────────';

    return bookings.map((b, i) => {
        const lines = [
            `${i + 1}.  🕐  ${b.time}`,
            `    👤  Patient  :  ${b.name}`,
            `    📞  Phone    :  ${b.phone}`,
            `    🦷  Service  :  ${b.service}`,
        ];
        if (b.notes) {
            lines.push(`    📝  Notes    :  ${b.notes}`);
        }
        return lines.join('\n');
    }).join(`\n\n${divider}\n\n`);
}

// ─── EMAILJS REST API ─────────────────────────────────────────────────────────

async function sendSummaryEmail(tomorrowDate, summaryText, count) {
    console.log(`Sending email for ${count} appointment(s)...`);

    const payload = {
        service_id:      EMAILJS_SVC_ID,
        template_id:     EMAILJS_TMPL_ID,
        user_id:         EMAILJS_KEY,
        template_params: {
            tomorrow_date: formatDateLong(tomorrowDate),
            summary:       summaryText,
            count:         String(count)
        }
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`EmailJS failed: ${res.status} — ${errBody}`);
    }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    const tomorrowDate = getTomorrowWIB();
    console.log(`Date:  ${formatDateLong(tomorrowDate)}`);

    const bookings = await fetchTomorrowBookings(tomorrowDate);
    console.log(`Found: ${bookings.length} booking(s)`);

    const summaryText = buildSummaryText(bookings, tomorrowDate);
    await sendSummaryEmail(tomorrowDate, summaryText, bookings.length);
    console.log('Done! Email sent successfully.');
}

main().catch(err => {
    console.error('FAILED:', err.message);
    process.exit(1);
});
