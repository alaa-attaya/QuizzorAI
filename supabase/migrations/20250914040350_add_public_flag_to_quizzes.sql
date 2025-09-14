-- ==========================
-- Add is_public column to quizzes
-- ==========================
alter table quizzes add column is_public boolean default false;

-- Update RLS policy for SELECT: allow owner OR public quizzes
drop policy if exists "users can manage own quizzes" on quizzes;

create policy "users can manage or see own/public quizzes" on quizzes
  for all
  using (
    (created_by = auth.jwt()->>'sub' and is_deleted = false) 
    or
    (is_public = true)
  )
  with check (
    created_by = auth.jwt()->>'sub' and is_deleted = false
  );
