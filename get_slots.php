<?php
// get_slots.php
header('Content-Type: application/json');

$date = $_GET['date'] ?? '';
$file = __DIR__ . '/bookings.csv';
$booked = [];

if (file_exists($file)) {
    $handle = fopen($file, 'r');
    while (($data = fgetcsv($handle)) !== FALSE) {
        // Date is index 4, Time is index 5
        if (isset($data[4]) && $data[4] === $date) {
            $booked[] = $data[5];
        }
    }
    fclose($handle);
}
echo json_encode($booked);
?>
