<?php
header('Content-Type: application/json');

$date = $_GET['date'] ?? '';

// Basic date validation
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    echo json_encode([]);
    exit;
}

$file     = __DIR__ . '/bookings.json';
$bookings = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

// Collect booked times for this date
$booked = [];
foreach ($bookings as $b) {
    if ($b['date'] === $date) {
        $booked[] = $b['time'];
    }
}

echo json_encode($booked);