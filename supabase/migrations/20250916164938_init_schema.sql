-- ==========================
-- Full migration: schema + RLS + triggers (Clerk -> Supabase integration)
-- ==========================

-- Drop existing objects safely (idempotent)
DROP TABLE IF EXISTS public.quiz_options CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.user_quizzes CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;

DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_subject_public() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_topic_public() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_quiz_public() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_subject_delete() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_topic_delete() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_quiz_delete() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_question_delete() CASCADE;

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================
-- Tables
-- ==========================

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mcq',
  correct_answer TEXT,
  explanation TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.user_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score NUMERIC,
  completed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- ==========================
-- Indexes
-- ==========================
CREATE INDEX idx_subjects_name ON public.subjects(name);
CREATE INDEX idx_subjects_public_deleted_created ON public.subjects(is_public, is_deleted, created_at);

CREATE INDEX idx_topics_subject ON public.topics(subject_id);
CREATE INDEX idx_topics_name ON public.topics(name);
CREATE INDEX idx_topics_public_deleted_created ON public.topics(is_public, is_deleted, created_at);
CREATE INDEX idx_topics_subject_public_deleted ON public.topics(subject_id, is_public, is_deleted);

CREATE INDEX idx_quizzes_topic ON public.quizzes(topic_id);
CREATE INDEX idx_quizzes_title ON public.quizzes(title);
CREATE INDEX idx_quizzes_public_deleted_created ON public.quizzes(is_public, is_deleted, created_at);
CREATE INDEX idx_quizzes_topic_public_deleted ON public.quizzes(topic_id, is_public, is_deleted);

CREATE INDEX idx_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX idx_questions_quiz_deleted ON public.quiz_questions(quiz_id, is_deleted);

CREATE INDEX idx_options_question ON public.quiz_options(question_id);
CREATE INDEX idx_options_question_deleted ON public.quiz_options(question_id, is_deleted);

CREATE INDEX idx_user_quizzes_user ON public.user_quizzes(user_id);
CREATE INDEX idx_user_quizzes_user_deleted ON public.user_quizzes(user_id, is_deleted);

-- ==========================
-- Unique Constraints
-- ==========================
ALTER TABLE public.subjects ADD CONSTRAINT unique_subject_per_user UNIQUE (name, created_by);
ALTER TABLE public.topics ADD CONSTRAINT unique_topic_per_subject_per_user UNIQUE (subject_id, name, created_by);
ALTER TABLE public.quizzes ADD CONSTRAINT unique_quiz_per_topic_per_user UNIQUE (topic_id, title, created_by);

-- ==========================
-- Enable RLS
-- ==========================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quizzes ENABLE ROW LEVEL SECURITY;

-- ==========================
-- Grant basic privileges to authenticated role (required so Supabase accepts third-party JWT as 'authenticated')
-- ==========================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quizzes TO authenticated;

-- ==========================
-- RLS POLICIES
-- - logic: users can manage their own rows (created_by = auth.jwt()->>'sub')
-- - public rows (is_public = TRUE) are visible to authenticated users
-- - soft-delete handled via is_deleted = FALSE checks
-- ==========================

-- Subjects: owner can manage; other authenticated users can see if is_public
CREATE POLICY "users can manage or see public subjects" ON public.subjects
  FOR ALL
  TO authenticated
  USING (
    is_deleted = FALSE
    AND (
      created_by = auth.jwt()->>'sub'
      OR is_public = TRUE
    )
  )
  WITH CHECK (
    is_deleted = FALSE
    AND created_by = auth.jwt()->>'sub'
  );

-- Topics
CREATE POLICY "users can manage or see public topics" ON public.topics
  FOR ALL
  TO authenticated
  USING (
    is_deleted = FALSE
    AND (
      created_by = auth.jwt()->>'sub'
      OR is_public = TRUE
    )
  )
  WITH CHECK (
    is_deleted = FALSE
    AND created_by = auth.jwt()->>'sub'
  );

-- Quizzes
CREATE POLICY "users can manage or see public quizzes" ON public.quizzes
  FOR ALL
  TO authenticated
  USING (
    is_deleted = FALSE
    AND (
      created_by = auth.jwt()->>'sub'
      OR is_public = TRUE
    )
  )
  WITH CHECK (
    is_deleted = FALSE
    AND created_by = auth.jwt()->>'sub'
  );

-- Quiz Questions (allow questions if the quiz is public as well)
CREATE POLICY "users can manage or see public questions" ON public.quiz_questions
  FOR ALL
  TO authenticated
  USING (
    is_deleted = FALSE
    AND (
      created_by = auth.jwt()->>'sub'
      OR is_public = TRUE
      OR quiz_id IN (
        SELECT id FROM public.quizzes WHERE is_public = TRUE AND is_deleted = FALSE
      )
    )
  )
  WITH CHECK (
    is_deleted = FALSE
    AND created_by = auth.jwt()->>'sub'
  );

-- Quiz Options (allow options if the question/quiz is public)
CREATE POLICY "users can manage or see public options" ON public.quiz_options
  FOR ALL
  TO authenticated
  USING (
    is_deleted = FALSE
    AND (
      created_by = auth.jwt()->>'sub'
      OR is_public = TRUE
      OR question_id IN (
        SELECT id FROM public.quiz_questions WHERE quiz_id IN (
          SELECT id FROM public.quizzes WHERE is_public = TRUE AND is_deleted = FALSE
        )
      )
    )
  )
  WITH CHECK (
    is_deleted = FALSE
    AND created_by = auth.jwt()->>'sub'
  );

-- User Quiz Attempts: allow users to see & insert their own attempts; update if own
CREATE POLICY "users can see own quiz attempts" ON public.user_quizzes
  FOR SELECT
  TO authenticated
  USING ( user_id = auth.jwt()->>'sub' );

CREATE POLICY "users can insert own quiz attempts" ON public.user_quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK ( user_id = auth.jwt()->>'sub' );

CREATE POLICY "users can update own quiz attempts" ON public.user_quizzes
  FOR UPDATE
  TO authenticated
  USING ( user_id = auth.jwt()->>'sub' )
  WITH CHECK ( user_id = auth.jwt()->>'sub' );

-- ==========================
-- Trigger functions with secure search_path set (fix linter warnings)
-- ==========================

-- updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- cascade_subject_public
CREATE OR REPLACE FUNCTION public.cascade_subject_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.topics
    SET is_public = NEW.is_public
    WHERE subject_id = NEW.id
      AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE public.quizzes
    SET is_public = NEW.is_public
    WHERE topic_id IN (SELECT id FROM public.topics WHERE subject_id = NEW.id)
      AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE public.quiz_questions
    SET is_public = NEW.is_public
    WHERE quiz_id IN (
      SELECT id FROM public.quizzes WHERE topic_id IN (
        SELECT id FROM public.topics WHERE subject_id = NEW.id
      )
    )
    AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE public.quiz_options
    SET is_public = NEW.is_public
    WHERE question_id IN (
      SELECT id FROM public.quiz_questions WHERE quiz_id IN (
        SELECT id FROM public.quizzes WHERE topic_id IN (
          SELECT id FROM public.topics WHERE subject_id = NEW.id
        )
      )
    )
    AND is_public IS DISTINCT FROM NEW.is_public;

  RETURN NEW;
END;
$$;

-- cascade_topic_public
CREATE OR REPLACE FUNCTION public.cascade_topic_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quizzes
    SET is_public = NEW.is_public
    WHERE topic_id = NEW.id
      AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE public.quiz_questions
    SET is_public = NEW.is_public
    WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE topic_id = NEW.id)
      AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE public.quiz_options
    SET is_public = NEW.is_public
    WHERE question_id IN (
      SELECT id FROM public.quiz_questions WHERE quiz_id IN (
        SELECT id FROM public.quizzes WHERE topic_id = NEW.id
      )
    )
    AND is_public IS DISTINCT FROM NEW.is_public;

  RETURN NEW;
END;
$$;

-- cascade_quiz_public
CREATE OR REPLACE FUNCTION public.cascade_quiz_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quiz_questions
    SET is_public = NEW.is_public
    WHERE quiz_id = NEW.id
      AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE public.quiz_options
    SET is_public = NEW.is_public
    WHERE question_id IN (
      SELECT id FROM public.quiz_questions WHERE quiz_id = NEW.id
    )
    AND is_public IS DISTINCT FROM NEW.is_public;

  RETURN NEW;
END;
$$;

-- cascade_subject_delete (soft-delete cascade)
CREATE OR REPLACE FUNCTION public.cascade_subject_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE public.topics
      SET is_deleted = TRUE, deleted_at = now()
      WHERE subject_id = NEW.id AND is_deleted = FALSE;

    UPDATE public.quizzes
      SET is_deleted = TRUE, deleted_at = now()
      WHERE topic_id IN (SELECT id FROM public.topics WHERE subject_id = NEW.id)
        AND is_deleted = FALSE;

    UPDATE public.quiz_questions
      SET is_deleted = TRUE, deleted_at = now()
      WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE topic_id IN (SELECT id FROM public.topics WHERE subject_id = NEW.id))
        AND is_deleted = FALSE;

    UPDATE public.quiz_options
      SET is_deleted = TRUE, deleted_at = now()
      WHERE question_id IN (SELECT id FROM public.quiz_questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE topic_id IN (SELECT id FROM public.topics WHERE subject_id = NEW.id)))
        AND is_deleted = FALSE;
  END IF;
  RETURN NEW;
END;
$$;

-- cascade_topic_delete
CREATE OR REPLACE FUNCTION public.cascade_topic_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE public.quizzes
      SET is_deleted = TRUE, deleted_at = now()
      WHERE topic_id = NEW.id AND is_deleted = FALSE;

    UPDATE public.quiz_questions
      SET is_deleted = TRUE, deleted_at = now()
      WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE topic_id = NEW.id)
        AND is_deleted = FALSE;

    UPDATE public.quiz_options
      SET is_deleted = TRUE, deleted_at = now()
      WHERE question_id IN (SELECT id FROM public.quiz_questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE topic_id = NEW.id))
        AND is_deleted = FALSE;
  END IF;
  RETURN NEW;
END;
$$;

-- cascade_quiz_delete
CREATE OR REPLACE FUNCTION public.cascade_quiz_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE public.quiz_questions
      SET is_deleted = TRUE, deleted_at = now()
      WHERE quiz_id = NEW.id AND is_deleted = FALSE;

    UPDATE public.quiz_options
      SET is_deleted = TRUE, deleted_at = now()
      WHERE question_id IN (SELECT id FROM public.quiz_questions WHERE quiz_id = NEW.id)
        AND is_deleted = FALSE;
  END IF;
  RETURN NEW;
END;
$$;

-- cascade_question_delete
CREATE OR REPLACE FUNCTION public.cascade_question_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE public.quiz_options
      SET is_deleted = TRUE, deleted_at = now()
      WHERE question_id = NEW.id AND is_deleted = FALSE;
  END IF;
  RETURN NEW;
END;
$$;

-- ==========================
-- Triggers wiring
-- ==========================
CREATE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_options_updated_at BEFORE UPDATE ON public.quiz_options FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_user_quizzes_updated_at BEFORE UPDATE ON public.user_quizzes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subject_public AFTER UPDATE OF is_public ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.cascade_subject_public();
CREATE TRIGGER trg_topic_public AFTER UPDATE OF is_public ON public.topics FOR EACH ROW EXECUTE FUNCTION public.cascade_topic_public();
CREATE TRIGGER trg_quiz_public AFTER UPDATE OF is_public ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.cascade_quiz_public();

CREATE TRIGGER trg_subject_delete BEFORE UPDATE OF is_deleted ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.cascade_subject_delete();
CREATE TRIGGER trg_topic_delete BEFORE UPDATE OF is_deleted ON public.topics FOR EACH ROW EXECUTE FUNCTION public.cascade_topic_delete();
CREATE TRIGGER trg_quiz_delete BEFORE UPDATE OF is_deleted ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.cascade_quiz_delete();
CREATE TRIGGER trg_question_delete BEFORE UPDATE OF is_deleted ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.cascade_question_delete();

