CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE surveys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    max_submissions INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answer_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
    option_id UUID REFERENCES options(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_surveys_published ON surveys(is_published);
CREATE INDEX idx_questions_survey ON questions(survey_id);
CREATE INDEX idx_options_question ON options(question_id);
CREATE INDEX idx_submissions_survey ON submissions(survey_id);
CREATE INDEX idx_answers_submission ON answers(submission_id);
