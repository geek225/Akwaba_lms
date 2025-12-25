-- CLEANUP: Supprime les tables existantes pour éviter les conflits de types (UUID vs Text)
-- Attention : Cela effacera les données actuelles de ces tables dans Supabase pour permettre une migration propre.
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.access_codes CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
-- id est de type TEXT pour accepter à la fois les UUID de Supabase Auth et les IDs 'u1', 'u2' de démo
create table public.users (
  id text primary key, 
  email text,
  name text,
  first_name text,
  role text,
  avatar text,
  phone text,
  country text,
  city text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- COURSES TABLE
-- id est de type TEXT pour accepter 'c1', 'c2'
create table public.courses (
  id text primary key,
  title text not null,
  instructor_name text,
  instructor_id text, -- Lien vers users(id)
  thumbnail text,
  category text,
  description text,
  is_draft boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MODULES TABLE
create table public.modules (
  id text primary key,
  course_id text references public.courses(id) on delete cascade,
  title text,
  video_url text,
  video_type text, -- 'file' ou 'url'
  description text,
  quiz jsonb, -- Stockage des questions en JSON
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENROLLMENTS TABLE
create table public.enrollments (
  user_id text references public.users(id) on delete cascade,
  course_id text references public.courses(id) on delete cascade,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()),
  progress integer default 0,
  primary key (user_id, course_id)
);

-- BLOG POSTS TABLE
create table public.blog_posts (
  id text primary key,
  title text,
  excerpt text,
  content text,
  author_id text,
  author_name text,
  cover_image text,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ACCESS CODES TABLE
create table public.access_codes (
  code text primary key,
  role text,
  is_used boolean default false,
  generated_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MESSAGES TABLE
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  from_id text, -- references users(id)
  to_id text, -- references users(id)
  text text,
  file_name text,
  file_data text, -- base64 data
  file_type text,
  file_size numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  read boolean default false
);

-- RLS POLICIES (Sécurité)
alter table public.users enable row level security;
create policy "Public users are viewable by everyone" on public.users for select using (true);
create policy "Users can insert their own profile" on public.users for insert with check (true); -- Permissif pour la migration
create policy "Users can update own profile" on public.users for update using (true); -- Permissif pour la migration

alter table public.courses enable row level security;
create policy "Courses are viewable by everyone" on public.courses for select using (true);
create policy "Instructors/Admins can manage courses" on public.courses for all using (true);

alter table public.modules enable row level security;
create policy "Modules are viewable by everyone" on public.modules for select using (true);
create policy "Instructors/Admins can manage modules" on public.modules for all using (true);

alter table public.enrollments enable row level security;
create policy "Enrollments viewable by everyone" on public.enrollments for select using (true); -- Simplifié pour le débug
create policy "Enrollments manageable by everyone" on public.enrollments for all using (true);

alter table public.blog_posts enable row level security;
create policy "Blog posts viewable by everyone" on public.blog_posts for select using (true);
create policy "Editors/Admins can manage blog" on public.blog_posts for all using (true);

alter table public.access_codes enable row level security;
create policy "Access codes viewable by everyone" on public.access_codes for select using (true);
create policy "Access codes manageable by admins" on public.access_codes for all using (true);

alter table public.messages enable row level security;
create policy "Messages viewable by everyone" on public.messages for select using (true);
create policy "Messages insertable by everyone" on public.messages for insert with check (true);
create policy "Messages updatable by everyone" on public.messages for update using (true);
