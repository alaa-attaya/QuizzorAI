-- ==========================
-- QuizzorAI Initial Schema with Soft Deletes and Clerk RLS
-- ==========================

-- Subjects
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by text not null default auth.jwt()->>'sub', -- auto from Clerk session
  created_at timestamptz default now(),
  is_deleted boolean default false
);

-- Topics
create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  name text not null,
  description text,
  created_by text not null default auth.jwt()->>'sub',
  created_at timestamptz default now(),
  is_deleted boolean default false
);

-- Quizzes
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  title text not null,
  description text,
  is_ai_generated boolean default false,
  created_by text not null default auth.jwt()->>'sub',
  created_at timestamptz default now(),
  is_deleted boolean default false
);

-- Quiz Questions
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question text not null,
  type text not null default 'mcq', -- 'mcq', 'flashcard', 'input'
  correct_answer text,
  explanation text,
  created_by text not null default auth.jwt()->>'sub',
  created_at timestamptz default now(),
  is_deleted boolean default false
);

-- Quiz Options
create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false,
  created_by text not null default auth.jwt()->>'sub',
  created_at timestamptz default now(),
  is_deleted boolean default false
);

-- User Quiz Attempts
create table user_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.jwt()->>'sub', -- auto from Clerk
  quiz_id uuid references quizzes(id) on delete cascade,
  score numeric,
  completed_at timestamptz default now()
);

-- ==========================
-- Indexes
-- ==========================
create index idx_topics_subject on topics(subject_id);
create index idx_quizzes_topic on quizzes(topic_id);
create index idx_questions_quiz on quiz_questions(quiz_id);
create index idx_options_question on quiz_options(question_id);
create index idx_user_quizzes_user on user_quizzes(user_id);

-- ==========================
-- RLS Policies
-- ==========================

alter table subjects enable row level security;
alter table topics enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table user_quizzes enable row level security;

-- Users can manage own subjects
create policy "users can manage own subjects" on subjects
  for all
  using (created_by = auth.jwt()->>'sub' and is_deleted = false);

-- Users can manage own topics
create policy "users can manage own topics" on topics
  for all
  using (created_by = auth.jwt()->>'sub' and is_deleted = false);

-- Users can manage own quizzes
create policy "users can manage own quizzes" on quizzes
  for all
  using (created_by = auth.jwt()->>'sub' and is_deleted = false);

-- Users can manage own questions
create policy "users can manage own questions" on quiz_questions
  for all
  using (created_by = auth.jwt()->>'sub' and is_deleted = false);

-- Users can manage own options
create policy "users can manage own options" on quiz_options
  for all
  using (created_by = auth.jwt()->>'sub' and is_deleted = false);

-- Users can see own quiz attempts
create policy "users can see own quiz attempts" on user_quizzes
  for select
  using (user_id = auth.jwt()->>'sub');

-- Users can insert own quiz attempts
create policy "users can insert own quiz attempts" on user_quizzes
  for insert
  with check (user_id = auth.jwt()->>'sub');