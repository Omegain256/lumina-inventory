-- SQL Fix: Allow product deletion by cascading to sale history
-- Run this in the Supabase SQL Editor

DO $$ 
BEGIN
    -- Fix sale_items reference
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sale_items_product_id_fkey'
    ) THEN
        ALTER TABLE sale_items DROP CONSTRAINT sale_items_product_id_fkey;
    END IF;
    
    ALTER TABLE sale_items 
    ADD CONSTRAINT sale_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

    -- Double check inventory_transactions (should already have it, but let's be safe)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_transactions_product_id_fkey'
    ) THEN
        ALTER TABLE inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
    END IF;

    ALTER TABLE inventory_transactions 
    ADD CONSTRAINT inventory_transactions_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

    -- Double check inventory (should already have it, but let's be safe)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_product_id_fkey'
    ) THEN
        ALTER TABLE inventory DROP CONSTRAINT inventory_product_id_fkey;
    END IF;

    ALTER TABLE inventory 
    ADD CONSTRAINT inventory_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

END $$;
