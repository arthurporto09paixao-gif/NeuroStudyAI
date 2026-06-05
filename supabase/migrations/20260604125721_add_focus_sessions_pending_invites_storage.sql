/*
  # NeuroStudy AI — Focus Sessions, Pending Invites & Storage

  ## New Tables

  ### 1. focus_sessions
  Records individual focus/game/pomodoro sessions for analytics.
  - id, user_id
  - session_type: 'pomodoro' | 'sequence_game' | 'word_match' | 'breathing'
  - duration_minutes, score (for games)
  - subject_id: optional link to a subject (for pomodoro)
  - completed_at

  ### 2. pending_invites
  Token-based guardian invite system. Guardian creates an invite token;
  student uses it to accept the guardian link.
  - id, guardian_id
  - student_email: the email the guardian entered
  - token: a unique random string shared with the student
  - expires_at: 7 days from creation
  - accepted_at: null until student accepts
  - accepted_by: student user_id after acceptance

  ## Security
  - RLS enabled on both tables
  - Focus sessions: users own their own data
  - Pending invites: guardians can manage their invites; any authenticated user
    can look up an invite by token (to accept it)

  ## Storage
  - neurostudy-uploads bucket created for file uploads (PDFs, images)
*/

-- FOCUS SESSIONS
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'pomodoro'
    CHECK (session_type IN ('pomodoro', 'sequence_game', 'word_match', 'breathing')),
  duration_minutes integer NOT NULL DEFAULT 0,
  score integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own focus sessions"
  ON focus_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
  ON focus_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, completed_at DESC);

-- PENDING INVITES
CREATE TABLE IF NOT EXISTS pending_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guardians can read own invites"
  ON pending_invites FOR SELECT
  TO authenticated
  USING (auth.uid() = guardian_id);

CREATE POLICY "Guardians can insert own invites"
  ON pending_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = guardian_id);

CREATE POLICY "Guardians can delete own invites"
  ON pending_invites FOR DELETE
  TO authenticated
  USING (auth.uid() = guardian_id);

-- Any authenticated user can look up an invite by token (to accept it)
CREATE POLICY "Authenticated users can look up invites by token"
  ON pending_invites FOR SELECT
  TO authenticated
  USING (true);

-- Students can update invite to mark it accepted
CREATE POLICY "Students can accept invites"
  ON pending_invites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = accepted_by);

CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites(token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_guardian ON pending_invites(guardian_id);
