-- Ghostlab Database Seed Data
-- Run this file after schema.sql to populate tables with sample data

SET search_path TO ghostlab, public;

-- 1. Insert Clients
INSERT INTO clients (name, email, pin_hash, telegram_username, phone_number, notes) VALUES
('Katya Lololo', 'katya@example.com', '$2b$10$example.hash.for.pin.1234', '@katya_ua', '+380501234567', 'Regular customer, prefers winter gear'),
('Alex Petrov', 'alex.petrov@gmail.com', '$2b$10$example.hash.for.pin.5678', '@alex_tactical', '+380671234567', 'Military unit commander'),
('Maria Kovalenko', 'maria.k@outlook.com', '$2b$10$example.hash.for.pin.9012', '@maria_k', '+380931234567', NULL),
('Dmitro Shevchenko', 'dmitro@protonmail.com', '$2b$10$example.hash.for.pin.3456', '@dmitro_ghost', '+380661234567', 'Bulk orders for team'),
('Oksana Bondar', 'oksana.bondar@yahoo.com', '$2b$10$example.hash.for.pin.7890', '@oksana_b', NULL, 'Designer, needs custom patches');

-- 2. Insert Clothing Products
INSERT INTO clothing_products (name, price, category, material, colors, available_sizes) VALUES
('Tactical T-Shirt', 450.00, 'T-Shirts', 'Cotton Blend', ARRAY['Black', 'Olive', 'Gray', 'Coyote'], ARRAY['S', 'M', 'L', 'XL', 'XXL']),
('Combat Pants', 1200.00, 'Pants', 'Ripstop Nylon', ARRAY['Black', 'Olive', 'Multicam'], ARRAY['28', '30', '32', '34', '36', '38']),
('Tactical Hoodie', 850.00, 'Hoodies', 'Cotton Fleece', ARRAY['Black', 'Gray', 'Olive'], ARRAY['S', 'M', 'L', 'XL', 'XXL']),
('Patrol Cap', 320.00, 'Headwear', 'Cotton Ripstop', ARRAY['Black', 'Olive', 'Multicam', 'Coyote'], ARRAY['S/M', 'L/XL']),
('Tactical Vest', 2500.00, 'Vests', 'Cordura Nylon', ARRAY['Black', 'Olive', 'Multicam'], ARRAY['S', 'M', 'L', 'XL']),
('Combat Boots', 1800.00, 'Footwear', 'Leather/Nylon', ARRAY['Black', 'Coyote'], ARRAY['39', '40', '41', '42', '43', '44', '45']),
('Tactical Gloves', 380.00, 'Accessories', 'Synthetic Leather', ARRAY['Black', 'Olive', 'Coyote'], ARRAY['S', 'M', 'L', 'XL']),
('Field Jacket', 1650.00, 'Jackets', 'Softshell', ARRAY['Black', 'Olive', 'Gray'], ARRAY['S', 'M', 'L', 'XL', 'XXL']);

-- 3. Insert Orders (no Negotiation status)
INSERT INTO orders (client_id, status, notes) VALUES
((SELECT id FROM clients WHERE email = 'katya@example.com'), 'In progress', 'Rush order for winter deployment'),
((SELECT id FROM clients WHERE email = 'alex.petrov@gmail.com'), 'Pending', 'Standard issue for new recruits'),
((SELECT id FROM clients WHERE email = 'maria.k@outlook.com'), 'Closed', 'Completed and delivered'),
((SELECT id FROM clients WHERE email = 'dmitro@protonmail.com'), 'Pending', 'Discussing bulk pricing'),
((SELECT id FROM clients WHERE email = 'oksana.bondar@yahoo.com'), 'Pending', 'Waiting for patch designs');

-- 4. Insert Order Items (no price fields)
INSERT INTO order_items (item_name, order_id, product_id, color, size, quantity) VALUES
-- Katya's Winter Order (first order)
('Tactical Hoodie - Black - L', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'katya@example.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Tactical Hoodie'), 
 'Black', 'L', 2),
('Combat Pants - Olive - 32', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'katya@example.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Combat Pants'), 
 'Olive', '32', 1),
('Tactical Gloves - Black - M', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'katya@example.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Tactical Gloves'), 
 'Black', 'M', 1),

-- Alex's Team Equipment
('Tactical T-Shirt - Olive - L', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'alex.petrov@gmail.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Tactical T-Shirt'), 
 'Olive', 'L', 5),
('Patrol Cap - Olive - L/XL', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'alex.petrov@gmail.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Patrol Cap'), 
 'Olive', 'L/XL', 5),

-- Maria's Personal Kit
('Combat Boots - Black - 39', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'maria.k@outlook.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Combat Boots'), 
 'Black', '39', 1),
('Tactical Vest - Black - M', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'maria.k@outlook.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Tactical Vest'), 
 'Black', 'M', 1),

-- Dmitro's Bulk Order
('Field Jacket - Olive - XL', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'dmitro@protonmail.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Field Jacket'), 
 'Olive', 'XL', 10),
('Combat Pants - Multicam - 34', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'dmitro@protonmail.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Combat Pants'), 
 'Multicam', '34', 8),

-- Oksana's Custom Order
('Tactical T-Shirt - Gray - S', 
 (SELECT id FROM orders WHERE client_id = (SELECT id FROM clients WHERE email = 'oksana.bondar@yahoo.com')), 
 (SELECT id FROM clothing_products WHERE name = 'Tactical T-Shirt'), 
 'Gray', 'S', 3);
