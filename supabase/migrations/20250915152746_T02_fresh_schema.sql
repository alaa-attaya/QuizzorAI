-- ==========================
-- QuizzorAI Full Fresh Schema
-- Optimized + Atomic Soft-delete + Symmetric Public/Private + Indexed + deleted_at + updated_at
-- ==========================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================
-- Tables
-- ==========================

-- Subjects
CREATE TABLE subjects (
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

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
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

-- Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
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

-- Quiz Options
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

-- User Quiz Attempts
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

-- ==========================
-- Indexes
-- ==========================
CREATE INDEX idx_subjects_name ON subjects(name);
CREATE INDEX idx_subjects_public_deleted_created ON subjects(is_public, is_deleted, created_at);

CREATE INDEX idx_topics_subject ON topics(subject_id);
CREATE INDEX idx_topics_name ON topics(name);
CREATE INDEX idx_topics_public_deleted_created ON topics(is_public, is_deleted, created_at);
CREATE INDEX idx_topics_subject_public_deleted ON topics(subject_id, is_public, is_deleted);

CREATE INDEX idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX idx_quizzes_title ON quizzes(title);
CREATE INDEX idx_quizzes_public_deleted_created ON quizzes(is_public, is_deleted, created_at);
CREATE INDEX idx_quizzes_topic_public_deleted ON quizzes(topic_id, is_public, is_deleted);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_questions_quiz_deleted ON quiz_questions(quiz_id, is_deleted);

CREATE INDEX idx_options_question ON quiz_options(question_id);
CREATE INDEX idx_options_question_deleted ON quiz_options(question_id, is_deleted);

CREATE INDEX idx_user_quizzes_user ON user_quizzes(user_id);
CREATE INDEX idx_user_quizzes_user_deleted ON user_quizzes(user_id, is_deleted);

-- ==========================
-- Unique Constraints
-- ==========================
ALTER TABLE subjects ADD CONSTRAINT unique_subject_per_user UNIQUE (name, created_by);
ALTER TABLE topics ADD CONSTRAINT unique_topic_per_subject_per_user UNIQUE (subject_id, name, created_by);
ALTER TABLE quizzes ADD CONSTRAINT unique_quiz_per_topic_per_user UNIQUE (topic_id, title, created_by);

-- ==========================
-- Enable Row-Level Security (RLS)
-- ==========================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quizzes ENABLE ROW LEVEL SECURITY;

-- ==========================
-- RLS Policies
-- ==========================
-- Subjects
CREATE POLICY "users can manage or see public subjects" ON subjects
  FOR ALL
  USING (is_deleted = FALSE AND (created_by = auth.jwt()->>'sub' OR is_public = TRUE))
  WITH CHECK (is_deleted = FALSE AND created_by = auth.jwt()->>'sub');

-- Topics
CREATE POLICY "users can manage or see public topics" ON topics
  FOR ALL
  USING (is_deleted = FALSE AND (created_by = auth.jwt()->>'sub' OR is_public = TRUE))
  WITH CHECK (is_deleted = FALSE AND created_by = auth.jwt()->>'sub');

-- Quizzes
CREATE POLICY "users can manage or see public quizzes" ON quizzes
  FOR ALL
  USING (is_deleted = FALSE AND (created_by = auth.jwt()->>'sub' OR is_public = TRUE))
  WITH CHECK (is_deleted = FALSE AND created_by = auth.jwt()->>'sub');

-- Quiz Questions
CREATE POLICY "users can manage or see public questions" ON quiz_questions
  FOR ALL
  USING (
    is_deleted = FALSE AND (
      created_by = auth.jwt()->>'sub' 
      OR is_public = TRUE
      OR quiz_id IN (SELECT id FROM quizzes WHERE is_public = TRUE AND is_deleted = FALSE)
    )
  )
  WITH CHECK (is_deleted = FALSE AND created_by = auth.jwt()->>'sub');

-- Quiz Options
CREATE POLICY "users can manage or see public options" ON quiz_options
  FOR ALL
  USING (
    is_deleted = FALSE AND (
      created_by = auth.jwt()->>'sub' 
      OR is_public = TRUE
      OR question_id IN (
        SELECT id FROM quiz_questions 
        WHERE quiz_id IN (SELECT id FROM quizzes WHERE is_public = TRUE AND is_deleted = FALSE)
      )
    )
  )
  WITH CHECK (is_deleted = FALSE AND created_by = auth.jwt()->>'sub');

-- User Quiz Attempts
CREATE POLICY "users can see own quiz attempts" ON user_quizzes
  FOR SELECT
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "users can insert own quiz attempts" ON user_quizzes
  FOR INSERT
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "users can update own quiz attempts" ON user_quizzes
  FOR UPDATE
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

-- ==========================
-- Triggers
-- ==========================
-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_options_updated_at BEFORE UPDATE ON quiz_options FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_quizzes_updated_at BEFORE UPDATE ON user_quizzes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================
-- Public/Private Cascade Triggers
-- ==========================
-- Subject → Topics → Quizzes → Questions → Options
CREATE OR REPLACE FUNCTION cascade_subject_public()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE topics SET is_public = NEW.is_public WHERE subject_id = NEW.id;
  UPDATE quizzes SET is_public = NEW.is_public WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id);
  UPDATE quiz_questions SET is_public = NEW.is_public WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id));
  UPDATE quiz_options SET is_public = NEW.is_public WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subject_public AFTER UPDATE OF is_public ON subjects FOR EACH ROW EXECUTE FUNCTION cascade_subject_public();

-- Topic → Quizzes → Questions → Options
CREATE OR REPLACE FUNCTION cascade_topic_public()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quizzes SET is_public = NEW.is_public WHERE topic_id = NEW.id;
  UPDATE quiz_questions SET is_public = NEW.is_public WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id = NEW.id);
  UPDATE quiz_options SET is_public = NEW.is_public WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id = NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_topic_public AFTER UPDATE OF is_public ON topics FOR EACH ROW EXECUTE FUNCTION cascade_topic_public();

-- Quiz → Questions → Options
CREATE OR REPLACE FUNCTION cascade_quiz_public()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quiz_questions SET is_public = NEW.is_public WHERE quiz_id = NEW.id;
  UPDATE quiz_options SET is_public = NEW.is_public WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quiz_public AFTER UPDATE OF is_public ON quizzes FOR EACH ROW EXECUTE FUNCTION cascade_quiz_public();

-- ==========================
-- Atomic Soft-delete Cascade Triggers
-- ==========================
-- Subject → Topics → Quizzes → Questions → Options
CREATE OR REPLACE FUNCTION cascade_subject_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE topics SET is_deleted = TRUE, deleted_at = now() WHERE subject_id = NEW.id;
    UPDATE quizzes SET is_deleted = TRUE, deleted_at = now() WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id);
    UPDATE quiz_questions SET is_deleted = TRUE, deleted_at = now() WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id));
    UPDATE quiz_options SET is_deleted = TRUE, deleted_at = now() WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subject_delete BEFORE UPDATE OF is_deleted ON subjects FOR EACH ROW EXECUTE FUNCTION cascade_subject_delete();

-- Topic → Quizzes → Questions → Options
CREATE OR REPLACE FUNCTION cascade_topic_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE quizzes SET is_deleted = TRUE, deleted_at = now() WHERE topic_id = NEW.id;
    UPDATE quiz_questions SET is_deleted = TRUE, deleted_at = now() WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id = NEW.id);
    UPDATE quiz_options SET is_deleted = TRUE, deleted_at = now() WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id = NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_topic_delete BEFORE UPDATE OF is_deleted ON topics FOR EACH ROW EXECUTE FUNCTION cascade_topic_delete();

-- Quiz → Questions → Options
CREATE OR REPLACE FUNCTION cascade_quiz_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE quiz_questions SET is_deleted = TRUE, deleted_at = now() WHERE quiz_id = NEW.id;
    UPDATE quiz_options SET is_deleted = TRUE, deleted_at = now() WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quiz_delete BEFORE UPDATE OF is_deleted ON quizzes FOR EACH ROW EXECUTE FUNCTION cascade_quiz_delete();

-- Question → Options
CREATE OR REPLACE FUNCTION cascade_question_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted AND NOT OLD.is_deleted THEN
    UPDATE quiz_options SET is_deleted = TRUE, deleted_at = now() WHERE question_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_question_delete BEFORE UPDATE OF is_deleted ON quiz_questions FOR EACH ROW EXECUTE FUNCTION cascade_question_delete();
