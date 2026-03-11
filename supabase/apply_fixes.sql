-- Fix: Add missing columns required by the new React frontend logic

-- 1. Workshifts table missing 'user_name' which is inserted when shift starts
ALTER TABLE workshifts ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Sales table missing 'payment_reference' which is inserted for M-Pesa/Card
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 3. Sale Items missing 'unit_price' and 'quantity' just in case (though it should have them, let's make sure it's fully compatible)
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- 4. Workshifts missing 'sales_count' which was causing tracking bugs earlier
ALTER TABLE workshifts ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
