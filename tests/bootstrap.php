<?php
// Kill any stale connections to the testing database before running tests.
// This prevents zombie connections (from killed test processes) from blocking the suite.

$host = $_SERVER['DB_HOST'] ?? 'mysql';
$user = $_SERVER['DB_USERNAME'] ?? 'sail';
$pass = $_SERVER['DB_PASSWORD'] ?? 'password';

try {
    $pdo = new PDO("mysql:host={$host};port=3306", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Find sleeping connections to testing databases (skip our own)
    $ownId = $pdo->query("SELECT CONNECTION_ID()")->fetchColumn();
    $stmt = $pdo->query("SHOW PROCESSLIST");

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $proc) {
        if ($proc['Id'] == $ownId) continue;
        if ($proc['Command'] === 'Sleep' && str_starts_with($proc['db'] ?? '', 'testing')) {
            $pdo->exec("KILL {$proc['Id']}");
        }
    }
    $pdo = null;
} catch (\Throwable $e) {
    // Non-fatal - just log and continue. Tests may still fail if locks persist.
    fwrite(STDERR, "Warning: Could not clean stale DB connections: {$e->getMessage()}\n");
}

// Load Composer autoloader (the original bootstrap)
require __DIR__ . '/../vendor/autoload.php';
