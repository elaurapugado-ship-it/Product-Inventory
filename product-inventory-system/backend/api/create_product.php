<?php
// ============================================================
// create_product.php - Add a New Product
// Method: POST
// REST: POST /api/create_product.php
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Use POST.",
        "allowed_methods" => ["POST"]
    ]);
    exit();
}

require_once '../config/database.php';

// ---- Collect input ----
$product_name = trim($_POST['product_name'] ?? '');
$category     = trim($_POST['category'] ?? '');
$price        = $_POST['price'] ?? '';
$stock        = $_POST['stock'] ?? '';
$description  = trim($_POST['description'] ?? '');

// ---- Validation ----
$errors = [];

if (empty($product_name)) {
    $errors[] = "Product name is required.";
} elseif (strlen($product_name) > 100) {
    $errors[] = "Product name must not exceed 100 characters.";
}
if (empty($category)) {
    $errors[] = "Category is required.";
} elseif (strlen($category) > 50) {
    $errors[] = "Category must not exceed 50 characters.";
}
if ($price === '') {
    $errors[] = "Price is required.";
} elseif (!is_numeric($price) || floatval($price) < 0) {
    $errors[] = "Price must be a valid positive number.";
}
if ($stock === '') {
    $errors[] = "Stock is required.";
} elseif (!is_numeric($stock) || intval($stock) < 0 || strpos($stock, '.') !== false) {
    $errors[] = "Stock must be a valid whole number (0 or greater).";
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "Validation failed.",
        "errors"  => $errors
    ]);
    exit();
}

// ---- Handle image upload (optional) ----
$image_filename = null;

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $max_size      = 5 * 1024 * 1024;

    $file_type = mime_content_type($_FILES['image']['tmp_name']);
    $file_size = $_FILES['image']['size'];

    if (!in_array($file_type, $allowed_types)) {
        http_response_code(422);
        echo json_encode([
            "success" => false,
            "message" => "Invalid image type. Only JPG, PNG, and WEBP are allowed.",
            "errors"  => ["image" => "Invalid file type: $file_type"]
        ]);
        exit();
    }

    if ($file_size > $max_size) {
        http_response_code(422);
        echo json_encode([
            "success" => false,
            "message" => "Image is too large. Maximum size is 5MB.",
            "errors"  => ["image" => "File size " . round($file_size / 1024 / 1024, 2) . "MB exceeds 5MB limit"]
        ]);
        exit();
    }

    $file_ext       = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    $image_filename = uniqid('product_', true) . '.' . $file_ext;

    // Use absolute path based on this file's location so it always works
    // __DIR__ = .../product-inventory-system/backend/api
    $upload_dir  = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $upload_path = $upload_dir . $image_filename;

    // Create uploads folder if it doesn't exist yet
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $upload_path)) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to save image. Make sure backend/uploads/ folder exists and is writable."
        ]);
        exit();
    }
}

// ---- Insert into database ----
try {
    $sql = "INSERT INTO products (product_name, category, price, stock, description, image)
            VALUES (:product_name, :category, :price, :stock, :description, :image)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':product_name' => $product_name,
        ':category'     => $category,
        ':price'        => floatval($price),
        ':stock'        => intval($stock),
        ':description'  => $description,
        ':image'        => $image_filename
    ]);

    $newId = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Product added successfully!",
        "data"    => [
            "id"           => (int) $newId,
            "product_name" => $product_name,
            "category"     => $category,
            "price"        => floatval($price),
            "stock"        => intval($stock),
            "description"  => $description,
            "image"        => $image_filename
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>