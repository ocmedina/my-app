-- Create expenses table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric not null check (amount > 0),
  category text not null, -- 'Fijo', 'Variable', 'Impuestos', 'Sueldos', 'Marketing', 'Otro'
  date date not null default current_date,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Create policies
create policy "Enable read access for authenticated users"
  on public.expenses for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.expenses for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated users"
  on public.expenses for update
  to authenticated
  using (true);

create policy "Enable delete for authenticated users"
  on public.expenses for delete
  to authenticated
  using (true);

-- Create index for performance
create index if not exists expenses_date_idx on public.expenses(date);
create index if not exists expenses_category_idx on public.expenses(category);
