<?php
// book.php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$file = __DIR__ . '/bookings.csv';

// Prepare the row (ID, Name, Phone, Service, Date, Time, Notes, Timestamp)
$row = [
    time() . rand(100, 999),
    str_replace(',', ' ', $input['name']),
    str_replace(',', ' ', $input['phone']),
    str_replace(',', ' ', $input['service']),
    $input['date'],
    $input['time'],
    str_replace(',', ' ', $input['notes'] ?? ''),
    date('Y-m-d H:i:s')
];

// Append to CSV
$handle = fopen($file, 'a');
fputcsv($handle, $row);
fclose($handle);

echo json_encode(['success' => true]);
?>
