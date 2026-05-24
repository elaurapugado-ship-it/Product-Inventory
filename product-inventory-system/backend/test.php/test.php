<?php
$host = "localhost";
$dbname = "product_inventory_db";
$username = "root";
$password = "";

try {   
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    echo "✅ Connected successfully!";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>