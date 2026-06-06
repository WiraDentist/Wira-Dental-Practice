<?php
// get_all.php
// Password-protected admin data fetcher

$password = "aaww2207"; // CHANGE THIS to your chosen password

if ($_GET['auth'] !== $password) {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}

$file = __DIR__ . '/bookings.json';
echo file_exists($file) ? file_get_contents($file) : '[]';
?>
