-- ==========================
-- QuizzorAI Unique Constraints per User
-- ==========================

-- Ensure subject names are unique per user
alter table subjects
add constraint unique_subject_per_user
unique (name, created_by);

-- Ensure topic names are unique per subject per user
alter table topics
add constraint unique_topic_per_subject_per_user
unique (subject_id, name, created_by);

-- Ensure quiz titles are unique per topic per user
alter table quizzes
add constraint unique_quiz_per_topic_per_user
unique (topic_id, title, created_by);
