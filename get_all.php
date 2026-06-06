<?php
// get_all.php
$password = "aaww2207"; // CHANGE THIS to your own password

// Verify password
if (($_GET['auth'] ?? '') !== $password) {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}

// Return the bookings file
$file = __DIR__ . '/bookings.json';
echo file_exists($file) ? file_get_contents($file) : '[]';
?>
