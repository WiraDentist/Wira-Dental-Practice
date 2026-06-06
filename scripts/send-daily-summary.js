// =============================================================================
//  WIRA DENTAL — Daily Appointment Summary Emailer  (v3)
// =============================================================================

// Credentials hardcoded — same values already public in your script.js
const FIREBASE_DB_URL = 'https://wiradentist-1947f-default-rtdb.firebaseio.com';
const EMAILJS_SVC_ID  = 'service_5uu042s';
const EMAILJS_TMPL_ID = 'template_16k53bi';
const EMAILJS_KEY     = 'xflDajxK7KdzCGn-8';

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

// ─── HTML EMAIL BUILDER ───────────────────────────────────────────────────────

function buildSummaryHTML(bookings, tomorrowDate) {

    if (isSunday(tomorrowDate)) {
        return `
        <div style="padding:16px 20px;background:#fff8e1;border-left:4px solid #f1d274;
                    border-radius:0 8px 8px 0;color:#7a6000;font-family:Arial,sans-serif;">
            <strong>🏖️ Sunday — Clinic is CLOSED.</strong><br>No appointments scheduled.
        </div>`;
    }

    if (bookings.length === 0) {
        return `
        <div style="padding:16px 20px;background:#e8f5e9;border-left:4px solid #4caf50;
                    border-radius:0 8px 8px 0;color:#2e7d32;font-family:Arial,sans-serif;">
            <strong>✅ No appointments scheduled for tomorrow.</strong>
        </div>`;
    }

    const cards = bookings.map((b, i) => `
        <div style="font-family:Arial,sans-serif;margin-bottom:16px;border:1px solid #e0e0e0;
                    border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07);">

            <div style="background:#0a1628;padding:10px 16px;">
                <span style="background:#f1d274;color:#0a1628;font-weight:bold;font-size:13px;
                             border-radius:50%;width:24px;height:24px;display:inline-flex;
                             align-items:center;justify-content:center;margin-right:10px;">
                    ${i + 1}
                </span>
                <span style="color:#ffffff;font-weight:bold;font-size:15px;">
                    🕐 &nbsp;${b.time}
                </span>
            </div>

            <div style="padding:12px 16px;background:#ffffff;">
                <table style="border-collapse:collapse;width:100%;font-size:14px;color:#333;">
                    <tr>
                        <td style="padding:5px 12px 5px 0;color:#888;white-space:nowrap;vertical-align:top;">
                            👤 &nbsp;<strong>Patient</strong>
                        </td>
                        <td style="padding:5px 0;font-weight:bold;color:#0a1628;">
                            ${b.name}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:5px 12px 5px 0;color:#888;white-space:nowrap;vertical-align:top;">
                            📞 &nbsp;<strong>Phone</strong>
                        </td>
                        <td style="padding:5px 0;color:#333;">
                            ${b.phone}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:5px 12px 5px 0;color:#888;white-space:nowrap;vertical-align:top;">
                            🦷 &nbsp;<strong>Service</strong>
                        </td>
                        <td style="padding:5px 0;color:#333;">
                            ${b.service}
                        </td>
                    </tr>
                    ${b.notes ? `
                    <tr>
                        <td colspan="2" style="padding:8px 0 2px 0;">
                            <div style="background:#f5f5f5;border-radius:6px;padding:8px 12px;
                                        color:#555;font-size:13px;border-left:3px solid #f1d274;">
                                📝 &nbsp;<strong>Notes:</strong> &nbsp;${b.notes}
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
    console.log(`Sending email for ${count} appointment(s)...`);
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
    const tomorrowDate = getTomorrowWIB();
    console.log(`Date:  ${formatDateLong(tomorrowDate)}`);

    const bookings = await fetchTomorrowBookings(tomorrowDate);
    console.log(`Found: ${bookings.length} booking(s)`);

    const summaryHTML = buildSummaryHTML(bookings, tomorrowDate);
    await sendSummaryEmail(tomorrowDate, summaryHTML, bookings.length);
    console.log('Done! Email sent successfully.');
}

main().catch(err => {
    console.error('FAILED:', err.message);
    process.exit(1);
});
