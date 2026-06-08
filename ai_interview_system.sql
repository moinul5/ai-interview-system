-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 12, 2026 at 04:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ai_interview_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_interview_sessions`
-- Used by: AI Interview page (/interview/ai)
-- Source backend: ignore-random-master
--

CREATE TABLE `ai_interview_sessions` (
  `session_id`        VARCHAR(36) NOT NULL COMMENT 'UUID from ignore-random-master backend',
  `user_id`           INT(11) DEFAULT NULL COMMENT 'FK to users.user_id (optional, guest sessions allowed)',
  `desired_role`      VARCHAR(150) NOT NULL,
  `experience_level`  ENUM('junior','mid','senior') NOT NULL DEFAULT 'mid',
  `current_skills`    TEXT DEFAULT NULL COMMENT 'JSON array of current skill strings',
  `target_skills`     TEXT DEFAULT NULL COMMENT 'JSON array of target skill strings',
  `industry`          VARCHAR(100) DEFAULT NULL,
  `interview_focus`   VARCHAR(100) DEFAULT NULL,
  `question_count`    INT(11) NOT NULL DEFAULT 5,
  `questions_json`    LONGTEXT NOT NULL COMMENT 'Full questions array JSON from AI backend',
  `source`            VARCHAR(20) NOT NULL DEFAULT 'fallback' COMMENT 'openai or fallback',
  `created_at`        TIMESTAMP NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_interview_evaluations`
-- Stores the AI evaluation result after answers are submitted
-- Used by: AI Interview page (/interview/ai) — result phase
--

CREATE TABLE `ai_interview_evaluations` (
  `eval_id`           INT(11) NOT NULL,
  `session_id`        VARCHAR(36) NOT NULL COMMENT 'FK to ai_interview_sessions.session_id',
  `score`             INT(11) NOT NULL DEFAULT 0 COMMENT '0-100 score from AI',
  `summary`           TEXT DEFAULT NULL,
  `strengths_json`    TEXT DEFAULT NULL COMMENT 'JSON array of strength strings',
  `gaps_json`         TEXT DEFAULT NULL COMMENT 'JSON array of gap strings',
  `skill_gaps_json`   LONGTEXT DEFAULT NULL COMMENT 'JSON array of {skill, reason, priority}',
  `next_steps_json`   TEXT DEFAULT NULL COMMENT 'JSON array of next step strings',
  `courses_json`      LONGTEXT DEFAULT NULL COMMENT 'JSON array of recommended course objects',
  `source`            VARCHAR(20) NOT NULL DEFAULT 'fallback',
  `created_at`        TIMESTAMP NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_feedback`
--

CREATE TABLE `ai_feedback` (
  `feedback_id` int(11) NOT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `feedback_text` text DEFAULT NULL,
  `confidence_level` decimal(3,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ai_feedback`
--

INSERT INTO `ai_feedback` (`feedback_id`, `answer_id`, `score`, `feedback_text`, `confidence_level`, `created_at`) VALUES
(1, 1, 88.50, 'Good explanation with clear understanding of relational and NoSQL databases.', 0.92, '2026-05-07 16:49:29');

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `answer_id` int(11) NOT NULL,
  `iq_id` int(11) DEFAULT NULL,
  `answer_text` text DEFAULT NULL,
  `audio_path` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`answer_id`, `iq_id`, `answer_text`, `audio_path`, `submitted_at`) VALUES
(1, 1, 'SQL databases use structured relational tables while NoSQL databases use flexible schemas.', 'answer_audio_1.mp3', '2026-05-07 16:49:14');

-- --------------------------------------------------------

--
-- Table structure for table `aptitude_quiz_questions`
--

CREATE TABLE `aptitude_quiz_questions` (
  `quiz_question_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `option_a` varchar(500) NOT NULL,
  `option_b` varchar(500) NOT NULL,
  `option_c` varchar(500) NOT NULL,
  `option_d` varchar(500) NOT NULL,
  `correct_option` enum('A','B','C','D') NOT NULL,
  `marks` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `aptitude_quiz_submissions`
--

CREATE TABLE `aptitude_quiz_submissions` (
  `submission_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'Optional link to existing users.user_id',
  `score_obtained` int(11) NOT NULL,
  `max_score` int(11) NOT NULL,
  `answers_json` longtext DEFAULT NULL COMMENT 'JSON object: question_id -> selected option',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

CREATE TABLE `candidates` (
  `candidate_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `university` varchar(150) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `cgpa` decimal(3,2) DEFAULT NULL,
  `resume_link` varchar(255) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `candidates`
--

INSERT INTO `candidates` (`candidate_id`, `user_id`, `university`, `department`, `cgpa`, `resume_link`, `experience_years`, `phone`, `created_at`) VALUES
(1, 1, 'UIU', 'CSE', 3.75, 'resume_JBK.pdf', 1, '01704760218\r\n ', '2026-05-07 16:44:44');

-- --------------------------------------------------------

--
-- Table structure for table `candidate_skills`
--

CREATE TABLE `candidate_skills` (
  `candidate_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interviewers`
--

CREATE TABLE `interviewers` (
  `interviewer_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company` varchar(150) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `expertise` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interviewers`
--

INSERT INTO `interviewers` (`interviewer_id`, `user_id`, `company`, `designation`, `expertise`, `phone`, `created_at`) VALUES
(1, 2, 'TechNova', 'Senior HR', 'AI, Communication', '01800000000', '2026-05-07 16:47:25');

-- --------------------------------------------------------

--
-- Table structure for table `interviews`
--

CREATE TABLE `interviews` (
  `interview_id` int(11) NOT NULL,
  `candidate_id` int(11) DEFAULT NULL,
  `interviewer_id` int(11) DEFAULT NULL,
  `position_id` int(11) DEFAULT NULL,
  `interview_date` datetime DEFAULT NULL,
  `interview_type` enum('technical','hr','behavioral','final','coding') DEFAULT 'technical',
  `duration_minutes` int(11) DEFAULT 60,
  `meeting_link` varchar(500) DEFAULT NULL,
  `calendar_event_id` varchar(255) DEFAULT NULL,
  `timezone` varchar(100) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `cancelled_reason` text DEFAULT NULL,
  `interview_round` int(11) DEFAULT 1,
  `status` enum('pending','time_selected','waiting_confirmation','confirmed','reschedule_requested','ongoing','completed','cancelled','missed') DEFAULT 'pending',
  `total_score` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interviews`
--

INSERT INTO `interviews` (`interview_id`, `candidate_id`, `interviewer_id`, `position_id`, `interview_date`, `interview_type`, `duration_minutes`, `meeting_link`, `calendar_event_id`, `timezone`, `confirmed_at`, `cancelled_reason`, `interview_round`, `status`, `total_score`, `created_at`) VALUES
(1, 1, 1, 1, '2026-05-07 22:50:00', 'technical', 60, NULL, NULL, 'Asia/Dhaka', NULL, NULL, 1, 'completed', 85.50, '2026-05-07 16:48:24');

-- --------------------------------------------------------

--
-- Table structure for table `interviewer_availability`
--

CREATE TABLE `interviewer_availability` (
  `availability_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `is_booked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interview_schedule_requests`
--

CREATE TABLE `interview_schedule_requests` (
  `request_id` int(11) NOT NULL,
  `interview_id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `requested_start` datetime DEFAULT NULL,
  `requested_end` datetime DEFAULT NULL,
  `status` enum('candidate_selected','accepted','rejected','reschedule') DEFAULT NULL,
  `suggested_by` enum('candidate','interviewer') DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `type` enum('email','in_app','reminder') DEFAULT 'in_app',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interviewer_feedback`
--

CREATE TABLE `interviewer_feedback` (
  `feedback_id` int(11) NOT NULL,
  `interview_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `technical_score` decimal(5,2) DEFAULT NULL,
  `communication_score` decimal(5,2) DEFAULT NULL,
  `problem_solving_score` decimal(5,2) DEFAULT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `recommendation` enum('hire','maybe','reject') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interview_questions`
--

CREATE TABLE `interview_questions` (
  `iq_id` int(11) NOT NULL,
  `interview_id` int(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `question_order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interview_questions`
--

INSERT INTO `interview_questions` (`iq_id`, `interview_id`, `question_id`, `question_order`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `job_positions`
--

CREATE TABLE `job_positions` (
  `position_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `required_experience` int(11) DEFAULT NULL,
  `status` enum('open','closed') DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_positions`
--

INSERT INTO `job_positions` (`position_id`, `title`, `description`, `required_experience`, `status`, `created_at`) VALUES
(1, 'AI Engineer Intern', 'AI based interview system internship position', 1, 'open', '2026-05-07 16:48:05');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `question_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `difficulty` enum('easy','medium','hard') DEFAULT NULL,
  `expected_answer` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`question_id`, `question_text`, `category`, `difficulty`, `expected_answer`, `created_at`) VALUES
(1, 'Explain the difference between SQL and NoSQL databases.', 'DBMS', 'medium', 'SQL uses relational tables while NoSQL uses flexible schema models.', '2026-05-07 16:48:45'),
(2, 'What is normalization in relational databases?', 'DBMS', 'easy', 'Normalization reduces redundancy and improves data consistency.', '2026-05-07 16:48:45');

-- --------------------------------------------------------

--
-- Table structure for table `resume_analysis`
--

CREATE TABLE `resume_analysis` (
  `analysis_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'FK to users.user_id – owner of this analysis',
  `file_name` varchar(255) NOT NULL,
  `extracted_text` mediumtext DEFAULT NULL,
  `ai_analysis` longtext NOT NULL COMMENT 'JSON from analyzer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resume_analysis`
--

INSERT INTO `resume_analysis` (`analysis_id`, `user_id`, `file_name`, `extracted_text`, `ai_analysis`, `created_at`) VALUES
(10, 1, 'Moinul\'s CV.pdf', 'ACHIEVEMENTS & ACTIVITIES\nJr. Executive, UIU App Forum – Assisted in organizing tech events, app development\nworkshops, and student activities.\nParticipated in university Innovation Competitions with IoT-based safety projects.\nPassionate about teaching, content creation, and EdTech solutions.\nEDUCATION\nRelevant Coursework:\nRelevant Coursework: Data Structures, Algorithms, Web Development, Artificial Intelligence,\nDatabase Systems\nBachelor of Science in Computer Science & Engineering\nUnited International University\n Jan 2023 - Dec 2026\nTECHNICAL SKILLS\nProgramming: Java, Python, C, C++\nWeb Development: HTML, CSS, JavaScript, React\nIoT & Hardware: Raspberry Pi, ESP32, A9G Module\nTools: GitHub, Canva, MS Office\nLanguages: Bangla (native), English (fluent)\nSUMMARY\nEnthusiastic Computer Science student passionate about ICT and Education Technology. Skilled in\ndeveloping digital solutions, class coordination, and creating engaging learning materials. Interested in\napplying technical knowledge and teamwork abilities to support the ICT Olympiad Bangladesh internship\nprogram while gaining practical experience in the EdTech sector.\nMOINUL ISLAM\nAddress: \nPhone:\nEmail:  \nDonia, Dhaka-1236\n+880 1822688827\nmislam2310216@bscse.uiu.ac.bd\nPROJECTS & EXPERIENCE\nSmart Health & Wellness Management System – Web Project\nBuilt a centralized platform to manage diet, fitness, medications, mental health, and emergency\ncontacts using React & Java.\nTransSafe-Bus – IoT Safety Project (Ongoing)\nDeveloping a bus safety system using Raspberry Pi, GPS, SOS button, RFID ticketing, and AI\nvoice detection for emergencies.', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Relevant coursework in Data Structures, Algorithms, Web Development, Artificial Intelligence, and Database Systems\", \"Experience with programming languages such as Java, Python, C, and C++\", \"Proficiency in web development frameworks like React and HTML, CSS, JavaScript\", \"Familiarity with IoT technologies including Raspberry Pi, ESP32, and A9G Module\"], \"Weaknesses\": [\"Lack of direct industry experience beyond academic projects\", \"Insufficient information about specific achievements or accomplishments\", \"Phone number and email address are not formatted correctly for ATS parsing\"], \"Missing Skills\": [\"Cloud platforms (e.g. AWS, Azure)\", \"Database management systems (e.g. MySQL, MongoDB)\", \"Agile development methodologies (e.g. Scrum, Kanban)\", \"Version control systems (e.g. Git, SVN)\", \"Operating Systems (e.g. Windows, Linux)\"], \"Suggestions\": [\"Quantify achievements by including specific numbers and metrics\", \"Emphasize transferable skills gained from academic projects and extracurricular activities\", \"Use keywords from the job description to optimize the resume for ATS filters\"]}', '2026-05-10 00:20:48'),
(24, 1, 'Moinul\'s CV.pdf', 'ACHIEVEMENTS & ACTIVITIES\nJr. Executive, UIU App Forum – Assisted in organizing tech events, app development\nworkshops, and student activities.\nParticipated in university Innovation Competitions with IoT-based safety projects.\nPassionate about teaching, content creation, and EdTech solutions.\nEDUCATION\nRelevant Coursework:\nRelevant Coursework: Data Structures, Algorithms, Web Development, Artificial Intelligence,\nDatabase Systems\nBachelor of Science in Computer Science & Engineering\nUnited International University\n Jan 2023 - Dec 2026\nTECHNICAL SKILLS\nProgramming: Java, Python, C, C++\nWeb Development: HTML, CSS, JavaScript, React\nIoT & Hardware: Raspberry Pi, ESP32, A9G Module\nTools: GitHub, Canva, MS Office\nLanguages: Bangla (native), English (fluent)\nSUMMARY\nEnthusiastic Computer Science student passionate about ICT and Education Technology. Skilled in\ndeveloping digital solutions, class coordination, and creating engaging learning materials. Interested in\napplying technical knowledge and teamwork abilities to support the ICT Olympiad Bangladesh internship\nprogram while gaining practical experience in the EdTech sector.\nMOINUL ISLAM\nAddress: \nPhone:\nEmail:  \nDonia, Dhaka-1236\n+880 1822688827\nmislam2310216@bscse.uiu.ac.bd\nPROJECTS & EXPERIENCE\nSmart Health & Wellness Management System – Web Project\nBuilt a centralized platform to manage diet, fitness, medications, mental health, and emergency\ncontacts using React & Java.\nTransSafe-Bus – IoT Safety Project (Ongoing)\nDeveloping a bus safety system using Raspberry Pi, GPS, SOS button, RFID ticketing, and AI\nvoice detection for emergencies.', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Relevant coursework in Data Structures, Algorithms, Web Development, Artificial Intelligence, and Database Systems\", \"Experience with multiple programming languages (Java, Python, C, C++) and web development frameworks (React)\", \"Familiarity with IoT hardware (Raspberry Pi, ESP32, A9G Module) and tools (GitHub, Canva, MS Office)\", \"Strong language skills (Bangla native, English fluent)\"], \"Weaknesses\": [\"Lack of direct work experience in the EdTech sector\", \"Insufficient information about specific achievements or impact in previous roles\", \"No clear mention of soft skills like communication, teamwork, or problem-solving\"], \"Missing Skills\": [\"Cloud computing platforms (AWS, Azure, Google Cloud)\", \"Machine learning libraries (TensorFlow, PyTorch)\", \"Database management systems (MySQL, MongoDB)\", \"Agile development methodologies (Scrum, Kanban)\", \"Version control systems (Git)\"], \"Suggestions\": [\"Quantify achievements by including specific numbers and metrics in the summary and achievements section\", \"Emphasize soft skills and teamwork experience in the summary and projects section\", \"Consider adding a section for certifications, awards, or publications to enhance credibility\", \"Use action verbs and concise language to describe technical skills and projects\"]}', '2026-05-10 06:46:22'),
(25, NULL, 'Aahana_Bobade_Resume.pdf', 'Aahana Bobade \n+91 9833588502 | aahanabobade@gmail.com | https://aahanabobade-portfolio.vercel.app/ \nEDUCATION \nSIES Graduate School of Technology | University of Mumbai \n2021 - 2025 \nBachelor of Engineering in Computer Engineering \nGPA: 9.28 \nMinors: Artificial Intelligence & Machine Learning (AI/ML) \nNew Horizon Public School, Airoli \n2007 – 2021 \nClass 12th \nPercentage: 89.6% \nClass 10th \nPercentage: 91.8% \nSKILLS \n \n \nAI Engineering & GenAI: LangChain, LangGraph, RAG Pipelines, Hugging Face Transformers, NLP \n(spaCy, NLTK), Vector Databases (FAISS, Pinecone), Prompt Engineering, Agentic Workflows \n \nLanguages & Frameworks: Python (Primary), JavaScript, Java, SQL \n \nFrontend Development: HTML, CSS, JavaScript, Responsive UI Design, Figma, UX Prototyping, \nReact, TailwindCSS \n \nML & Data Tools: Pandas, NumPy, Scikit-learn, TensorFlow/Keras, PyTorch, Matplotlib \n \nCloud & DevOps: AWS, Docker, GitHub Actions, Supabase \n \nData & Analytics: SQL (MySQL, PostgreSQL), Tableau, Power BI, Neo4j \nEXPERIENCE \nJunior Software Developer \nMumbai \nEduvanceAI \nAugust 2025 – Present \n \nLed the end-to-end development of an AI-powered Sales Copilot, transforming manual field visit planning into \nan autonomous decision-making system capable of generating optimized 30-day visit schedules using route \noptimization (TSP), dealer intelligence, and contextual product recommendations. \n \nPrototyped and evaluated multiple Generative AI experimentation frameworks, exploring prompt engineering \nstrategies, RAG optimization, agent workflows, and reasoning evaluation to enhance reliability and enterprise \nreadiness of LLM applications. \n \nDeveloped multilingual AI simulation chatbots for a GenAI Learning Management System, enabling role-play \nbased corporate training through adaptive conversations, contextual memory handling, and dynamic scenario \nprogression across multiple languages. \n \n \nUser Experience Designer \nThane \nZepto Digital Labs \nJun 2023 – Aug 2023 \n \nDesigned UI for a simulation platform and improved user experience through design thinking principles.\nBack End Intern \nNavi Mumbai \nLaser Technologies Pvt Ltd \nJun 2023 – Jul 2023 \n \nManaged and maintained backend systems and databases to support enterprise- level web applications.\nPROJECTS \nSafe Yatra – Women’s Safety App. \nNavi Mumbai, MH, India \nDeveloper \nAugust 2024 - April 2025 \n \nDesigned and developed a full-stack mobile application featuring real-time route tracking, intuitive frontend \ninterfaces, and voice-triggered emergency alerts to enhance user safety \n \nIntegrated TensorFlow.js for voice emotion recognition with 70% distress accuracy.\nGita-GPT \nNavi Mumbai, MH, India \nFull Stack Developer \nAugust 2023 - May 2024 \n \nDeveloped a full-stack conversational web application with an interactive frontend interface delivering emotion-based \nBhagavad Gita verse recommendations using empathetic AI.\n \nIntegrated Hume AI for empathetic chatbot support, boosting engagement by 60%', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Strong background in AI Engineering & GenAI with proficiency in LangChain, LangGraph, and Hugging Face Transformers\", \"Experience with full-stack development, including frontend development with React and TailwindCSS\", \"Proficiency in multiple programming languages, including Python, JavaScript, and Java\", \"Familiarity with cloud and DevOps tools, including AWS and Docker\"], \"Weaknesses\": [\"Limited experience in data analysis and business intelligence tools, such as Tableau and Power BI\", \"Lack of experience in cybersecurity and threat detection\", \"Some projects lack clear descriptions of technical challenges and solutions\"], \"Missing Skills\": [\"Cybersecurity and threat detection\", \"Data analysis and business intelligence tools (Tableau, Power BI)\", \"Cloud security and compliance (e.g. AWS IAM, GCP IAM)\", \"Containerization (e.g. Kubernetes, Docker Swarm)\"], \"Suggestions\": [\"Consider adding a summary or objective statement to the resume to highlight career goals and relevant experience\", \"Provide more specific details about technical challenges and solutions in project descriptions\", \"Include relevant certifications or training programs in AI, ML, and cloud computing\"]}', '2026-05-10 06:51:26'),
(26, NULL, 'Aahana_Bobade_Resume.pdf', 'Aahana Bobade \n+91 9833588502 | aahanabobade@gmail.com | https://aahanabobade-portfolio.vercel.app/ \nEDUCATION \nSIES Graduate School of Technology | University of Mumbai \n2021 - 2025 \nBachelor of Engineering in Computer Engineering \nGPA: 9.28 \nMinors: Artificial Intelligence & Machine Learning (AI/ML) \nNew Horizon Public School, Airoli \n2007 – 2021 \nClass 12th \nPercentage: 89.6% \nClass 10th \nPercentage: 91.8% \nSKILLS \n \n \nAI Engineering & GenAI: LangChain, LangGraph, RAG Pipelines, Hugging Face Transformers, NLP \n(spaCy, NLTK), Vector Databases (FAISS, Pinecone), Prompt Engineering, Agentic Workflows \n \nLanguages & Frameworks: Python (Primary), JavaScript, Java, SQL \n \nFrontend Development: HTML, CSS, JavaScript, Responsive UI Design, Figma, UX Prototyping, \nReact, TailwindCSS \n \nML & Data Tools: Pandas, NumPy, Scikit-learn, TensorFlow/Keras, PyTorch, Matplotlib \n \nCloud & DevOps: AWS, Docker, GitHub Actions, Supabase \n \nData & Analytics: SQL (MySQL, PostgreSQL), Tableau, Power BI, Neo4j \nEXPERIENCE \nJunior Software Developer \nMumbai \nEduvanceAI \nAugust 2025 – Present \n \nLed the end-to-end development of an AI-powered Sales Copilot, transforming manual field visit planning into \nan autonomous decision-making system capable of generating optimized 30-day visit schedules using route \noptimization (TSP), dealer intelligence, and contextual product recommendations. \n \nPrototyped and evaluated multiple Generative AI experimentation frameworks, exploring prompt engineering \nstrategies, RAG optimization, agent workflows, and reasoning evaluation to enhance reliability and enterprise \nreadiness of LLM applications. \n \nDeveloped multilingual AI simulation chatbots for a GenAI Learning Management System, enabling role-play \nbased corporate training through adaptive conversations, contextual memory handling, and dynamic scenario \nprogression across multiple languages. \n \n \nUser Experience Designer \nThane \nZepto Digital Labs \nJun 2023 – Aug 2023 \n \nDesigned UI for a simulation platform and improved user experience through design thinking principles.\nBack End Intern \nNavi Mumbai \nLaser Technologies Pvt Ltd \nJun 2023 – Jul 2023 \n \nManaged and maintained backend systems and databases to support enterprise- level web applications.\nPROJECTS \nSafe Yatra – Women’s Safety App. \nNavi Mumbai, MH, India \nDeveloper \nAugust 2024 - April 2025 \n \nDesigned and developed a full-stack mobile application featuring real-time route tracking, intuitive frontend \ninterfaces, and voice-triggered emergency alerts to enhance user safety \n \nIntegrated TensorFlow.js for voice emotion recognition with 70% distress accuracy.\nGita-GPT \nNavi Mumbai, MH, India \nFull Stack Developer \nAugust 2023 - May 2024 \n \nDeveloped a full-stack conversational web application with an interactive frontend interface delivering emotion-based \nBhagavad Gita verse recommendations using empathetic AI.\n \nIntegrated Hume AI for empathetic chatbot support, boosting engagement by 60%', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Strong background in AI Engineering and GenAI with experience in LangChain, LangGraph, and Hugging Face Transformers\", \"Proficiency in multiple programming languages including Python, JavaScript, Java, and SQL\", \"Experience with cloud and DevOps tools such as AWS, Docker, and GitHub Actions\", \"Familiarity with data and analytics tools like Tableau, Power BI, and Neo4j\"], \"Weaknesses\": [\"Limited experience in traditional software development methodologies\", \"Dependence on specific tools and technologies (e.g. LangChain, Hugging Face Transformers)\", \"Lack of experience in large-scale enterprise software development\"], \"Missing Skills\": [\"Cloud security and compliance\", \"Agile project management\", \"Containerization with Kubernetes\", \"Web security and penetration testing\", \"Database design and optimization\"], \"Suggestions\": [\"Consider adding a summary or objective statement to the resume to provide context for the reader\", \"Emphasize transferable skills from previous experiences, such as problem-solving and communication\", \"Highlight achievements and metrics wherever possible, such as \'Improved user engagement by 60%\'\"]}', '2026-05-10 07:11:14');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `skill_id` int(11) NOT NULL,
  `skill_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','candidate','interviewer') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Jbk', 'jbk@gmail.com', '252525', 'candidate', '2026-05-13 03:40:06'),
(2, 'Rahim HR', 'rahim@gmail.com', 'hashed_password_2', 'interviewer', '2026-05-07 16:43:42'),
(3, 'Admin User', 'admin@gmail.com', 'hashed_password_3', 'admin', '2026-05-07 16:43:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_feedback`
--
ALTER TABLE `ai_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD UNIQUE KEY `answer_id` (`answer_id`);

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`answer_id`),
  ADD UNIQUE KEY `iq_id` (`iq_id`);

--
-- Indexes for table `aptitude_quiz_questions`
--
ALTER TABLE `aptitude_quiz_questions`
  ADD PRIMARY KEY (`quiz_question_id`);

--
-- Indexes for table `aptitude_quiz_submissions`
--
ALTER TABLE `aptitude_quiz_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `fk_quiz_user` (`user_id`);

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`candidate_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `candidate_skills`
--
ALTER TABLE `candidate_skills`
  ADD PRIMARY KEY (`candidate_id`,`skill_id`),
  ADD KEY `fk_cs_skill` (`skill_id`);

--
-- Indexes for table `interviewers`
--
ALTER TABLE `interviewers`
  ADD PRIMARY KEY (`interviewer_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `interviews`
--
ALTER TABLE `interviews`
  ADD PRIMARY KEY (`interview_id`),
  ADD KEY `fk_interview_candidate` (`candidate_id`),
  ADD KEY `fk_interview_interviewer` (`interviewer_id`),
  ADD KEY `fk_interview_position` (`position_id`);

--
-- Indexes for table `interviewer_availability`
--
ALTER TABLE `interviewer_availability`
  ADD PRIMARY KEY (`availability_id`),
  ADD KEY `fk_avail_interviewer` (`interviewer_id`);

--
-- Indexes for table `interview_schedule_requests`
--
ALTER TABLE `interview_schedule_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_sr_interview` (`interview_id`),
  ADD KEY `fk_sr_candidate` (`candidate_id`),
  ADD KEY `fk_sr_interviewer` (`interviewer_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notif_user` (`user_id`);

--
-- Indexes for table `interviewer_feedback`
--
ALTER TABLE `interviewer_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `fk_ifb_interview` (`interview_id`),
  ADD KEY `fk_ifb_interviewer` (`interviewer_id`);

--
-- Indexes for table `interview_questions`
--
ALTER TABLE `interview_questions`
  ADD PRIMARY KEY (`iq_id`),
  ADD KEY `fk_iq_interview` (`interview_id`),
  ADD KEY `fk_iq_question` (`question_id`);

--
-- Indexes for table `job_positions`
--
ALTER TABLE `job_positions`
  ADD PRIMARY KEY (`position_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`question_id`);

--
-- Indexes for table `resume_analysis`
--
ALTER TABLE `resume_analysis`
  ADD PRIMARY KEY (`analysis_id`),
  ADD KEY `fk_resume_user` (`user_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`skill_id`),
  ADD UNIQUE KEY `skill_name` (`skill_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ai_feedback`
--
ALTER TABLE `ai_feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `answer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `aptitude_quiz_questions`
--
ALTER TABLE `aptitude_quiz_questions`
  MODIFY `quiz_question_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `aptitude_quiz_submissions`
--
ALTER TABLE `aptitude_quiz_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidates`
--
ALTER TABLE `candidates`
  MODIFY `candidate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviewers`
--
ALTER TABLE `interviewers`
  MODIFY `interviewer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviews`
--
ALTER TABLE `interviews`
  MODIFY `interview_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviewer_availability`
--
ALTER TABLE `interviewer_availability`
  MODIFY `availability_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `interview_schedule_requests`
--
ALTER TABLE `interview_schedule_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `interviewer_feedback`
--
ALTER TABLE `interviewer_feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `interview_questions`
--
ALTER TABLE `interview_questions`
  MODIFY `iq_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `job_positions`
--
ALTER TABLE `job_positions`
  MODIFY `position_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `resume_analysis`
--
ALTER TABLE `resume_analysis`
  MODIFY `analysis_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `skill_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_feedback`
--
ALTER TABLE `ai_feedback`
  ADD CONSTRAINT `fk_feedback_answer` FOREIGN KEY (`answer_id`) REFERENCES `answers` (`answer_id`) ON DELETE CASCADE;

--
-- Constraints for table `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `fk_answer_iq` FOREIGN KEY (`iq_id`) REFERENCES `interview_questions` (`iq_id`) ON DELETE CASCADE;

--
-- Constraints for table `aptitude_quiz_submissions`
--
ALTER TABLE `aptitude_quiz_submissions`
  ADD CONSTRAINT `fk_quiz_submission_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `candidates`
--
ALTER TABLE `candidates`
  ADD CONSTRAINT `fk_candidate_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `candidate_skills`
--
ALTER TABLE `candidate_skills`
  ADD CONSTRAINT `fk_cs_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cs_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE;

--
-- Constraints for table `interviewers`
--
ALTER TABLE `interviewers`
  ADD CONSTRAINT `fk_interviewer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `interviews`
--
ALTER TABLE `interviews`
  ADD CONSTRAINT `fk_interview_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_interview_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`interviewer_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_interview_position` FOREIGN KEY (`position_id`) REFERENCES `job_positions` (`position_id`) ON DELETE SET NULL;

--
-- Constraints for table `interviewer_availability`
--
ALTER TABLE `interviewer_availability`
  ADD CONSTRAINT `fk_avail_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`interviewer_id`) ON DELETE CASCADE;

--
-- Constraints for table `interview_schedule_requests`
--
ALTER TABLE `interview_schedule_requests`
  ADD CONSTRAINT `fk_sr_interview` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`interview_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sr_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sr_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`interviewer_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `interviewer_feedback`
--
ALTER TABLE `interviewer_feedback`
  ADD CONSTRAINT `fk_ifb_interview` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`interview_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ifb_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`interviewer_id`) ON DELETE CASCADE;

--
-- Constraints for table `interview_questions`
--
ALTER TABLE `interview_questions`
  ADD CONSTRAINT `fk_iq_interview` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`interview_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_iq_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `resume_analysis`
--
ALTER TABLE `resume_analysis`
  ADD CONSTRAINT `fk_resume_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Indexes for table `ai_interview_sessions`
--
ALTER TABLE `ai_interview_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `fk_ai_session_user` (`user_id`);

--
-- Indexes for table `ai_interview_evaluations`
--
ALTER TABLE `ai_interview_evaluations`
  ADD PRIMARY KEY (`eval_id`),
  ADD KEY `fk_eval_session` (`session_id`);

--
-- AUTO_INCREMENT for table `ai_interview_evaluations`
--
ALTER TABLE `ai_interview_evaluations`
  MODIFY `eval_id` INT(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for table `ai_interview_sessions`
--
ALTER TABLE `ai_interview_sessions`
  ADD CONSTRAINT `fk_ai_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `ai_interview_evaluations`
--
ALTER TABLE `ai_interview_evaluations`
  ADD CONSTRAINT `fk_eval_session` FOREIGN KEY (`session_id`) REFERENCES `ai_interview_sessions` (`session_id`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Table structure for table `voice_answers`
-- Stores spoken answers from Voice Interview sessions
--

CREATE TABLE `voice_answers` (
  `va_id`         INT(11) NOT NULL,
  `question_id`   INT(11) NOT NULL COMMENT 'FK to questions.question_id',
  `answer_text`   TEXT DEFAULT NULL COMMENT 'Transcript of the spoken answer',
  `audio_path`    VARCHAR(255) DEFAULT NULL COMMENT 'Path to saved audio file',
  `submitted_at`  TIMESTAMP NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voice_ai_feedback`
-- Stores AI evaluation results for voice answers
--

CREATE TABLE `voice_ai_feedback` (
  `vf_id`             INT(11) NOT NULL,
  `va_id`             INT(11) NOT NULL COMMENT 'FK to voice_answers.va_id',
  `score`             DECIMAL(5,2) DEFAULT NULL COMMENT 'Score from 0.00 to 100.00',
  `feedback_text`     TEXT DEFAULT NULL COMMENT 'AI-generated feedback paragraph',
  `improvement`       TEXT DEFAULT NULL COMMENT 'Specific improvement suggestions',
  `confidence_level`  DECIMAL(3,2) DEFAULT NULL COMMENT 'AI confidence 0.00 to 1.00',
  `created_at`        TIMESTAMP NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Seed data for table `questions` — Voice Interview questions
-- 30 questions across 6 categories × 3 difficulties
--

INSERT INTO `questions` (`question_text`, `category`, `difficulty`, `expected_answer`) VALUES
('What is a primary key in a database?', 'DBMS', 'easy',
 'A primary key is a unique identifier for each record in a table. It cannot be NULL and must contain unique values. It ensures entity integrity.'),
('What is the difference between DELETE and TRUNCATE?', 'DBMS', 'easy',
 'DELETE removes rows one by one and can have a WHERE clause. TRUNCATE removes all rows at once, is faster, resets auto-increment, and cannot be rolled back in some databases.'),
('Explain the concept of database indexing and its types.', 'DBMS', 'medium',
 'Indexing improves query performance by creating a data structure for faster lookups. Types include B-tree index, hash index, clustered index, and non-clustered index. Trade-off is extra storage and slower writes.'),
('What are ACID properties in database transactions?', 'DBMS', 'medium',
 'ACID stands for Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don''t interfere), Durability (committed data persists). These ensure reliable transaction processing.'),
('Explain database sharding and when you would use it.', 'DBMS', 'hard',
 'Sharding is horizontal partitioning of data across multiple database instances. Each shard holds a subset of data. Used for massive scale when vertical scaling is insufficient. Challenges include cross-shard queries and rebalancing.'),

('What is the difference between a compiled and an interpreted language?', 'Programming', 'easy',
 'Compiled languages are translated to machine code before execution (C, C++), offering faster runtime. Interpreted languages are executed line by line at runtime (Python, JavaScript), offering more flexibility but slower execution.'),
('Explain what object-oriented programming is.', 'Programming', 'easy',
 'OOP is a paradigm based on objects that contain data and methods. Four pillars: Encapsulation (data hiding), Inheritance (code reuse), Polymorphism (many forms), Abstraction (hiding complexity).'),
('What is the difference between deep copy and shallow copy?', 'Programming', 'medium',
 'Shallow copy creates a new object but references the same nested objects. Deep copy creates a completely independent copy of the object and all nested objects. This matters when dealing with mutable nested data structures.'),
('Explain the concept of closures with an example.', 'Programming', 'medium',
 'A closure is a function that captures and remembers variables from its enclosing scope even after the outer function has returned. Common in JavaScript and Python. Used for data privacy, callbacks, and factory functions.'),
('What is the CAP theorem and how does it apply to distributed systems?', 'Programming', 'hard',
 'CAP theorem states a distributed system can guarantee at most two of: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network failures). You must choose trade-offs.'),

('What is the difference between HTTP and HTTPS?', 'Web Development', 'easy',
 'HTTP transfers data in plain text. HTTPS encrypts data using SSL/TLS, providing security against eavesdropping and man-in-the-middle attacks. HTTPS requires an SSL certificate and uses port 443 instead of 80.'),
('What is the DOM in web development?', 'Web Development', 'easy',
 'The Document Object Model is a tree-structured representation of an HTML document. It allows JavaScript to access and manipulate page content, structure, and styles dynamically. Browsers create the DOM when parsing HTML.'),
('Explain the difference between REST and GraphQL APIs.', 'Web Development', 'medium',
 'REST uses multiple endpoints with fixed data structures and HTTP methods. GraphQL uses a single endpoint where clients specify exactly what data they need. GraphQL reduces over-fetching but adds complexity. REST is simpler and more cacheable.'),
('What is CORS and why is it important?', 'Web Development', 'medium',
 'Cross-Origin Resource Sharing is a security mechanism that restricts web pages from making requests to different domains. Browsers enforce same-origin policy. CORS headers allow servers to specify which origins can access their resources.'),
('Explain how WebSockets work and when to use them over HTTP.', 'Web Development', 'hard',
 'WebSockets provide full-duplex persistent connections between client and server. Unlike HTTP request-response, data flows both ways simultaneously. Used for real-time apps like chat, live feeds, gaming. Reduces overhead of repeated HTTP connections.'),

('What is the difference between an array and a linked list?', 'Data Structures', 'easy',
 'Arrays store elements in contiguous memory with O(1) random access but O(n) insertion/deletion. Linked lists use nodes with pointers, allowing O(1) insertion/deletion but O(n) access. Arrays have fixed size; linked lists are dynamic.'),
('What is a stack and where is it used?', 'Data Structures', 'easy',
 'A stack is a LIFO (Last In, First Out) data structure. Operations: push, pop, peek. Used in function call management, undo operations, expression evaluation, backtracking algorithms, and browser history.'),
('Explain how a hash table works and how collisions are handled.', 'Data Structures', 'medium',
 'A hash table maps keys to values using a hash function that computes an index. Collisions occur when two keys hash to the same index. Handled by chaining (linked lists at each index) or open addressing (probing for next empty slot).'),
('What is a balanced binary search tree and why does it matter?', 'Data Structures', 'medium',
 'A balanced BST maintains height O(log n) by ensuring left and right subtrees differ in height by at most one. Examples: AVL tree, Red-Black tree. Without balancing, BST can degrade to O(n) for operations in worst case.'),
('Explain the Trie data structure and its applications.', 'Data Structures', 'hard',
 'A Trie is a tree-like structure where each node represents a character. Used for efficient prefix-based searching. Applications: autocomplete, spell checkers, IP routing, dictionary implementation. Time complexity O(m) where m is key length.'),

('What is the difference between linear search and binary search?', 'Algorithms', 'easy',
 'Linear search checks each element sequentially with O(n) time complexity. Binary search requires sorted data, repeatedly halving the search space with O(log n) complexity. Binary search is much faster for large sorted datasets.'),
('Explain what a sorting algorithm is and name a few.', 'Algorithms', 'easy',
 'Sorting algorithms arrange elements in a specific order. Common ones: Bubble Sort O(n²), Selection Sort O(n²), Merge Sort O(n log n), Quick Sort O(n log n) average, Insertion Sort O(n²). Choice depends on data size and constraints.'),
('Explain the concept of dynamic programming with an example.', 'Algorithms', 'medium',
 'Dynamic programming solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation. Example: Fibonacci — instead of exponential recursion, store computed values. Approaches: top-down memoization, bottom-up tabulation.'),
('What is the difference between BFS and DFS graph traversal?', 'Algorithms', 'medium',
 'BFS explores level by level using a queue, finding shortest path in unweighted graphs. DFS explores as deep as possible using a stack or recursion, useful for cycle detection and topological sorting. BFS uses more memory; DFS can get stuck in deep branches.'),
('Explain Dijkstra''s algorithm and its limitations.', 'Algorithms', 'hard',
 'Dijkstra''s finds shortest paths from a source to all vertices in a weighted graph. Uses a priority queue, greedily selecting the nearest unvisited vertex. Time: O((V+E) log V). Limitation: doesn''t work with negative edge weights — use Bellman-Ford instead.'),

('What is the difference between a process and a thread?', 'Operating Systems', 'easy',
 'A process is an independent program with its own memory space. A thread is a lightweight unit of execution within a process, sharing the same memory. Threads are faster to create and switch between. Multiple threads can run concurrently within one process.'),
('What is virtual memory and why is it used?', 'Operating Systems', 'easy',
 'Virtual memory extends physical RAM using disk space, giving each process the illusion of a large contiguous address space. Uses paging or segmentation. Allows running programs larger than physical memory and provides process isolation.'),
('Explain the concept of deadlock and its four necessary conditions.', 'Operating Systems', 'medium',
 'Deadlock occurs when processes are blocked forever, each waiting for resources held by others. Four conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Prevention involves breaking at least one condition.'),
('What are the different CPU scheduling algorithms?', 'Operating Systems', 'medium',
 'FCFS (First Come First Served), SJF (Shortest Job First), Round Robin (time slices), Priority Scheduling, Multilevel Queue. Each has trade-offs between throughput, turnaround time, waiting time, and response time. Modern OS use multilevel feedback queues.'),
('Explain the concept of memory-mapped I/O and how it differs from port-mapped I/O.', 'Operating Systems', 'hard',
 'Memory-mapped I/O maps device registers into the CPU address space, allowing regular load/store instructions. Port-mapped I/O uses separate address space with special instructions. Memory-mapped is simpler for programming but uses address space. Used in modern architectures.');

-- --------------------------------------------------------

--
-- Indexes for table `voice_answers`
--
ALTER TABLE `voice_answers`
  ADD PRIMARY KEY (`va_id`),
  ADD KEY `fk_va_question` (`question_id`);

--
-- Indexes for table `voice_ai_feedback`
--
ALTER TABLE `voice_ai_feedback`
  ADD PRIMARY KEY (`vf_id`),
  ADD KEY `fk_vf_va` (`va_id`);

--
-- AUTO_INCREMENT for table `voice_answers`
--
ALTER TABLE `voice_answers`
  MODIFY `va_id` INT(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voice_ai_feedback`
--
ALTER TABLE `voice_ai_feedback`
  MODIFY `vf_id` INT(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for table `voice_answers`
--
ALTER TABLE `voice_answers`
  ADD CONSTRAINT `fk_va_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `voice_ai_feedback`
--
ALTER TABLE `voice_ai_feedback`
  ADD CONSTRAINT `fk_vf_va` FOREIGN KEY (`va_id`) REFERENCES `voice_answers` (`va_id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
