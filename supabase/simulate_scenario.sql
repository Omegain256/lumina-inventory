-- Simulation Scenario: Unified Repairs and POS Workflow
-- This script creates a realistic state for testing the new "Repair Pickup" feature.

-- 1. Ensure a test customer exists
INSERT INTO customers (name, phone, email)
VALUES ('John Akisa', '0712345678', 'john@example.com')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
RETURNING id;

-- 2. Ensure products exist in stock for simulation
INSERT INTO products (name, sku, price, stock_quantity, category_id, cost)
SELECT 'iPhone 13 Screen Protector', 'IP13-SP', 1500, 10, id, 500
FROM categories WHERE name = 'Accessories' LIMIT 1
ON CONFLICT (sku) DO UPDATE SET stock_quantity = 10;

INSERT INTO products (name, sku, price, stock_quantity, category_id, cost)
SELECT 'iPhone 15 Glass Protector', 'IP15-GP', 2500, 50, id, 800
FROM categories WHERE name = 'Accessories' LIMIT 1
ON CONFLICT (sku) DO UPDATE SET stock_quantity = 50;

-- 3. Create a COMPLETED repair job for "John Akisa"
-- Note: Replace CUSTOMER_ID with the ID from step 1 if running manually via Dashboard.
-- We use a subquery to find the ID automatically here.
INSERT INTO repairs (
    customer_id, 
    device_name, 
    issue_description, 
    status, 
    cost, 
    technician, 
    repair_type, 
    service_category, 
    mobile_type, 
    commission_percentage
)
SELECT 
    id, 
    'iPhone 13 Pro', 
    'Cracked screen - Replacement complete', 
    'Completed', 
    18500, 
    'John Doe', 
    'Screen Replacement', 
    'Mobile Repair', 
    'Apple', 
    15
FROM customers 
WHERE phone = '0712345678'
LIMIT 1;

-- INFO: Now go to the POS (NewSale), click "Completed Repairs", search for "John", 
-- and you will see this job ready for checkout.
