-- Demo MCQs for aptitude_quiz_questions — run manually once against ai_interview_system.
USE `ai_interview_system`;

INSERT INTO `aptitude_quiz_questions`
  (`question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `marks`)
VALUES
  ('What does REST stand for in web APIs?', 'Remote Execution State Transfer',
   'Representational State Transfer', 'Relational Structured Transfer',
   'Reusable Service Transport', 'B', 1),
  ('Which HTTP method is typically idempotent?', 'PATCH', 'POST',
   'PUT', 'OPTION', 'C', 1),
  ('Primary key guarantees:', 'Duplicates allowed', 'Uniqueness and non-null identification',
   'Only indexes', 'Encrypted values', 'B', 2);
