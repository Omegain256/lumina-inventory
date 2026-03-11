-- SQL Schema for Lumina Inventory (Idempotent Version)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (Role Management)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('admin', 'manager', 'staff')) default 'staff',
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin'); -- Defaulting first users to admin for demo
  return new;
end;
$$ language plpgsql security definer;

-- Trigger cleanup and creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Shops table
create table if not exists shops (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  phone text,
  manager text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Warehouses table
create table if not exists warehouses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  capacity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Brands table
create table if not exists brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Units table
create table if not exists units (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  abbreviation text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text unique,
  category_id uuid references categories(id),
  brand_id uuid references brands(id),
  unit_id uuid references units(id),
  supplier_id uuid references suppliers(id),
  price decimal(10,2) not null default 0.00,
  cost decimal(10,2) not null default 0.00,
  stock_quantity integer default 0,
  shop_id uuid references shops(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure products has all necessary columns if it already existed
do $$ 
begin
  if not exists (select from information_schema.columns where table_name='products' and column_name='category_id') then
    alter table products add column category_id uuid references categories(id);
  end if;
  if not exists (select from information_schema.columns where table_name='products' and column_name='brand_id') then
    alter table products add column brand_id uuid references brands(id);
  end if;
  if not exists (select from information_schema.columns where table_name='products' and column_name='unit_id') then
    alter table products add column unit_id uuid references units(id);
  end if;
  if not exists (select from information_schema.columns where table_name='products' and column_name='supplier_id') then
    alter table products add column supplier_id uuid references suppliers(id);
  end if;
end $$;

-- Sales table
create table if not exists sales (
  id uuid default uuid_generate_v4() primary key,
  total_amount decimal(10,2) not null,
  payment_method text,
  payment_reference text,
  user_id uuid references auth.users(id),
  customer_id uuid references customers(id),
  shop_id uuid references shops(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure sales has customer_id and payment_reference if it already existed
do $$
begin
  if not exists (select from information_schema.columns where table_name='sales' and column_name='customer_id') then
    alter table sales add column customer_id uuid references customers(id);
  end if;
  if not exists (select from information_schema.columns where table_name='sales' and column_name='payment_reference') then
    alter table sales add column payment_reference text;
  end if;
end $$;

-- Sale Items table (Relational Breakdown)
create table if not exists sale_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workshifts table
create table if not exists workshifts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  user_name text,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  status text check (status in ('active', 'completed')) default 'active',
  total_sales decimal(10,2) default 0.00,
  sales_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Purchases
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id),
    total_amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Repairs
CREATE TABLE IF NOT EXISTS public.repairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id),
    device_name TEXT NOT NULL,
    imei TEXT,
    issue_description TEXT,
    status TEXT DEFAULT 'pending',
    cost DECIMAL(12, 2) DEFAULT 0,
    technician TEXT,
    repair_type TEXT,
    service_category TEXT,
    mobile_type TEXT,
    commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
    shop_id UUID REFERENCES public.shops(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Locations (Warehouses and Shops)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'warehouse' or 'shop'
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory (Stock per location)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, location_id)
);

-- Transfers
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_location_id UUID REFERENCES public.locations(id),
    from_location_name TEXT,
    to_location_id UUID REFERENCES public.locations(id),
    to_location_name TEXT,
    items JSONB DEFAULT '[]',
    total_value DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Commissions
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    sale_id UUID REFERENCES public.sales(id),
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory Transactions (Purchases and Returns)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'purchase' or 'return'
    quantity INTEGER NOT NULL,
    reference TEXT,
    notes TEXT,
    product_name TEXT,
    product_sku TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY, -- 'global'
    shop_name TEXT,
    shop_address TEXT,
    shop_phone TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    kra_pin TEXT,
    whatsapp_phone TEXT,
    paybill_number TEXT,
    account_number TEXT,
    account_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Safe to re-run)
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.workshifts enable row level security;
alter table public.warehouses enable row level security;
alter table public.customers ENABLE ROW LEVEL SECURITY;
alter table public.suppliers ENABLE ROW LEVEL SECURITY;
alter table public.purchases ENABLE ROW LEVEL SECURITY;
alter table public.repairs ENABLE ROW LEVEL SECURITY;
alter table public.locations ENABLE ROW LEVEL SECURITY;
alter table public.inventory ENABLE ROW LEVEL SECURITY;
alter table public.transfers ENABLE ROW LEVEL SECURITY;
alter table public.commissions ENABLE ROW LEVEL SECURITY;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.units enable row level security;
alter table public.inventory_transactions ENABLE ROW LEVEL SECURITY;
alter table public.settings enable row level security;

-- Policies (Re-create for idempotency)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);

drop policy if exists "Users can update their own profile." on profiles;
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- Function to securely get user role without triggering RLS recursion
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer set search_path = public;

drop policy if exists "Admins can update all profiles." on profiles;
create policy "Admins can update all profiles." on profiles for update using (
  public.get_user_role() = 'admin'
);

drop policy if exists "Admins can view all profiles." on profiles;
-- NOTE: Deleted the recursive select policy because "Public profiles are viewable by everyone." already exists and provides the necessary read access without infinite loops.

drop policy if exists "All authenticated users can manage everything." on products;
create policy "All authenticated users can manage everything." on products for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything sales." on sales;
create policy "All authenticated users can manage everything sales." on sales for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything workshifts." on workshifts;
create policy "All authenticated users can manage everything workshifts." on workshifts for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything customers." on customers;
create policy "All authenticated users can manage everything customers." on customers for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything suppliers." on suppliers;
create policy "All authenticated users can manage everything suppliers." on suppliers for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything repairs." on repairs;
create policy "All authenticated users can manage everything repairs." on repairs for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything locations." on locations;
create policy "All authenticated users can manage everything locations." on locations for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything inventory." on inventory;
create policy "All authenticated users can manage everything inventory." on inventory for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything transfers." on transfers;
create policy "All authenticated users can manage everything transfers." on transfers for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything categories." on categories;
create policy "All authenticated users can manage everything categories." on categories for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything brands." on brands;
create policy "All authenticated users can manage everything brands." on brands for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage everything units." on units;
create policy "All authenticated users can manage everything units." on units for all using (auth.role() = 'authenticated');

drop policy if exists "All authenticated users can manage settings." on settings;
create policy "All authenticated users can manage settings." on settings for all using (auth.role() = 'authenticated');
