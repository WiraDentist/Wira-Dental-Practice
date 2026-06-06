<?php
// get_all.php - Password protected, returns pipe-delimited rows
$password = "aaww2207";
if (($_GET['auth'] ?? '') !== $password) { http_response_code(403); exit("Unauthorized"); }

$file = __DIR__ . '/bookings.csv';
if (file_exists($file)) {
    $handle = fopen($file, 'r');
    while (($data = fgetcsv($handle)) !== FALSE) {
        echo implode('|', $data) . "\n";
    }
    fclose($handle);
}
?>
