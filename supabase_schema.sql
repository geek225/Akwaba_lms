-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (Already likely exists, but ensuring columns)
create table if not exists public.users (
  id uuid references auth.users not null primary key, -- Linked to Supabase Auth
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
create table if not exists public.courses (
  id text primary key, -- Keeping text id to match existing logic (e.g. 'c1'), or use uuid
  title text not null,
  instructor_name text,
  instructor_id text, -- references users(id) if possible, but keep text for flexibility
  thumbnail text,
  category text,
  description text,
  is_draft boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MODULES TABLE
create table if not exists public.modules (
  id text primary key,
  course_id text references public.courses(id) on delete cascade,
  title text,
  video_url text,
  video_type text, -- 'file' or 'url'
  description text,
  quiz jsonb, -- Storing quiz questions as JSON
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENROLLMENTS TABLE
create table if not exists public.enrollments (
  user_id text references public.users(id) on delete cascade,
  course_id text references public.courses(id) on delete cascade,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()),
  progress integer default 0,
  primary key (user_id, course_id)
);

-- BLOG POSTS TABLE
create table if not exists public.blog_posts (
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
create table if not exists public.access_codes (
  code text primary key,
  role text,
  is_used boolean default false,
  generated_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- MESSAGES TABLE (Already exists, but adding for completeness)
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  content text,
  sender_id text, -- references users(id)
  receiver_id text, -- can be 'all_students', etc.
  file_url text,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  read boolean default false
);

-- RLS POLICIES (Simple version: public access for now, secure later)
alter table public.users enable row level security;
create policy "Public users are viewable by everyone" on public.users for select using (true);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

alter table public.courses enable row level security;
create policy "Courses are viewable by everyone" on public.courses for select using (true);
create policy "Instructors/Admins can insert courses" on public.courses for insert with check (true); -- Simplify for now
create policy "Instructors/Admins can update courses" on public.courses for update using (true);

alter table public.modules enable row level security;
create policy "Modules are viewable by everyone" on public.modules for select using (true);
create policy "Instructors/Admins can insert modules" on public.modules for insert with check (true);
create policy "Instructors/Admins can update modules" on public.modules for update using (true);

alter table public.enrollments enable row level security;
create policy "Enrollments viewable by user" on public.enrollments for select using (auth.uid()::text = user_id);
create policy "Enrollments insertable by user" on public.enrollments for insert with check (auth.uid()::text = user_id);
create policy "Enrollments updatable by user" on public.enrollments for update using (auth.uid()::text = user_id);

alter table public.blog_posts enable row level security;
create policy "Blog posts viewable by everyone" on public.blog_posts for select using (true);
create policy "Editors/Admins can manage blog" on public.blog_posts for all using (true);

alter table public.access_codes enable row level security;
create policy "Access codes viewable by everyone" on public.access_codes for select using (true); -- Needed for validation
