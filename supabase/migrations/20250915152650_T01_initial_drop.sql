-- Drop all existing tables in reverse dependency order
drop table if exists user_quizzes cascade;
drop table if exists quiz_options cascade;
drop table if exists quiz_questions cascade;
drop table if exists quizzes cascade;
drop table if exists topics cascade;
drop table if exists subjects cascade;
