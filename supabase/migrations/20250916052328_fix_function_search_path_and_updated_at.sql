-- ==========================
-- QuizzorAI Optimized Cascade + Search Path Fix
-- ==========================

-- Subjects -> Topics/Quizzes/Questions/Options PUBLIC cascade
CREATE OR REPLACE FUNCTION public.cascade_subject_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE topics 
  SET is_public = NEW.is_public 
  WHERE subject_id = NEW.id 
    AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE quizzes 
  SET is_public = NEW.is_public 
  WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id)
    AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE quiz_questions 
  SET is_public = NEW.is_public 
  WHERE quiz_id IN (
    SELECT id FROM quizzes WHERE topic_id IN (
      SELECT id FROM topics WHERE subject_id = NEW.id
    )
  ) AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE quiz_options 
  SET is_public = NEW.is_public 
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id IN (
      SELECT id FROM quizzes WHERE topic_id IN (
        SELECT id FROM topics WHERE subject_id = NEW.id
      )
    )
  ) AND is_public IS DISTINCT FROM NEW.is_public;

  RETURN NEW;
END;
$$;


-- Topics -> Quizzes/Questions/Options PUBLIC cascade
CREATE OR REPLACE FUNCTION public.cascade_topic_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE quizzes 
  SET is_public = NEW.is_public 
  WHERE topic_id = NEW.id 
    AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE quiz_questions 
  SET is_public = NEW.is_public 
  WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id = NEW.id)
    AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE quiz_options 
  SET is_public = NEW.is_public 
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id IN (
      SELECT id FROM quizzes WHERE topic_id = NEW.id
    )
  ) AND is_public IS DISTINCT FROM NEW.is_public;

  RETURN NEW;
END;
$$;


-- Quizzes -> Questions/Options PUBLIC cascade
CREATE OR REPLACE FUNCTION public.cascade_quiz_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE quiz_questions 
  SET is_public = NEW.is_public 
  WHERE quiz_id = NEW.id 
    AND is_public IS DISTINCT FROM NEW.is_public;

  UPDATE quiz_options 
  SET is_public = NEW.is_public 
  WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = NEW.id)
    AND is_public IS DISTINCT FROM NEW.is_public;

  RETURN NEW;
END;
$$;


-- Subjects soft-delete cascade
CREATE OR REPLACE FUNCTION public.cascade_subject_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE topics 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE subject_id = NEW.id AND is_deleted = FALSE;

  UPDATE quizzes 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE topic_id IN (SELECT id FROM topics WHERE subject_id = NEW.id) 
    AND is_deleted = FALSE;

  UPDATE quiz_questions 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE quiz_id IN (
    SELECT id FROM quizzes WHERE topic_id IN (
      SELECT id FROM topics WHERE subject_id = NEW.id
    )
  ) AND is_deleted = FALSE;

  UPDATE quiz_options 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id IN (
      SELECT id FROM quizzes WHERE topic_id IN (
        SELECT id FROM topics WHERE subject_id = NEW.id
      )
    )
  ) AND is_deleted = FALSE;

  RETURN NEW;
END;
$$;


-- Topics soft-delete cascade
CREATE OR REPLACE FUNCTION public.cascade_topic_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE quizzes 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE topic_id = NEW.id AND is_deleted = FALSE;

  UPDATE quiz_questions 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE quiz_id IN (SELECT id FROM quizzes WHERE topic_id = NEW.id)
    AND is_deleted = FALSE;

  UPDATE quiz_options 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id IN (
      SELECT id FROM quizzes WHERE topic_id = NEW.id
    )
  ) AND is_deleted = FALSE;

  RETURN NEW;
END;
$$;


-- Quizzes soft-delete cascade
CREATE OR REPLACE FUNCTION public.cascade_quiz_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE quiz_questions 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE quiz_id = NEW.id AND is_deleted = FALSE;

  UPDATE quiz_options 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = NEW.id)
    AND is_deleted = FALSE;

  RETURN NEW;
END;
$$;


-- Questions soft-delete cascade
CREATE OR REPLACE FUNCTION public.cascade_question_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE quiz_options 
  SET is_deleted = TRUE, deleted_at = now()
  WHERE question_id = NEW.id AND is_deleted = FALSE;

  RETURN NEW;
END;
$$;
