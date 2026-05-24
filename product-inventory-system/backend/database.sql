-- ============================================================
-- Product Inventory Management System
-- Database Setup File
-- Author: Student Developer
-- ============================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS product_inventory_db;

-- Use the database
USE product_inventory_db;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    description TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample products to get started
INSERT INTO products (product_name, category, price, stock, description) VALUES
('Wireless Headphones', 'Electronics', 1299.00, 25, 'High-quality wireless headphones with noise cancellation and 30-hour battery life.'),
('Running Shoes', 'Footwear', 2499.00, 40, 'Lightweight running shoes with extra cushion for long distance comfort.'),
('Leather Wallet', 'Accessories', 599.00, 100, 'Slim genuine leather wallet with RFID protection and multiple card slots.'),
('Stainless Water Bottle', 'Lifestyle', 399.00, 75, 'Double-walled insulated water bottle, keeps drinks cold for 24 hours.'),
('Mechanical Keyboard', 'Electronics', 3499.00, 15, 'Compact TKL mechanical keyboard with tactile switches and RGB backlight.');
