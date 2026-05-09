-- Extensions for Resume Analysis & Aptitude Quiz (same database: ai_interview_system)
-- Import after restoring ai-system.sql, or run standalone on an existing schema.

CREATE TABLE IF NOT EXISTS `resume_analysis` (
  `analysis_id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `extracted_text` mediumtext DEFAULT NULL,
  `ai_analysis` longtext NOT NULL COMMENT 'JSON from analyzer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `aptitude_quiz_questions` (
  `quiz_question_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_text` text NOT NULL,
  `option_a` varchar(500) NOT NULL,
  `option_b` varchar(500) NOT NULL,
  `option_c` varchar(500) NOT NULL,
  `option_d` varchar(500) NOT NULL,
  `correct_option` enum('A','B','C','D') NOT NULL,
  `marks` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`quiz_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `aptitude_quiz_submissions` (
  `submission_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT 'Optional link to existing users.user_id',
  `score_obtained` int(11) NOT NULL,
  `max_score` int(11) NOT NULL,
  `answers_json` longtext DEFAULT NULL COMMENT 'JSON object: question_id -> selected option',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`submission_id`),
  KEY `fk_quiz_user` (`user_id`),
  CONSTRAINT `fk_quiz_submission_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

