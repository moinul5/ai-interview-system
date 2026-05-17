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
  `status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
  `total_score` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interviews`
--

INSERT INTO `interviews` (`interview_id`, `candidate_id`, `interviewer_id`, `position_id`, `interview_date`, `status`, `total_score`, `created_at`) VALUES
(1, 1, 1, 1, '2026-05-07 22:50:00', 'completed', 85.50, '2026-05-07 16:48:24');

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
  `file_name` varchar(255) NOT NULL,
  `extracted_text` mediumtext DEFAULT NULL,
  `ai_analysis` longtext NOT NULL COMMENT 'JSON from analyzer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resume_analysis`
--

INSERT INTO `resume_analysis` (`analysis_id`, `file_name`, `extracted_text`, `ai_analysis`, `created_at`) VALUES
(10, 'Moinul\'s CV.pdf', 'ACHIEVEMENTS & ACTIVITIES\nJr. Executive, UIU App Forum – Assisted in organizing tech events, app development\nworkshops, and student activities.\nParticipated in university Innovation Competitions with IoT-based safety projects.\nPassionate about teaching, content creation, and EdTech solutions.\nEDUCATION\nRelevant Coursework:\nRelevant Coursework: Data Structures, Algorithms, Web Development, Artificial Intelligence,\nDatabase Systems\nBachelor of Science in Computer Science & Engineering\nUnited International University\n Jan 2023 - Dec 2026\nTECHNICAL SKILLS\nProgramming: Java, Python, C, C++\nWeb Development: HTML, CSS, JavaScript, React\nIoT & Hardware: Raspberry Pi, ESP32, A9G Module\nTools: GitHub, Canva, MS Office\nLanguages: Bangla (native), English (fluent)\nSUMMARY\nEnthusiastic Computer Science student passionate about ICT and Education Technology. Skilled in\ndeveloping digital solutions, class coordination, and creating engaging learning materials. Interested in\napplying technical knowledge and teamwork abilities to support the ICT Olympiad Bangladesh internship\nprogram while gaining practical experience in the EdTech sector.\nMOINUL ISLAM\nAddress: \nPhone:\nEmail:  \nDonia, Dhaka-1236\n+880 1822688827\nmislam2310216@bscse.uiu.ac.bd\nPROJECTS & EXPERIENCE\nSmart Health & Wellness Management System – Web Project\nBuilt a centralized platform to manage diet, fitness, medications, mental health, and emergency\ncontacts using React & Java.\nTransSafe-Bus – IoT Safety Project (Ongoing)\nDeveloping a bus safety system using Raspberry Pi, GPS, SOS button, RFID ticketing, and AI\nvoice detection for emergencies.', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Relevant coursework in Data Structures, Algorithms, Web Development, Artificial Intelligence, and Database Systems\", \"Experience with programming languages such as Java, Python, C, and C++\", \"Proficiency in web development frameworks like React and HTML, CSS, JavaScript\", \"Familiarity with IoT technologies including Raspberry Pi, ESP32, and A9G Module\"], \"Weaknesses\": [\"Lack of direct industry experience beyond academic projects\", \"Insufficient information about specific achievements or accomplishments\", \"Phone number and email address are not formatted correctly for ATS parsing\"], \"Missing Skills\": [\"Cloud platforms (e.g. AWS, Azure)\", \"Database management systems (e.g. MySQL, MongoDB)\", \"Agile development methodologies (e.g. Scrum, Kanban)\", \"Version control systems (e.g. Git, SVN)\", \"Operating Systems (e.g. Windows, Linux)\"], \"Suggestions\": [\"Quantify achievements by including specific numbers and metrics\", \"Emphasize transferable skills gained from academic projects and extracurricular activities\", \"Use keywords from the job description to optimize the resume for ATS filters\"]}', '2026-05-10 00:20:48'),
(24, 'Moinul\'s CV.pdf', 'ACHIEVEMENTS & ACTIVITIES\nJr. Executive, UIU App Forum – Assisted in organizing tech events, app development\nworkshops, and student activities.\nParticipated in university Innovation Competitions with IoT-based safety projects.\nPassionate about teaching, content creation, and EdTech solutions.\nEDUCATION\nRelevant Coursework:\nRelevant Coursework: Data Structures, Algorithms, Web Development, Artificial Intelligence,\nDatabase Systems\nBachelor of Science in Computer Science & Engineering\nUnited International University\n Jan 2023 - Dec 2026\nTECHNICAL SKILLS\nProgramming: Java, Python, C, C++\nWeb Development: HTML, CSS, JavaScript, React\nIoT & Hardware: Raspberry Pi, ESP32, A9G Module\nTools: GitHub, Canva, MS Office\nLanguages: Bangla (native), English (fluent)\nSUMMARY\nEnthusiastic Computer Science student passionate about ICT and Education Technology. Skilled in\ndeveloping digital solutions, class coordination, and creating engaging learning materials. Interested in\napplying technical knowledge and teamwork abilities to support the ICT Olympiad Bangladesh internship\nprogram while gaining practical experience in the EdTech sector.\nMOINUL ISLAM\nAddress: \nPhone:\nEmail:  \nDonia, Dhaka-1236\n+880 1822688827\nmislam2310216@bscse.uiu.ac.bd\nPROJECTS & EXPERIENCE\nSmart Health & Wellness Management System – Web Project\nBuilt a centralized platform to manage diet, fitness, medications, mental health, and emergency\ncontacts using React & Java.\nTransSafe-Bus – IoT Safety Project (Ongoing)\nDeveloping a bus safety system using Raspberry Pi, GPS, SOS button, RFID ticketing, and AI\nvoice detection for emergencies.', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Relevant coursework in Data Structures, Algorithms, Web Development, Artificial Intelligence, and Database Systems\", \"Experience with multiple programming languages (Java, Python, C, C++) and web development frameworks (React)\", \"Familiarity with IoT hardware (Raspberry Pi, ESP32, A9G Module) and tools (GitHub, Canva, MS Office)\", \"Strong language skills (Bangla native, English fluent)\"], \"Weaknesses\": [\"Lack of direct work experience in the EdTech sector\", \"Insufficient information about specific achievements or impact in previous roles\", \"No clear mention of soft skills like communication, teamwork, or problem-solving\"], \"Missing Skills\": [\"Cloud computing platforms (AWS, Azure, Google Cloud)\", \"Machine learning libraries (TensorFlow, PyTorch)\", \"Database management systems (MySQL, MongoDB)\", \"Agile development methodologies (Scrum, Kanban)\", \"Version control systems (Git)\"], \"Suggestions\": [\"Quantify achievements by including specific numbers and metrics in the summary and achievements section\", \"Emphasize soft skills and teamwork experience in the summary and projects section\", \"Consider adding a section for certifications, awards, or publications to enhance credibility\", \"Use action verbs and concise language to describe technical skills and projects\"]}', '2026-05-10 06:46:22'),
(25, 'Aahana_Bobade_Resume.pdf', 'Aahana Bobade \n+91 9833588502 | aahanabobade@gmail.com | https://aahanabobade-portfolio.vercel.app/ \nEDUCATION \nSIES Graduate School of Technology | University of Mumbai \n2021 - 2025 \nBachelor of Engineering in Computer Engineering \nGPA: 9.28 \nMinors: Artificial Intelligence & Machine Learning (AI/ML) \nNew Horizon Public School, Airoli \n2007 – 2021 \nClass 12th \nPercentage: 89.6% \nClass 10th \nPercentage: 91.8% \nSKILLS \n \n \nAI Engineering & GenAI: LangChain, LangGraph, RAG Pipelines, Hugging Face Transformers, NLP \n(spaCy, NLTK), Vector Databases (FAISS, Pinecone), Prompt Engineering, Agentic Workflows \n \nLanguages & Frameworks: Python (Primary), JavaScript, Java, SQL \n \nFrontend Development: HTML, CSS, JavaScript, Responsive UI Design, Figma, UX Prototyping, \nReact, TailwindCSS \n \nML & Data Tools: Pandas, NumPy, Scikit-learn, TensorFlow/Keras, PyTorch, Matplotlib \n \nCloud & DevOps: AWS, Docker, GitHub Actions, Supabase \n \nData & Analytics: SQL (MySQL, PostgreSQL), Tableau, Power BI, Neo4j \nEXPERIENCE \nJunior Software Developer \nMumbai \nEduvanceAI \nAugust 2025 – Present \n \nLed the end-to-end development of an AI-powered Sales Copilot, transforming manual field visit planning into \nan autonomous decision-making system capable of generating optimized 30-day visit schedules using route \noptimization (TSP), dealer intelligence, and contextual product recommendations. \n \nPrototyped and evaluated multiple Generative AI experimentation frameworks, exploring prompt engineering \nstrategies, RAG optimization, agent workflows, and reasoning evaluation to enhance reliability and enterprise \nreadiness of LLM applications. \n \nDeveloped multilingual AI simulation chatbots for a GenAI Learning Management System, enabling role-play \nbased corporate training through adaptive conversations, contextual memory handling, and dynamic scenario \nprogression across multiple languages. \n \n \nUser Experience Designer \nThane \nZepto Digital Labs \nJun 2023 – Aug 2023 \n \nDesigned UI for a simulation platform and improved user experience through design thinking principles.\nBack End Intern \nNavi Mumbai \nLaser Technologies Pvt Ltd \nJun 2023 – Jul 2023 \n \nManaged and maintained backend systems and databases to support enterprise- level web applications.\nPROJECTS \nSafe Yatra – Women’s Safety App. \nNavi Mumbai, MH, India \nDeveloper \nAugust 2024 - April 2025 \n \nDesigned and developed a full-stack mobile application featuring real-time route tracking, intuitive frontend \ninterfaces, and voice-triggered emergency alerts to enhance user safety \n \nIntegrated TensorFlow.js for voice emotion recognition with 70% distress accuracy.\nGita-GPT \nNavi Mumbai, MH, India \nFull Stack Developer \nAugust 2023 - May 2024 \n \nDeveloped a full-stack conversational web application with an interactive frontend interface delivering emotion-based \nBhagavad Gita verse recommendations using empathetic AI.\n \nIntegrated Hume AI for empathetic chatbot support, boosting engagement by 60%', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Strong background in AI Engineering & GenAI with proficiency in LangChain, LangGraph, and Hugging Face Transformers\", \"Experience with full-stack development, including frontend development with React and TailwindCSS\", \"Proficiency in multiple programming languages, including Python, JavaScript, and Java\", \"Familiarity with cloud and DevOps tools, including AWS and Docker\"], \"Weaknesses\": [\"Limited experience in data analysis and business intelligence tools, such as Tableau and Power BI\", \"Lack of experience in cybersecurity and threat detection\", \"Some projects lack clear descriptions of technical challenges and solutions\"], \"Missing Skills\": [\"Cybersecurity and threat detection\", \"Data analysis and business intelligence tools (Tableau, Power BI)\", \"Cloud security and compliance (e.g. AWS IAM, GCP IAM)\", \"Containerization (e.g. Kubernetes, Docker Swarm)\"], \"Suggestions\": [\"Consider adding a summary or objective statement to the resume to highlight career goals and relevant experience\", \"Provide more specific details about technical challenges and solutions in project descriptions\", \"Include relevant certifications or training programs in AI, ML, and cloud computing\"]}', '2026-05-10 06:51:26'),
(26, 'Aahana_Bobade_Resume.pdf', 'Aahana Bobade \n+91 9833588502 | aahanabobade@gmail.com | https://aahanabobade-portfolio.vercel.app/ \nEDUCATION \nSIES Graduate School of Technology | University of Mumbai \n2021 - 2025 \nBachelor of Engineering in Computer Engineering \nGPA: 9.28 \nMinors: Artificial Intelligence & Machine Learning (AI/ML) \nNew Horizon Public School, Airoli \n2007 – 2021 \nClass 12th \nPercentage: 89.6% \nClass 10th \nPercentage: 91.8% \nSKILLS \n \n \nAI Engineering & GenAI: LangChain, LangGraph, RAG Pipelines, Hugging Face Transformers, NLP \n(spaCy, NLTK), Vector Databases (FAISS, Pinecone), Prompt Engineering, Agentic Workflows \n \nLanguages & Frameworks: Python (Primary), JavaScript, Java, SQL \n \nFrontend Development: HTML, CSS, JavaScript, Responsive UI Design, Figma, UX Prototyping, \nReact, TailwindCSS \n \nML & Data Tools: Pandas, NumPy, Scikit-learn, TensorFlow/Keras, PyTorch, Matplotlib \n \nCloud & DevOps: AWS, Docker, GitHub Actions, Supabase \n \nData & Analytics: SQL (MySQL, PostgreSQL), Tableau, Power BI, Neo4j \nEXPERIENCE \nJunior Software Developer \nMumbai \nEduvanceAI \nAugust 2025 – Present \n \nLed the end-to-end development of an AI-powered Sales Copilot, transforming manual field visit planning into \nan autonomous decision-making system capable of generating optimized 30-day visit schedules using route \noptimization (TSP), dealer intelligence, and contextual product recommendations. \n \nPrototyped and evaluated multiple Generative AI experimentation frameworks, exploring prompt engineering \nstrategies, RAG optimization, agent workflows, and reasoning evaluation to enhance reliability and enterprise \nreadiness of LLM applications. \n \nDeveloped multilingual AI simulation chatbots for a GenAI Learning Management System, enabling role-play \nbased corporate training through adaptive conversations, contextual memory handling, and dynamic scenario \nprogression across multiple languages. \n \n \nUser Experience Designer \nThane \nZepto Digital Labs \nJun 2023 – Aug 2023 \n \nDesigned UI for a simulation platform and improved user experience through design thinking principles.\nBack End Intern \nNavi Mumbai \nLaser Technologies Pvt Ltd \nJun 2023 – Jul 2023 \n \nManaged and maintained backend systems and databases to support enterprise- level web applications.\nPROJECTS \nSafe Yatra – Women’s Safety App. \nNavi Mumbai, MH, India \nDeveloper \nAugust 2024 - April 2025 \n \nDesigned and developed a full-stack mobile application featuring real-time route tracking, intuitive frontend \ninterfaces, and voice-triggered emergency alerts to enhance user safety \n \nIntegrated TensorFlow.js for voice emotion recognition with 70% distress accuracy.\nGita-GPT \nNavi Mumbai, MH, India \nFull Stack Developer \nAugust 2023 - May 2024 \n \nDeveloped a full-stack conversational web application with an interactive frontend interface delivering emotion-based \nBhagavad Gita verse recommendations using empathetic AI.\n \nIntegrated Hume AI for empathetic chatbot support, boosting engagement by 60%', '{\"ATS Score\": \"92/100\", \"Strengths\": [\"Strong background in AI Engineering and GenAI with experience in LangChain, LangGraph, and Hugging Face Transformers\", \"Proficiency in multiple programming languages including Python, JavaScript, Java, and SQL\", \"Experience with cloud and DevOps tools such as AWS, Docker, and GitHub Actions\", \"Familiarity with data and analytics tools like Tableau, Power BI, and Neo4j\"], \"Weaknesses\": [\"Limited experience in traditional software development methodologies\", \"Dependence on specific tools and technologies (e.g. LangChain, Hugging Face Transformers)\", \"Lack of experience in large-scale enterprise software development\"], \"Missing Skills\": [\"Cloud security and compliance\", \"Agile project management\", \"Containerization with Kubernetes\", \"Web security and penetration testing\", \"Database design and optimization\"], \"Suggestions\": [\"Consider adding a summary or objective statement to the resume to provide context for the reader\", \"Emphasize transferable skills from previous experiences, such as problem-solving and communication\", \"Highlight achievements and metrics wherever possible, such as \'Improved user engagement by 60%\'\"]}', '2026-05-10 07:11:14');

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
  ADD PRIMARY KEY (`analysis_id`);

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
-- Constraints for table `interview_questions`
--
ALTER TABLE `interview_questions`
  ADD CONSTRAINT `fk_iq_interview` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`interview_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_iq_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
