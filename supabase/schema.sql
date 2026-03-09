-- SQL Schema for Lumina Inventory

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (Role Management)
create table profiles (
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Shops table
create table shops (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  phone text,
  manager text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Warehouses table
create table warehouses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  capacity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text unique,
  category text,
  brand text,
  price decimal(10,2) not null default 0.00,
  cost decimal(10,2) not null default 0.00,
  stock_quantity integer default 0,
  shop_id uuid references shops(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sales table
create table sales (
  id uuid default uuid_generate_v4() primary key,
  total_amount decimal(10,2) not null,
  payment_method text,
  user_id uuid references auth.users(id),
  shop_id uuid references shops(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sale Items table (Relational Breakdown)
create table sale_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workshifts table
create table workshifts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  status text check (status in ('active', 'ended')) default 'active',
  total_sales decimal(10,2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
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
    issue_description TEXT,
    status TEXT DEFAULT 'received',
    cost DECIMAL(12, 2) DEFAULT 0,
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

-- Enable RLS
alter table profiles enable row level security;
alter table shops enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table workshifts enable row level security;
alter table warehouses enable row level security;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);
create policy "Admins can update all profiles." on profiles for update using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "Admins can view all profiles." on profiles for select using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "All authenticated users can manage everything." on products for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything sales." on sales for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything workshifts." on workshifts for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything customers." on customers for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything suppliers." on suppliers for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything repairs." on repairs for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything locations." on locations for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything inventory." on inventory for all using (auth.role() = 'authenticated');
create policy "All authenticated users can manage everything transfers." on transfers for all using (auth.role() = 'authenticated');
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

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Policies
create policy "All authenticated users can manage settings." on settings for all using (auth.role() = 'authenticated');

