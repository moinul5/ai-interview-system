-- ============================================================
-- Video Interview Analysis — Migration Script
-- Run this in phpMyAdmin or MySQL CLI against ai_interview_system DB
-- Requires: ai_interview_sessions and users tables already exist
-- ============================================================

CREATE TABLE IF NOT EXISTS `video_interview_analysis` (
  `analysis_id`                   INT AUTO_INCREMENT PRIMARY KEY,

  -- Foreign Keys
  `session_id`                    VARCHAR(36) NOT NULL COMMENT 'FK → ai_interview_sessions.session_id',
  `user_id`                       INT NOT NULL COMMENT 'FK → users.user_id (candidate only)',

  -- Video Analysis Metrics (MediaPipe, browser-side)
  `eye_contact_score`             DECIMAL(5,2) DEFAULT 0 COMMENT '% of frames with forward gaze, 0-100',
  `face_visibility_score`         DECIMAL(5,2) DEFAULT 0 COMMENT '% of frames a face was detected, 0-100',
  `head_stability_score`          DECIMAL(5,2) DEFAULT 0 COMMENT 'Stability score derived from nose landmark variance, 0-100',

  -- Speech Analysis Metrics
  `speech_clarity_score`          DECIMAL(5,2) DEFAULT 0 COMMENT 'Derived from filler words and WPM, 0-100',
  `communication_score`           DECIMAL(5,2) DEFAULT 0 COMMENT 'Composite speech quality score, 0-100',
  `filler_words_count`            INT DEFAULT 0 COMMENT 'Total count of filler words (um, uh, like, basically, actually)',
  `words_per_minute`              INT DEFAULT 0 COMMENT 'Calculated from transcript word count and interview duration',

  -- Overall Scores
  `confidence_score`              DECIMAL(5,2) DEFAULT 0 COMMENT 'Weighted composite: eye_contact×0.30 + head_stability×0.20 + face_visibility×0.15 + speech_clarity×0.20 + filler_score×0.15',
  `overall_video_score`           DECIMAL(5,2) DEFAULT 0 COMMENT 'Final AI-adjusted overall score, 0-100',

  -- Transcript
  `transcript`                    LONGTEXT COMMENT 'Full combined transcript from all question answers',

  -- AI-Generated Feedback (JSON arrays as TEXT)
  `strengths_json`                LONGTEXT COMMENT 'JSON array of strength strings from Groq AI',
  `weaknesses_json`               LONGTEXT COMMENT 'JSON array of weakness strings from Groq AI',
  `improvement_suggestions_json`  LONGTEXT COMMENT 'JSON array of improvement suggestion strings from Groq AI',
  `summary`                      LONGTEXT COMMENT 'Overall coaching and answer content summary',
  `answer_evaluations_json`      LONGTEXT COMMENT 'JSON array of individual question-answer evaluations',

  -- Transparency
  `transparency_score`            DECIMAL(5,2) DEFAULT 0 COMMENT 'Honesty/confidence transparency metric, 0-100',
  `analysis_source`               ENUM('mediapipe','ai','hybrid') DEFAULT 'hybrid' COMMENT 'Source of the analysis data',

  -- Timestamps
  `created_at`                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT `fk_video_analysis_session`
    FOREIGN KEY (`session_id`)
    REFERENCES `ai_interview_sessions`(`session_id`)
    ON DELETE CASCADE,

  CONSTRAINT `fk_video_analysis_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`user_id`)
    ON DELETE CASCADE,

  -- Indexes
  INDEX `idx_video_session` (`session_id`),
  INDEX `idx_video_user`    (`user_id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Video interview metrics, transcript, and AI feedback per session';
