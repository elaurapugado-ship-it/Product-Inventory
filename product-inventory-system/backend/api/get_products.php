<?php
// ============================================================
// get_products.php - Fetch All Products
// Method: GET
// REST: GET /api/get_products.php
//       GET /api/get_products.php?search=keyword
//       GET /api/get_products.php?category=Electronics
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Use GET.",
        "allowed_methods" => ["GET"]
    ]);
    exit();
}

require_once '../config/database.php';

$search   = trim($_GET['search'] ?? '');
$category = trim($_GET['category'] ?? '');

try {
    if (!empty($search)) {
        $sql = "SELECT * FROM products
                WHERE product_name LIKE :search OR category LIKE :search
                ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':search' => '%' . $search . '%']);
    } elseif (!empty($category)) {
        $sql = "SELECT * FROM products
                WHERE category = :category
                ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':category' => $category]);
    } else {
        $sql  = "SELECT * FROM products ORDER BY created_at DESC";
        $stmt = $pdo->query($sql);
    }

    $products = $stmt->fetchAll();

    foreach ($products as &$p) {
        $p['id']    = intval($p['id']);
        $p['price'] = floatval($p['price']);
        $p['stock'] = intval($p['stock']);
    }
    unset($p);

    http_response_code(200);
    echo json_encode([
        "success"  => true,
        "count"    => count($products),
        "products" => $products
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch products: " . $e->getMessage()
    ]);
}
?>