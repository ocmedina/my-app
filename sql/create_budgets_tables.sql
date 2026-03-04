-- Tabla de presupuestos (no impacta stock)
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  total_amount numeric not null check (total_amount >= 0),
  status text not null default 'activo',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Ítems del presupuesto
create table if not exists public.budget_items (
  id bigserial primary key,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  price numeric not null check (price >= 0)
);

-- RLS
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;

-- Policies budgets
create policy "Enable read access for authenticated users"
  on public.budgets for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.budgets for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated users"
  on public.budgets for update
  to authenticated
  using (true);

create policy "Enable delete for authenticated users"
  on public.budgets for delete
  to authenticated
  using (true);

-- Policies budget_items
create policy "Enable read access for authenticated users"
  on public.budget_items for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.budget_items for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated users"
  on public.budget_items for update
  to authenticated
  using (true);

create policy "Enable delete for authenticated users"
  on public.budget_items for delete
  to authenticated
  using (true);

create index if not exists budgets_created_at_idx on public.budgets(created_at desc);
create index if not exists budgets_customer_id_idx on public.budgets(customer_id);
create index if not exists budget_items_budget_id_idx on public.budget_items(budget_id);
create index if not exists budget_items_product_id_idx on public.budget_items(product_id);
