<?php
// ============================================================
// update_product.php - Update an Existing Product
// Method: POST (tunnels PUT for multipart/form-data file uploads)
// REST: PUT /api/update_product.php
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Use PUT or POST.",
        "allowed_methods" => ["PUT", "POST"]
    ]);
    exit();
}

require_once '../config/database.php';

// ---- Collect and validate input ----
$id           = $_POST['id'] ?? '';
$product_name = trim($_POST['product_name'] ?? '');
$category     = trim($_POST['category'] ?? '');
$price        = $_POST['price'] ?? '';
$stock        = $_POST['stock'] ?? '';
$description  = trim($_POST['description'] ?? '');

$errors = [];

if (empty($id) || !is_numeric($id)) {
    $errors[] = "A valid product ID is required.";
}
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
$new_image  = null;
$upload_dir = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;

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

    $file_ext    = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    $new_image   = uniqid('product_', true) . '.' . $file_ext;
    $upload_path = $upload_dir . $new_image;

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

try {
    // Verify product exists
    $check = $pdo->prepare("SELECT id, image FROM products WHERE id = :id");
    $check->execute([':id' => (int) $id]);
    $existing = $check->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Product with ID $id not found."
        ]);
        exit();
    }

    if ($new_image) {
        // Delete old image file using absolute path
        if (!empty($existing['image'])) {
            $old_path = $upload_dir . $existing['image'];
            if (file_exists($old_path)) unlink($old_path);
        }

        $sql = "UPDATE products
                SET product_name = :product_name,
                    category     = :category,
                    price        = :price,
                    stock        = :stock,
                    description  = :description,
                    image        = :image
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':product_name' => $product_name,
            ':category'     => $category,
            ':price'        => floatval($price),
            ':stock'        => intval($stock),
            ':description'  => $description,
            ':image'        => $new_image,
            ':id'           => (int) $id
        ]);
    } else {
        $sql = "UPDATE products
                SET product_name = :product_name,
                    category     = :category,
                    price        = :price,
                    stock        = :stock,
                    description  = :description
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':product_name' => $product_name,
            ':category'     => $category,
            ':price'        => floatval($price),
            ':stock'        => intval($stock),
            ':description'  => $description,
            ':id'           => (int) $id
        ]);
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Product updated successfully!",
        "data"    => [
            "id"           => (int) $id,
            "product_name" => $product_name,
            "category"     => $category,
            "price"        => floatval($price),
            "stock"        => intval($stock),
            "description"  => $description
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