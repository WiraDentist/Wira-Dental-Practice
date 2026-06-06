<?php
// book.php
// Receives a booking from the website, saves it to bookings.json,
// and sends you (the dentist) an email notification.

header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Read the JSON body sent from the booking form
$input = json_decode(file_get_contents('php://input'), true);

// Check required fields
$required = ['name', 'phone', 'service', 'date', 'time'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing field: $field"]);
        exit;
    }
}

// Sanitize inputs
$booking = [
    'id'        => time() . rand(100, 999),
    'name'      => htmlspecialchars(trim($input['name'])),
    'phone'     => htmlspecialchars(trim($input['phone'])),
    'service'   => htmlspecialchars(trim($input['service'])),
    'notes'     => htmlspecialchars(trim($input['notes'] ?? '')),
    'date'      => $input['date'],
    'time'      => $input['time'],
    'booked_at' => date('Y-m-d H:i:s'),
];

// Load existing bookings
$file     = __DIR__ . '/bookings.json';
$bookings = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

// Check if the slot is already taken (double-booking protection)
foreach ($bookings as $b) {
    if ($b['date'] === $booking['date'] && $b['time'] === $booking['time']) {
        http_response_code(409);
        echo json_encode(['error' => 'This slot was just taken. Please choose another time.']);
        exit;
    }
}

// Save booking to JSON file
$bookings[] = $booking;
file_put_contents($file, json_encode($bookings, JSON_PRETTY_PRINT), LOCK_EX);

// ── Email notification to the dentist ─────────────────────────────────────
// Change this to your real email address
$dentist_email = 'clarissawiemputri@gmail.com';

$subject = "New Booking: {$booking['name']} on {$booking['date']} at {$booking['time']}";

$message = "
You have a new appointment booking!

Patient Name : {$booking['name']}
WhatsApp     : {$booking['phone']}
Service      : {$booking['service']}
Date         : {$booking['date']}
Time         : {$booking['time']}
Notes        : {$booking['notes']}

Booked at    : {$booking['booked_at']}
";

$headers = "From: noreply@wiradentalpractice.com\r\nContent-Type: text/plain; charset=UTF-8";

mail($dentist_email, $subject, trim($message), $headers);
// Note: mail() works on most shared hosting (Hostinger, Niagahoster, etc.)
// If it doesn't arrive, check your hosting's mail settings or use SMTP.

echo json_encode(['success' => true]);