<?php
// get_all.php
header('Content-Type: application/json');

$password = "aaww2207";
if (($_GET['auth'] ?? '') !== $password) { http_response_code(403); exit; }

$file = __DIR__ . '/bookings.csv';
$bookings = [];

if (file_exists($file)) {
    $handle = fopen($file, 'r');
    while (($data = fgetcsv($handle)) !== FALSE) {
        $bookings[] = [
            'id' => $data[0], 'name' => $data[1], 'phone' => $data[2], 
            'service' => $data[3], 'date' => $data[4], 'time' => $data[5], 'notes' => $data[6]
        ];
    }
    fclose($handle);
}
echo json_encode(array_reverse($bookings));
?>
