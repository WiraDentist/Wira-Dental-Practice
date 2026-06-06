<?php
// book.php - No JSON, uses pipe-delimited text
$data = json_decode(file_get_contents('php://input'), true);
$file = __DIR__ . '/bookings.csv';

$row = [
    $data['name'], $data['phone'], $data['service'], 
    $data['date'], $data['time'], $data['notes']
];

$handle = fopen($file, 'a');
fputcsv($handle, $row);
fclose($handle);

echo "success";
?>
