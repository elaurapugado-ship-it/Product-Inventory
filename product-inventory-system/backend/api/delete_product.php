<?php
// ============================================================
// delete_product.php - Delete a Product by ID
// Method: DELETE
// REST: DELETE /api/delete_product.php
// Body: JSON { "id": 1 }
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Use DELETE.",
        "allowed_methods" => ["DELETE"]
    ]);
    exit();
}

require_once '../config/database.php';

$body = file_get_contents("php://input");
$data = json_decode($body, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON body.",
        "errors"  => ["body" => json_last_error_msg()]
    ]);
    exit();
}

$id = $data['id'] ?? '';

if (empty($id) || !is_numeric($id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "A valid numeric product ID is required.",
        "errors"  => ["id" => "Missing or invalid ID"]
    ]);
    exit();
}

try {
    $check = $pdo->prepare("SELECT id, image FROM products WHERE id = :id");
    $check->execute([':id' => (int) $id]);
    $product = $check->fetch();

    if (!$product) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Product with ID $id not found."
        ]);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
    $stmt->execute([':id' => (int) $id]);

    if (!empty($product['image'])) {
        $image_path = '../uploads/' . $product['image'];
        if (file_exists($image_path)) unlink($image_path);
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Product deleted successfully!",
        "data"    => ["deleted_id" => (int) $id]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>