-- Ghostlab Database Schema
-- Run this file first to create all tables, indexes, and functions

-- Create schema
CREATE SCHEMA IF NOT EXISTS ghostlab;
SET search_path TO ghostlab, public;

-- DROP TABLES (Dev Environment - drops all data!)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS clothing_products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- DROP FUNCTIONS
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_order_total_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_order_total_price(UUID) CASCADE;

-- 1. Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    telegram_username VARCHAR(100),
    phone_number VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clothing Products Table
CREATE TABLE clothing_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    material VARCHAR(100),
    colors TEXT[], -- Array of available colors
    available_sizes TEXT[], -- Array of available sizes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In progress', 'Canceled', 'Closed')),
    notes TEXT,
    designs JSONB, -- Store file URLs and metadata
    total_count INTEGER DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(255) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES clothing_products(id) ON DELETE RESTRICT,
    color VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_telegram ON clients(telegram_username);
CREATE INDEX idx_products_name ON clothing_products(name);
CREATE INDEX idx_products_category ON clothing_products(category);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order total count
CREATE OR REPLACE FUNCTION get_order_total_count(order_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(quantity), 0)
        FROM order_items 
        WHERE order_id = order_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order total price
CREATE OR REPLACE FUNCTION get_order_total_price(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(oi.quantity * cp.price), 0)
        FROM order_items oi
        JOIN clothing_products cp ON oi.product_id = cp.id
        WHERE oi.order_id = order_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON clothing_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify functions were created
SELECT 'Functions created successfully!' as status;
SELECT proname as function_name FROM pg_proc WHERE proname LIKE 'get_order_total%';
