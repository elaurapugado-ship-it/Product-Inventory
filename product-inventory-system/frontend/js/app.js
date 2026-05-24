// ============================================================
// app.js - Product Inventory Management System
// All frontend logic: CRUD, search, UI updates
// ============================================================

// ---- Base URL for the backend API ----
const API_BASE     = "http://localhost/product-inventory-system/backend/api";
const UPLOADS_BASE = "../backend/uploads/";

// ---- Bootstrap modal instances ----
let addModal, editModal, deleteModal;

// ---- Track which product ID to delete ----
let productToDeleteId = null;

// ---- Track current view mode ----
let currentView = "table";

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    addModal    = new bootstrap.Modal(document.getElementById("addProductModal"));
    editModal   = new bootstrap.Modal(document.getElementById("editProductModal"));
    deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));

    loadProducts();

    document.getElementById("openAddModal").addEventListener("click", () => {
        resetAddForm();
        addModal.show();
    });
    document.getElementById("emptyAddBtn").addEventListener("click", () => {
        resetAddForm();
        addModal.show();
    });

    document.getElementById("submitAddProduct").addEventListener("click", addProduct);
    document.getElementById("submitEditProduct").addEventListener("click", updateProduct);
    document.getElementById("confirmDelete").addEventListener("click", deleteProduct);

    let searchTimer;
    document.getElementById("searchInput").addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadProducts(this.value), 350);
    });

    document.getElementById("clearSearch").addEventListener("click", function () {
        document.getElementById("searchInput").value = "";
        loadProducts();
    });

    document.getElementById("tableViewBtn").addEventListener("click", () => switchView("table"));
    document.getElementById("cardViewBtn").addEventListener("click", () => switchView("card"));

    document.getElementById("addImageInput").addEventListener("change", function () {
        showImagePreview(this, "addImagePreview");
    });
    document.getElementById("editImageInput").addEventListener("change", function () {
        showImagePreview(this, "editImagePreview");
    });
});


// ============================================================
// RESET ADD FORM
// ============================================================
function resetAddForm() {
    document.getElementById("addProductForm").reset();
    document.getElementById("addImagePreview").classList.add("d-none");
    document.getElementById("addErrorAlert").classList.add("d-none");
}


// ============================================================
// LOAD PRODUCTS
// ============================================================
async function loadProducts(searchQuery = "") {
    showSpinner(true);

    let url = `${API_BASE}/get_products.php`;
    if (searchQuery.trim() !== "") {
        url += `?search=${encodeURIComponent(searchQuery.trim())}`;
    }

    try {
        const response = await fetch(url);
        const data     = await response.json();

        showSpinner(false);

        if (data.success) {
            const products = data.products;
            if (products.length === 0) {
                showEmptyState(true);
                updateStats([]);
            } else {
                showEmptyState(false);
                updateStats(products);
                renderTableView(products);
                renderCardView(products);
            }
        } else {
            showToast("Failed to load products: " + data.message, "danger");
        }

    } catch (error) {
        showSpinner(false);
        console.error("Error loading products:", error);
        showToast("Could not connect to the server. Make sure XAMPP is running.", "danger");
    }
}


// ============================================================
// Get image URL — always use relative path from frontend to backend/uploads
// ============================================================
function getImageUrl(product) {
    if (product.image) return UPLOADS_BASE + product.image;
    return null;
}


// ============================================================
// RENDER TABLE VIEW
// ============================================================
function renderTableView(products) {
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "";

    products.forEach(product => {
        const row = document.createElement("tr");

        const dateAdded = new Date(product.created_at).toLocaleDateString("en-PH", {
            year: "numeric", month: "short", day: "numeric"
        });

        const stockBadge = getStockBadge(product.stock);
        const imgUrl     = getImageUrl(product);

        const imageCell = imgUrl
            ? `<img src="${imgUrl}" alt="${escapeHtml(product.product_name)}" class="product-thumb"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <div class="product-thumb-placeholder" style="display:none;"><i class="bi bi-image"></i></div>`
            : `<div class="product-thumb-placeholder"><i class="bi bi-image"></i></div>`;

        row.innerHTML = `
            <td class="ps-4">${imageCell}</td>
            <td><span class="fw-semibold">${escapeHtml(product.product_name)}</span></td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(product.category)}</span></td>
            <td class="fw-bold text-primary">₱${formatPrice(product.price)}</td>
            <td><span class="stock-badge ${stockBadge.class}">${product.stock} ${stockBadge.label}</span></td>
            <td class="text-muted small">${dateAdded}</td>
            <td class="text-center pe-4">
                <button class="btn btn-outline-warning btn-action me-1" onclick="openEditModal(${product.id})" title="Edit">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-outline-danger btn-action" onclick="openDeleteModal(${product.id}, '${escapeHtml(product.product_name)}')" title="Delete">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


// ============================================================
// RENDER CARD VIEW
// ============================================================
function renderCardView(products) {
    const grid = document.getElementById("productCardGrid");
    grid.innerHTML = "";

    products.forEach(product => {
        const col = document.createElement("div");
        col.className = "col-sm-6 col-md-4 col-xl-3";

        const imgUrl     = getImageUrl(product);
        const stockBadge = getStockBadge(product.stock);

        const imageSection = imgUrl
            ? `<img src="${imgUrl}" alt="${escapeHtml(product.product_name)}" class="product-card-img"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <div class="product-card-placeholder" style="display:none;"><i class="bi bi-image-alt"></i></div>`
            : `<div class="product-card-placeholder"><i class="bi bi-image-alt"></i></div>`;

        col.innerHTML = `
            <div class="product-card card">
                ${imageSection}
                <div class="card-body">
                    <p class="product-category mb-1">${escapeHtml(product.category)}</p>
                    <h6 class="product-name" title="${escapeHtml(product.product_name)}">${escapeHtml(product.product_name)}</h6>
                    <p class="product-price mb-2">₱${formatPrice(product.price)}</p>
                    <div class="d-flex align-items-center justify-content-between">
                        <span class="stock-badge ${stockBadge.class}">${product.stock} ${stockBadge.label}</span>
                        <div>
                            <button class="btn btn-sm btn-outline-warning btn-action me-1" onclick="openEditModal(${product.id})" title="Edit">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-action" onclick="openDeleteModal(${product.id}, '${escapeHtml(product.product_name)}')" title="Delete">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(col);
    });
}


// ============================================================
// CLIENT-SIDE VALIDATION
// ============================================================
function validateProductForm(formData) {
    const errors      = [];
    const productName = (formData.get("product_name") || "").trim();
    const category    = (formData.get("category") || "").trim();
    const price       = (formData.get("price") || "").trim();
    const stock       = (formData.get("stock") || "").trim();

    if (!productName)                                errors.push("Product name is required.");
    else if (productName.length > 100)               errors.push("Product name must not exceed 100 characters.");

    if (!category)                                   errors.push("Please select a category.");

    if (price === "")                                errors.push("Price is required.");
    else if (isNaN(price) || parseFloat(price) < 0) errors.push("Price must be a valid positive number (e.g. 1299.00).");

    if (stock === "")                                errors.push("Stock is required.");
    else if (!/^\d+$/.test(stock))                   errors.push("Stock must be a whole number (e.g. 50). No decimals.");

    return errors;
}


// ============================================================
// ADD PRODUCT
// ============================================================
async function addProduct() {
    const form     = document.getElementById("addProductForm");
    const formData = new FormData(form);

    const errors = validateProductForm(formData);
    if (errors.length > 0) {
        showFormError("addErrorAlert", "addErrorText", errors);
        return;
    }
    hideFormError("addErrorAlert");

    const btn = document.getElementById("submitAddProduct");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Adding...`;

    try {
        const response = await fetch(`${API_BASE}/create_product.php`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            resetAddForm();
            addModal.hide();
            loadProducts();
        } else {
            const msg = Array.isArray(data.errors) ? data.errors.join(" ") : data.message;
            showFormError("addErrorAlert", "addErrorText", [msg]);
        }

    } catch (error) {
        console.error("Error adding product:", error);
        showFormError("addErrorAlert", "addErrorText", ["Failed to connect to server. Is XAMPP running?"]);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-plus-lg me-1"></i> Add Product`;
    }
}


// ============================================================
// OPEN EDIT MODAL
// ============================================================
async function openEditModal(productId) {
    try {
        const response = await fetch(`${API_BASE}/get_single_product.php?id=${productId}`);
        const data     = await response.json();

        if (!data.success) {
            showToast("Could not load product details.", "danger");
            return;
        }

        const p = data.product;

        document.getElementById("editProductId").value    = p.id;
        document.getElementById("editName").value         = p.product_name;
        document.getElementById("editPrice").value        = p.price;
        document.getElementById("editStock").value        = p.stock;
        document.getElementById("editDescription").value  = p.description || "";
        document.getElementById("editCategorySelect").value = p.category;
        document.getElementById("editErrorAlert").classList.add("d-none");

        // Show current image
        const currentImgContainer = document.getElementById("editCurrentImage");
        const imgUrl = getImageUrl(p);
        if (imgUrl) {
            currentImgContainer.innerHTML = `
                <small class="text-muted d-block mb-1">Current image:</small>
                <img src="${imgUrl}" alt="Current" class="img-thumbnail preview-img"
                     onerror="this.outerHTML='<small class=\\'text-muted\\'>Image file not found on server.</small>'">
            `;
        } else {
            currentImgContainer.innerHTML = `<small class="text-muted">No image uploaded.</small>`;
        }

        document.getElementById("editImagePreview").classList.add("d-none");
        document.getElementById("editImageInput").value = "";

        editModal.show();

    } catch (error) {
        console.error("Error loading product:", error);
        showToast("Error loading product details.", "danger");
    }
}


// ============================================================
// UPDATE PRODUCT
// ============================================================
async function updateProduct() {
    const form     = document.getElementById("editProductForm");
    const formData = new FormData(form);

    const errors = validateProductForm(formData);
    if (errors.length > 0) {
        showFormError("editErrorAlert", "editErrorText", errors);
        return;
    }
    hideFormError("editErrorAlert");

    const btn = document.getElementById("submitEditProduct");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

    try {
        const response = await fetch(`${API_BASE}/update_product.php`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            editModal.hide();
            loadProducts(document.getElementById("searchInput").value);
        } else {
            const msg = Array.isArray(data.errors) ? data.errors.join(" ") : data.message;
            showFormError("editErrorAlert", "editErrorText", [msg]);
        }

    } catch (error) {
        console.error("Error updating product:", error);
        showFormError("editErrorAlert", "editErrorText", ["Failed to connect to server."]);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-check-lg me-1"></i> Save Changes`;
    }
}


// ============================================================
// OPEN DELETE MODAL
// ============================================================
function openDeleteModal(productId, productName) {
    productToDeleteId = productId;
    document.getElementById("deleteProductName").textContent = `"${productName}"`;
    deleteModal.show();
}


// ============================================================
// DELETE PRODUCT
// ============================================================
async function deleteProduct() {
    if (!productToDeleteId) return;

    const btn = document.getElementById("confirmDelete");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Deleting...`;

    try {
        const response = await fetch(`${API_BASE}/delete_product.php`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: productToDeleteId })
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            deleteModal.hide();
            productToDeleteId = null;
            loadProducts(document.getElementById("searchInput").value);
        } else {
            showToast(data.message, "danger");
        }

    } catch (error) {
        console.error("Error deleting product:", error);
        showToast("Failed to connect to server.", "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-trash me-1"></i> Yes, Delete`;
    }
}


// ============================================================
// HELPER: Show validation error inside form
// ============================================================
function showFormError(alertId, textId, errors) {
    const alert = document.getElementById(alertId);
    const text  = document.getElementById(textId);
    text.innerHTML = errors.map(e => `• ${e}`).join("<br>");
    alert.classList.remove("d-none");
    alert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideFormError(alertId) {
    document.getElementById(alertId).classList.add("d-none");
}


// ============================================================
// HELPER: Update Dashboard Stats
// ============================================================
function updateStats(products) {
    const total      = products.length;
    const categories = [...new Set(products.map(p => p.category))].length;
    const totalStock = products.reduce((sum, p) => sum + parseInt(p.stock), 0);
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.stock)), 0);

    document.getElementById("statTotal").textContent      = total;
    document.getElementById("statCategories").textContent = categories;
    document.getElementById("statStock").textContent      = totalStock.toLocaleString();
    document.getElementById("statValue").textContent      = "₱" + totalValue.toLocaleString("en-PH", {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
}


// ============================================================
// HELPER: Switch between Table and Card views
// ============================================================
function switchView(view) {
    currentView = view;

    const tableView = document.getElementById("tableView");
    const cardView  = document.getElementById("cardView");
    const tableBtn  = document.getElementById("tableViewBtn");
    const cardBtn   = document.getElementById("cardViewBtn");

    if (view === "table") {
        tableView.classList.remove("d-none");
        cardView.classList.add("d-none");
        tableBtn.classList.add("active");
        cardBtn.classList.remove("active");
    } else {
        cardView.classList.remove("d-none");
        tableView.classList.add("d-none");
        cardBtn.classList.add("active");
        tableBtn.classList.remove("active");
    }
}


// ============================================================
// HELPER: Show image preview before uploading
// ============================================================
function showImagePreview(inputElement, previewContainerId) {
    const container = document.getElementById(previewContainerId);
    const file      = inputElement.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            container.querySelector("img").src = e.target.result;
            container.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    } else {
        container.classList.add("d-none");
    }
}


// ============================================================
// HELPER: Show or hide the loading spinner
// ============================================================
function showSpinner(show) {
    document.getElementById("loadingSpinner").classList.toggle("d-none", !show);
    document.getElementById("tableView").classList.toggle("d-none", show);
    document.getElementById("cardView").classList.toggle("d-none", true);
}


// ============================================================
// HELPER: Show or hide the empty state
// ============================================================
function showEmptyState(show) {
    document.getElementById("emptyState").classList.toggle("d-none", !show);

    if (!show) {
        if (currentView === "table") {
            document.getElementById("tableView").classList.remove("d-none");
            document.getElementById("cardView").classList.add("d-none");
        } else {
            document.getElementById("cardView").classList.remove("d-none");
            document.getElementById("tableView").classList.add("d-none");
        }
    } else {
        document.getElementById("tableView").classList.add("d-none");
        document.getElementById("cardView").classList.add("d-none");
    }
}


// ============================================================
// HELPER: Show toast notification
// ============================================================
function showToast(message, type = "success") {
    const toastEl  = document.getElementById("toastNotification");
    const toastMsg = document.getElementById("toastMessage");

    toastMsg.textContent = message;
    toastEl.classList.remove("bg-success", "bg-danger", "text-white");
    toastEl.classList.add(`bg-${type}`, "text-white");

    const toastInstance = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    toastInstance.show();
}


// ============================================================
// HELPER: Determine stock badge styling
// ============================================================
function getStockBadge(stock) {
    const qty = parseInt(stock);
    if (qty === 0) return { class: "bg-danger text-white",        label: "Out of Stock" };
    if (qty <= 5)  return { class: "bg-warning text-dark",        label: "Low Stock"    };
    return             { class: "bg-success-subtle text-success", label: "in stock"     };
}


// ============================================================
// HELPER: Format price with commas
// ============================================================
function formatPrice(price) {
    return parseFloat(price).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// ============================================================
// HELPER: Escape HTML to prevent XSS
// ============================================================
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}