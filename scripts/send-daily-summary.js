// =============================================================================
//  WIRA DENTAL — Daily Appointment Summary Emailer  (v2 — styled cards)
// =============================================================================

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const EMAILJS_SVC_ID  = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TMPL_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY     = process.env.EMAILJS_PUBLIC_KEY;

// ─── DATE HELPERS (WIB = UTC+7) ──────────────────────────────────────────────

function getTomorrowWIB() {
    const wibOffsetMs   = 7  * 60 * 60 * 1000;
    const oneDayMs      = 24 * 60 * 60 * 1000;
    const tomorrowWibMs = Date.now() + wibOffsetMs + oneDayMs;
    return new Date(tomorrowWibMs).toISOString().split('T')[0]; // YYYY-MM-DD
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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firebase fetch failed: ${res.status} ${res.statusText}`);
    const allBookings = await res.json();
    if (!allBookings) return [];
    return Object.values(allBookings)
        .filter(b => b.date === tomorrowDate)
        .sort((a, b) => a.time.localeCompare(b.time));
}

// ─── HTML EMAIL BUILDER ───────────────────────────────────────────────────────
// Each patient gets a styled card. Notes section only appears if filled in.
// EmailJS renders {{summary}} as raw HTML in the email body.

function buildSummaryHTML(bookings, tomorrowDate) {

    // ── No appointments ───────────────────────────────────────────────────────
    if (isSunday(tomorrowDate)) {
        return `
        <div style="padding:16px 20px; background:#fff8e1; border-left:4px solid #f1d274;
                    border-radius:0 8px 8px 0; color:#7a6000; font-family:Arial,sans-serif;">
            <strong>🏖️ Sunday — Clinic is CLOSED.</strong><br>
            No appointments scheduled.
        </div>`;
    }

    if (bookings.length === 0) {
        return `
        <div style="padding:16px 20px; background:#e8f5e9; border-left:4px solid #4caf50;
                    border-radius:0 8px 8px 0; color:#2e7d32; font-family:Arial,sans-serif;">
            <strong>✅ No appointments scheduled for tomorrow.</strong>
        </div>`;
    }

    // ── Patient cards ─────────────────────────────────────────────────────────
    const cards = bookings.map((b, i) => `
        <div style="font-family:Arial,sans-serif; margin-bottom:16px;
                    border:1px solid #e0e0e0; border-radius:10px; overflow:hidden;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.07);">

            <!-- Card header: slot number + time -->
            <div style="background:#0a1628; padding:10px 16px; display:flex; align-items:center;">
                <span style="background:#f1d274; color:#0a1628; font-weight:bold; font-size:13px;
                             border-radius:50%; width:24px; height:24px; display:inline-flex;
                             align-items:center; justify-content:center; margin-right:10px;">
                    ${i + 1}
                </span>
                <span style="color:#ffffff; font-weight:bold; font-size:15px; letter-spacing:0.5px;">
                    🕐 &nbsp;${b.time}
                </span>
            </div>

            <!-- Card body: patient details -->
            <div style="padding:12px 16px; background:#ffffff;">

                <table style="border-collapse:collapse; width:100%; font-size:14px; color:#333;">
                    <tr>
                        <td style="padding:5px 8px 5px 0; color:#888; white-space:nowrap; vertical-align:top;">
                            👤 &nbsp;<strong>Patient</strong>
                        </td>
                        <td style="padding:5px 0; font-weight:bold; color:#0a1628;">
                            ${b.name}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:5px 8px 5px 0; color:#888; white-space:nowrap; vertical-align:top;">
                            📞 &nbsp;<strong>Phone</strong>
                        </td>
                        <td style="padding:5px 0; color:#333;">
                            ${b.phone}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:5px 8px 5px 0; color:#888; white-space:nowrap; vertical-align:top;">
                            🦷 &nbsp;<strong>Service</strong>
                        </td>
                        <td style="padding:5px 0; color:#333;">
                            ${b.service}
                        </td>
                    </tr>
                    ${b.notes ? `
                    <tr>
                        <td colspan="2" style="padding:8px 0 2px 0;">
                            <div style="background:#f5f5f5; border-radius:6px; padding:8px 12px;
                                        color:#555; font-size:13px; font-style:italic;
                                        border-left:3px solid #f1d274;">
                                📝 &nbsp;<strong style="font-style:normal;">Notes:</strong>
                                &nbsp;${b.notes}
                            </div>
                        </td>
                    </tr>` : ''}
                </table>

            </div>
        </div>
    `).join('');

    return cards;
}

// ─── EMAILJS REST API ─────────────────────────────────────────────────────────

async function sendSummaryEmail(tomorrowDate, summaryHTML, count) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id:      EMAILJS_SVC_ID,
            template_id:     EMAILJS_TMPL_ID,
            user_id:         EMAILJS_KEY,
            template_params: {
                tomorrow_date: formatDateLong(tomorrowDate),
                summary:       summaryHTML,
                count:         String(count)
            }
        })
    });
    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`EmailJS failed: ${res.status} — ${errBody}`);
    }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    const missing = ['FIREBASE_DB_URL','EMAILJS_SERVICE_ID','EMAILJS_TEMPLATE_ID','EMAILJS_PUBLIC_KEY']
        .filter(key => !process.env[key]);
    if (missing.length > 0) throw new Error(`Missing GitHub Secrets: ${missing.join(', ')}`);

    const tomorrowDate = getTomorrowWIB();
    console.log(`Checking bookings for: ${formatDateLong(tomorrowDate)}`);

    const bookings = await fetchTomorrowBookings(tomorrowDate);
    console.log(`Found ${bookings.length} booking(s).`);

    const summaryHTML = buildSummaryHTML(bookings, tomorrowDate);
    await sendSummaryEmail(tomorrowDate, summaryHTML, bookings.length);
    console.log('Email sent successfully!');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
