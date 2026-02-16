-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create kanban_columns table
create table if not exists kanban_columns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  is_archived boolean default false,
  is_published boolean default false,
  parent_document_id uuid references documents(id),
  content text,
  cover_image text,
  icon text,
  category text,
  description text,
  status text, -- Used for linking to kanban_columns
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table kanban_columns enable row level security;
alter table documents enable row level security;

-- Policies for kanban_columns
create policy "Users can create their own columns"
  on kanban_columns for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own columns"
  on kanban_columns for select
  using (auth.uid() = user_id);

create policy "Users can update their own columns"
  on kanban_columns for update
  using (auth.uid() = user_id);

create policy "Users can delete their own columns"
  on kanban_columns for delete
  using (auth.uid() = user_id);

-- Policies for documents
create policy "Users can create their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- Create Storage Buckets
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('files', 'files', true)
on conflict (id) do nothing;

-- Storage Policies for 'images' bucket
create policy "Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

create policy "Users can update their own images"
  on storage.objects for update
  using ( bucket_id = 'images' and auth.uid() = owner );

create policy "Users can delete their own images"
  on storage.objects for delete
  using ( bucket_id = 'images' and auth.uid() = owner );

-- Storage Policies for 'files' bucket
create policy "Files are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'files' );

create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check ( bucket_id = 'files' and auth.role() = 'authenticated' );

create policy "Users can update their own files"
  on storage.objects for update
  using ( bucket_id = 'files' and auth.uid() = owner );

create policy "Users can delete their own files"
  on storage.objects for delete
  using ( bucket_id = 'files' and auth.uid() = owner );
