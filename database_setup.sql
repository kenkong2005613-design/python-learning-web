-- ============================================
-- Control Flow Learning Game - Database Setup
-- Run this in MySQL Workbench
-- ============================================

-- 1. Create database
CREATE DATABASE IF NOT EXISTS fwdd_game;
USE fwdd_game;

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    room_code CHAR(6) NOT NULL UNIQUE,
    host_user_id INT NOT NULL,
    status ENUM('waiting', 'active', 'finished') DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    FOREIGN KEY (host_user_id) REFERENCES users(user_id)
);

-- 4. Session players table
CREATE TABLE IF NOT EXISTS session_players (
    session_player_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    token_colour VARCHAR(20) NOT NULL,
    turn_order TINYINT NOT NULL,
    board_position TINYINT DEFAULT 0,
    total_score INT DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 5. Questions table
CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    concept_type ENUM('if-elif-else', 'for', 'while') NOT NULL,
    question_text VARCHAR(255) NOT NULL,
    code_snippet TEXT NULL,
    answer_mode ENUM('mcq', 'typed') NOT NULL,
    correct_answer VARCHAR(100) NULL,
    points TINYINT DEFAULT 10,
    explanation TEXT NOT NULL
);

-- 6. Answer options table
CREATE TABLE IF NOT EXISTS answer_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_label CHAR(1) NOT NULL,
    option_text VARCHAR(150) NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);

-- 7. Player answers table
CREATE TABLE IF NOT EXISTS player_answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,
    session_player_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    typed_answer VARCHAR(100) NULL,
    is_correct BOOLEAN NOT NULL,
    points_awarded INT DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_player_id) REFERENCES session_players(session_player_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id),
    FOREIGN KEY (selected_option_id) REFERENCES answer_options(option_id)
);

-- 8. Insert sample questions
INSERT INTO questions (concept_type, question_text, code_snippet, answer_mode, correct_answer, points, explanation) VALUES
('if-elif-else', 'What is the output of this code?', 'x = 10\nif x > 5:\n    print("A")\nelse:\n    print("B")', 'mcq', 'A', 10, 'Since x = 10 is greater than 5, the if condition is True, so it prints A.'),
('if-elif-else', 'What is the output of this code?', 'score = 75\nif score >= 90:\n    print("A")\nelif score >= 60:\n    print("B")\nelse:\n    print("C")', 'mcq', 'B', 10, 'score = 75. It is not >= 90, but it IS >= 60, so the elif runs and prints B.'),
('if-elif-else', 'What is the output of this code?', 'a = 5\nb = 10\nif a > b:\n    print("a is bigger")\nelif a < b:\n    print("b is bigger")\nelse:\n    print("equal")', 'mcq', 'B', 10, 'a = 5, b = 10. a < b is True, so it prints b is bigger.'),
('for', 'How many times does this loop run?', 'for i in range(5):\n    print(i)', 'mcq', 'B', 10, 'range(5) gives 0, 1, 2, 3, 4 - that is 5 values, so the loop runs 5 times.'),
('for', 'What is the last number printed?', 'for i in range(1, 10, 2):\n    print(i)', 'mcq', 'B', 10, 'range(1, 10, 2) gives 1, 3, 5, 7, 9. The last one is 9.'),
('for', 'What does this code print?', 'total = 0\nfor num in [1, 2, 3, 4]:\n    total = total + num\nprint(total)', 'mcq', 'B', 10, 'It sums 1 + 2 + 3 + 4 = 10.'),
('while', 'How many times does this loop print?', 'count = 0\nwhile count < 3:\n    print(count)\n    count = count + 1', 'mcq', 'B', 10, 'count starts at 0. It runs while count < 3: prints 0, 1, 2 - then count becomes 3 and stops. That is 3 times.'),
('while', 'What is wrong with this code?', 'x = 10\nwhile x > 0:\n    print(x)', 'mcq', 'B', 10, 'x is never changed inside the loop, so x > 0 is always True - it is an infinite loop.'),
('while', 'What is the output?', 'n = 5\nwhile n > 0:\n    n = n - 1\nprint(n)', 'mcq', 'C', 10, 'n starts at 5. Each loop subtracts 1. When n becomes 0, the condition n > 0 fails. So the final n is 0.'),
('if-elif-else', 'What is the output?', 'x = 7\nif x % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")', 'mcq', 'B', 10, '7 % 2 = 1 (remainder), not 0. So it is odd and prints Odd.'),
('for', 'Type in the output of this code:', 'for i in range(3):\n    print("Hi")', 'typed', 'Hi Hi Hi', 10, 'range(3) runs 3 times, printing Hi on each line.'),
('while', 'Type in the final value of x:', 'x = 10\nwhile x > 0:\n    x = x - 2\nprint(x)', 'typed', '0', 10, 'x starts at 10, subtracts 2 each loop: 10 -> 8 -> 6 -> 4 -> 2 -> 0. When x = 0, the condition x > 0 fails.');

-- 9. Insert answer options for MCQ questions
INSERT INTO answer_options (question_id, option_label, option_text, is_correct) VALUES
(1, 'A', 'A', 1), (1, 'B', 'B', 0), (1, 'C', 'Nothing prints', 0), (1, 'D', 'Error', 0),
(2, 'A', 'A', 0), (2, 'B', 'B', 1), (2, 'C', 'C', 0), (2, 'D', 'Nothing prints', 0),
(3, 'A', 'a is bigger', 0), (3, 'B', 'b is bigger', 1), (3, 'C', 'equal', 0), (3, 'D', 'Error', 0),
(4, 'A', '4 times', 0), (4, 'B', '5 times', 1), (4, 'C', '6 times', 0), (4, 'D', 'Infinite', 0),
(5, 'A', '8', 0), (5, 'B', '9', 1), (5, 'C', '10', 0), (5, 'D', '11', 0),
(6, 'A', '4', 0), (6, 'B', '10', 1), (6, 'C', '24', 0), (6, 'D', '1', 0),
(7, 'A', '2 times', 0), (7, 'B', '3 times', 1), (7, 'C', '4 times', 0), (7, 'D', 'Infinite', 0),
(8, 'A', 'Nothing, it works fine', 0), (8, 'B', 'It is an infinite loop', 1), (8, 'C', 'Syntax error', 0), (8, 'D', 'x should be less than 0', 0),
(9, 'A', '5', 0), (9, 'B', '1', 0), (9, 'C', '0', 1), (9, 'D', '-1', 0),
(10, 'A', 'Even', 0), (10, 'B', 'Odd', 1), (10, 'C', 'Error', 0), (10, 'D', 'Nothing', 0);

-- Done!
SELECT 'Database fwdd_game created successfully!' AS status;
