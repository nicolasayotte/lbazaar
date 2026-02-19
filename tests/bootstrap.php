<?php
// Kill any stale connections to the testing database before running tests.
// This prevents zombie connections (from killed test processes) from blocking the suite.

$host = $_SERVER['DB_HOST'] ?? 'mysql';
$user = $_SERVER['DB_USERNAME'] ?? 'sail';
$pass = $_SERVER['DB_PASSWORD'] ?? 'password';

try {
    $pdo = new PDO("mysql:host={$host};port=3306", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Kill stale connections to testing databases (skip our own).
    // - Sleep connections: idle zombies from killed processes
    // - Execute connections running >10s: stuck queries holding locks
    //   (normal test queries complete in milliseconds)
    $ownId = $pdo->query("SELECT CONNECTION_ID()")->fetchColumn();
    $stmt = $pdo->query("SHOW PROCESSLIST");

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $proc) {
        if ($proc['Id'] == $ownId) continue;
        if (!str_starts_with($proc['db'] ?? '', 'testing')) continue;

        $isSleeping = $proc['Command'] === 'Sleep';
        $isStuckQuery = $proc['Command'] !== 'Sleep' && (int) $proc['Time'] > 10;

        if ($isSleeping || $isStuckQuery) {
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
