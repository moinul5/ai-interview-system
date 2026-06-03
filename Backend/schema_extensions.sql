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


-- AI Interview feature tables
-- Run this if your database was created before the AI Interview feature was added.

CREATE TABLE IF NOT EXISTS `ai_interview_sessions` (
  `session_id`        VARCHAR(36) NOT NULL,
  `user_id`           INT(11) DEFAULT NULL,
  `desired_role`      VARCHAR(150) NOT NULL,
  `experience_level`  ENUM('junior','mid','senior') NOT NULL DEFAULT 'mid',
  `current_skills`    TEXT DEFAULT NULL,
  `target_skills`     TEXT DEFAULT NULL,
  `industry`          VARCHAR(100) DEFAULT NULL,
  `interview_focus`   VARCHAR(100) DEFAULT NULL,
  `question_count`    INT(11) NOT NULL DEFAULT 5,
  `questions_json`    LONGTEXT NOT NULL,
  `source`            VARCHAR(20) NOT NULL DEFAULT 'fallback',
  `created_at`        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`session_id`),
  KEY `fk_ai_session_user` (`user_id`),
  CONSTRAINT `fk_ai_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `ai_interview_evaluations` (
  `eval_id`           INT(11) NOT NULL AUTO_INCREMENT,
  `session_id`        VARCHAR(36) NOT NULL,
  `score`             INT(11) NOT NULL DEFAULT 0,
  `summary`           TEXT DEFAULT NULL,
  `strengths_json`    TEXT DEFAULT NULL,
  `gaps_json`         TEXT DEFAULT NULL,
  `skill_gaps_json`   LONGTEXT DEFAULT NULL,
  `next_steps_json`   TEXT DEFAULT NULL,
  `courses_json`      LONGTEXT DEFAULT NULL,
  `source`            VARCHAR(20) NOT NULL DEFAULT 'fallback',
  `created_at`        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`eval_id`),
  KEY `fk_eval_session` (`session_id`),
  CONSTRAINT `fk_eval_session` FOREIGN KEY (`session_id`) REFERENCES `ai_interview_sessions` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Voice Interview feature tables
-- Separate from the existing `answers` table which requires FK to `interview_questions`.

CREATE TABLE IF NOT EXISTS `voice_answers` (
  `va_id`         INT(11) NOT NULL AUTO_INCREMENT,
  `question_id`   INT(11) NOT NULL COMMENT 'FK to questions.question_id',
  `answer_text`   TEXT DEFAULT NULL COMMENT 'Transcript of the spoken answer',
  `audio_path`    VARCHAR(255) DEFAULT NULL COMMENT 'Path to saved audio file',
  `submitted_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`va_id`),
  KEY `fk_va_question` (`question_id`),
  CONSTRAINT `fk_va_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `voice_ai_feedback` (
  `vf_id`             INT(11) NOT NULL AUTO_INCREMENT,
  `va_id`             INT(11) NOT NULL COMMENT 'FK to voice_answers.va_id',
  `score`             DECIMAL(5,2) DEFAULT NULL COMMENT 'Score from 0.00 to 100.00',
  `feedback_text`     TEXT DEFAULT NULL COMMENT 'AI-generated feedback paragraph',
  `improvement`       TEXT DEFAULT NULL COMMENT 'Specific improvement suggestions',
  `confidence_level`  DECIMAL(3,2) DEFAULT NULL COMMENT 'AI confidence 0.00 to 1.00',
  `created_at`        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`vf_id`),
  KEY `fk_vf_va` (`va_id`),
  CONSTRAINT `fk_vf_va` FOREIGN KEY (`va_id`) REFERENCES `voice_answers` (`va_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
