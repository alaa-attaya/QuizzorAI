-- ==========================
-- QuizzorAI Clean Schema + Tags + Flexible Questions + Optimized RLS
-- ==========================

-- Drop existing tables and functions safely
DROP TABLE IF EXISTS user_quizzes CASCADE;
DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS cascade_quiz_delete() CASCADE;
DROP FUNCTION IF EXISTS cascade_question_delete() CASCADE;
DROP FUNCTION IF EXISTS cascade_quiz_public() CASCADE;

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================
-- Quizzes Table
-- ==========================
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::JSONB, -- tags array for categorization
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_quizzes_title ON quizzes(title);
CREATE INDEX idx_quizzes_tags ON quizzes USING GIN (tags);
CREATE INDEX idx_quizzes_public_deleted_created ON quizzes(is_public, is_deleted, created_at);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON quizzes TO authenticated;

CREATE POLICY quizzes_rls_policy ON quizzes
FOR ALL
TO authenticated
USING (
    (is_deleted = FALSE AND (created_by = (SELECT auth.jwt()->>'sub') OR is_public = TRUE))
    OR (is_deleted = TRUE AND created_by = (SELECT auth.jwt()->>'sub'))
)
WITH CHECK (created_by = (SELECT auth.jwt()->>'sub'));

-- ==========================
-- Quiz Questions Table
-- ==========================
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'mcq', -- mcq | input | flashcard
    data JSONB DEFAULT '{}'::JSONB,  -- flexible payload, e.g., for MCQ options or input hints
    explanation TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_questions_quiz_deleted ON quiz_questions(quiz_id, is_deleted);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON quiz_questions TO authenticated;

CREATE POLICY questions_rls_policy ON quiz_questions
FOR ALL
TO authenticated
USING (
    (is_deleted = FALSE AND (created_by = (SELECT auth.jwt()->>'sub') OR is_public = TRUE))
    OR (is_deleted = TRUE AND created_by = (SELECT auth.jwt()->>'sub'))
)
WITH CHECK (created_by = (SELECT auth.jwt()->>'sub'));

-- ==========================
-- Quiz Options Table (for MCQs)
-- ==========================
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_options_question ON quiz_options(question_id);
CREATE INDEX idx_options_question_deleted ON quiz_options(question_id, is_deleted);

ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON quiz_options TO authenticated;

CREATE POLICY options_rls_policy ON quiz_options
FOR ALL
TO authenticated
USING (
    (is_deleted = FALSE AND (created_by = (SELECT auth.jwt()->>'sub') OR is_public = TRUE))
    OR (is_deleted = TRUE AND created_by = (SELECT auth.jwt()->>'sub'))
)
WITH CHECK (created_by = (SELECT auth.jwt()->>'sub'));

-- ==========================
-- User Quizzes Table (Attempts)
-- ==========================
CREATE TABLE user_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score NUMERIC,
    completed_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_user_quizzes_user ON user_quizzes(user_id);
CREATE INDEX idx_user_quizzes_user_deleted ON user_quizzes(user_id, is_deleted);

ALTER TABLE user_quizzes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_quizzes TO authenticated;

CREATE POLICY user_quizzes_rls_policy ON user_quizzes
FOR ALL
TO authenticated
USING (user_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (user_id = (SELECT auth.jwt()->>'sub'));

-- ==========================
-- Triggers: updated_at
-- ==========================
CREATE OR REPLACE FUNCTION set_updated_at()
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

CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_options_updated_at BEFORE UPDATE ON quiz_options FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_quizzes_updated_at BEFORE UPDATE ON user_quizzes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================
-- Cascade Soft-Delete Functions
-- ==========================
CREATE OR REPLACE FUNCTION cascade_quiz_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.is_deleted AND NOT OLD.is_deleted THEN
        UPDATE quiz_questions
        SET is_deleted = TRUE, deleted_at = now()
        WHERE quiz_id = NEW.id AND is_deleted = FALSE;

        UPDATE quiz_options
        SET is_deleted = TRUE, deleted_at = now()
        WHERE question_id IN (
            SELECT id FROM quiz_questions WHERE quiz_id = NEW.id
        ) AND is_deleted = FALSE;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION cascade_question_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.is_deleted AND NOT OLD.is_deleted THEN
        UPDATE quiz_options
        SET is_deleted = TRUE, deleted_at = now()
        WHERE question_id = NEW.id AND is_deleted = FALSE;
    END IF;

    RETURN NEW;
END;
$$;

-- ==========================
-- Wire Cascade Triggers
-- ==========================
-- Soft-delete cascade
CREATE TRIGGER trg_quiz_delete BEFORE UPDATE OF is_deleted ON quizzes FOR EACH ROW EXECUTE FUNCTION cascade_quiz_delete();
CREATE TRIGGER trg_question_delete BEFORE UPDATE OF is_deleted ON quiz_questions FOR EACH ROW EXECUTE FUNCTION cascade_question_delete();

-- ==========================
-- Migration Complete
-- ==========================
