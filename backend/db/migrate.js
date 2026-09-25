const { pool } = require('../config/database');

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('participant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'true_false');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE question_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  profile_picture TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  role user_role NOT NULL DEFAULT 'participant',
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE TABLE IF NOT EXISTS quiz_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT 'GENESIS 4.0 Quiz',
  description TEXT NOT NULL DEFAULT 'An event quiz for GENESIS 4.0.',
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
  default_marks NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (default_marks >= 0),
  default_negative_marks NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (default_negative_marks >= 0),
  allow_navigation BOOLEAN NOT NULL DEFAULT true,
  randomize_questions BOOLEAN NOT NULL DEFAULT false,
  randomize_options BOOLEAN NOT NULL DEFAULT false,
  show_results BOOLEAN NOT NULL DEFAULT true,
  show_correct_answers BOOLEAN NOT NULL DEFAULT false,
  allow_retry BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  type question_type NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answers JSONB NOT NULL DEFAULT '[]',
  explanation TEXT DEFAULT '',
  marks NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (marks >= 0),
  negative_marks NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (negative_marks >= 0),
  "order" INTEGER NOT NULL DEFAULT 0,
  status question_status NOT NULL DEFAULT 'draft',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questions_status_order_idx
  ON questions (status, "order")
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS questions_deleted_idx ON questions (deleted_at);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_settings_id UUID REFERENCES quiz_settings(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  score NUMERIC(10,2) DEFAULT 0,
  maximum_score NUMERIC(10,2) DEFAULT 0,
  percentage NUMERIC(6,2) DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  question_order JSONB NOT NULL DEFAULT '[]',
  option_orders JSONB NOT NULL DEFAULT '{}',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_status_idx ON quiz_attempts (status);
CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_one_active_per_user
  ON quiz_attempts (user_id)
  WHERE status = 'in_progress';

CREATE TABLE IF NOT EXISTS submitted_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_answers JSONB NOT NULL DEFAULT '[]',
  is_correct BOOLEAN,
  marks_awarded NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS submitted_answers_attempt_idx ON submitted_answers (attempt_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64),
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_attempts_identifier_idx
  ON login_attempts (identifier, created_at);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(SCHEMA);
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate, SCHEMA };
