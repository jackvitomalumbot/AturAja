-- ====================================================
-- Smart Expense Tracker - Supabase Database Schema
-- ====================================================
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Enable UUID extension (usually already enabled in Supabase)
create extension if not exists "pgcrypto";

-- Create transactions table
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  amount      numeric(12, 2)  not null check (amount > 0),
  merchant    text            not null,
  category    text            not null,
  note        text            not null default '',
  date        date            not null,
  time        time            not null,
  image_url   text,
  source      text            not null default 'MANUAL' check (source in ('MANUAL', 'AI')),
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now()
);

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on transactions
  for each row execute procedure update_updated_at_column();

-- Indexes for common queries
create index if not exists idx_transactions_date on transactions(date desc);
create index if not exists idx_transactions_source on transactions(source);
create index if not exists idx_transactions_category on transactions(category);

-- Row Level Security (Enable when you add Authentication)
-- alter table transactions enable row level security;
-- create policy "Users can manage their own transactions"
--   on transactions for all using (auth.uid() = user_id);
