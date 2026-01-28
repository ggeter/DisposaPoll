-- DisposaPoll Database Schema
-- SQLite schema for D1 Database

-- Polls table
CREATE TABLE polls (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT 0,
    total_participants INTEGER DEFAULT 0
);

CREATE INDEX idx_polls_last_accessed ON polls(last_accessed);

-- Questions table
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'single' | 'multiple' | 'text' | 'rating'
    options TEXT, -- JSON array for choice types
    order_index INTEGER NOT NULL,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_poll ON questions(poll_id);

-- Participants table
CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    has_submitted BOOLEAN DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    UNIQUE(poll_id, session_id) -- Prevent duplicate participation
);

CREATE INDEX idx_participants_poll ON participants(poll_id);
CREATE INDEX idx_participants_session ON participants(poll_id, session_id);

-- Answers table
CREATE TABLE answers (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    poll_id TEXT NOT NULL, -- Denormalized for efficient queries
    answer_value TEXT NOT NULL, -- JSON object
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE INDEX idx_answers_poll ON answers(poll_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_participant ON answers(participant_id);
