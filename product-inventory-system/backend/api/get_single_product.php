<?php
// ============================================================
// get_single_product.php - Fetch One Product by ID
// Method: GET
// REST: GET /api/get_single_product.php?id=1
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

$id = $_GET['id'] ?? '';

if (empty($id) || !is_numeric($id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "A valid numeric product ID is required.",
        "errors"  => ["id" => "Missing or invalid ID parameter"]
    ]);
    exit();
}

try {
    $sql  = "SELECT * FROM products WHERE id = :id LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => (int) $id]);

    $product = $stmt->fetch();

    if ($product) {
        $product['id']    = intval($product['id']);
        $product['price'] = floatval($product['price']);
        $product['stock'] = intval($product['stock']);

        http_response_code(200);
        echo json_encode(["success" => true, "product" => $product]);
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Product with ID $id not found."
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>