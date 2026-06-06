<?php
// get_slots.php - Returns comma-separated list of times
$targetDate = $_GET['date'] ?? '';
$file = __DIR__ . '/bookings.csv';
$bookedTimes = [];

if (file_exists($file)) {
    $handle = fopen($file, 'r');
    while (($data = fgetcsv($handle)) !== FALSE) {
        if (isset($data[3]) && $data[3] === $targetDate) {
            $bookedTimes[] = $data[4];
        }
    }
    fclose($handle);
}
echo implode(',', $bookedTimes);
?>
