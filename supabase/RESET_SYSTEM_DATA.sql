-- ==========================================
-- SYSTEM DATA RESET SCRIPT
-- WARNING: This will PERMANENTLY delete all sales, expenses, and transactions.
-- It will keep your Products, Categories, Brands, and Staff intact.
-- ==========================================

-- 1. Clear Sales Items (Foreign key depends on sales)
TRUNCATE TABLE public.sale_items CASCADE;

-- 2. Clear Sales
TRUNCATE TABLE public.sales CASCADE;

-- 3. Clear Inventory Transactions (Stock logs)
TRUNCATE TABLE public.inventory_transactions CASCADE;

-- 4. Clear Expenses
TRUNCATE TABLE public.expenses CASCADE;

-- 5. Clear Workshifts
TRUNCATE TABLE public.workshifts CASCADE;

-- 6. Clear Repairs
TRUNCATE TABLE public.repairs CASCADE;

-- 7. Reset Stock Quantities to 0 (Optional but recommended for a clean start)
-- Uncomment the line below if you want all product stock to also reset to 0.
-- UPDATE public.products SET stock_quantity = 0;

-- 8. Reset sequences so new IDs start from 1
ALTER SEQUENCE IF EXISTS sales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS workshifts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS repairs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_transactions_id_seq RESTART WITH 1;
