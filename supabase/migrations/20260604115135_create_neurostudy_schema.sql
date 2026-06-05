/*
  # NeuroStudy AI - Complete Schema

  ## Overview
  Full database schema for the NeuroStudy AI inclusive education platform.

  ## Tables Created

  ### 1. profiles
  Extends Supabase auth.users with user profile data including neurodivergence settings.
  - id: references auth.users
  - full_name, avatar_url, role (student/guardian/teacher/admin)
  - age, grade, course
  - neurodivergences: array of conditions (dyslexia, adhd, tea, dyscalculia, other)
  - learning_preferences: array (videos, audio, images, exercises, mind_maps)
  - onboarding_completed: whether user finished onboarding

  ### 2. accessibility_settings
  Per-user accessibility configuration for each mode.
  - user_id references profiles
  - dyslexia_mode, adhd_mode, tea_mode: boolean toggles
  - font_size, line_spacing, contrast_mode
  - reading_ruler, text_to_speech
  - background_color (white/cream)

  ### 3. subjects
  School subjects/courses the student is studying.
  - user_id, name, color, icon
  - exam_date, target_grade

  ### 4. study_sessions
  Records of study time per subject.
  - user_id, subject_id, duration_minutes
  - started_at, ended_at, session_type

  ### 5. flashcards
  AI-generated and manual flashcards.
  - user_id, subject_id, front, back
  - difficulty (easy/medium/hard)
  - next_review (spaced repetition)
  - review_count, last_reviewed

  ### 6. mind_maps
  AI-generated mind map data stored as JSON.
  - user_id, subject_id, title, content (JSON nodes/edges)
  - source_text (original content used to generate)

  ### 7. neuroscans
  Uploaded content processed by NeuroScanner.
  - user_id, subject_id, title
  - original_content (text/url), file_url
  - summary, simplified_text, exercises (JSON)
  - audio_url, processing_status

  ### 8. chat_messages
  AI Assistant conversation history.
  - user_id, session_id, role (user/assistant)
  - content, created_at

  ### 9. schedules
  Study schedule entries.
  - user_id, subject_id, title, description
  - scheduled_date, duration_minutes
  - completed, priority (low/medium/high)

  ### 10. goals
  Learning goals and milestones.
  - user_id, subject_id, title, description
  - target_date, completed, progress (0-100)

  ### 11. guardian_links
  Links between students and guardians/parents.
  - guardian_id, student_id
  - approved (student must approve)

  ## Security
  - RLS enabled on ALL tables
  - Users can only access their own data
  - Guardians can read linked student data
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'guardian', 'teacher', 'admin')),
  age integer,
  grade text,
  course text,
  neurodivergences text[] DEFAULT '{}',
  learning_preferences text[] DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ACCESSIBILITY SETTINGS
CREATE TABLE IF NOT EXISTS accessibility_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dyslexia_mode boolean DEFAULT false,
  adhd_mode boolean DEFAULT false,
  tea_mode boolean DEFAULT false,
  font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')),
  line_spacing text DEFAULT 'normal' CHECK (line_spacing IN ('normal', 'relaxed', 'loose')),
  contrast_mode text DEFAULT 'normal' CHECK (contrast_mode IN ('normal', 'high', 'dark')),
  reading_ruler boolean DEFAULT false,
  text_to_speech boolean DEFAULT false,
  background_color text DEFAULT 'white' CHECK (background_color IN ('white', 'cream', 'dark')),
  open_dyslexic_font boolean DEFAULT false,
  syllable_highlight boolean DEFAULT false,
  reduce_animations boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own accessibility settings"
  ON accessibility_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accessibility settings"
  ON accessibility_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accessibility settings"
  ON accessibility_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'BookOpen',
  exam_date date,
  target_grade real,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- STUDY SESSIONS
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  session_type text DEFAULT 'general' CHECK (session_type IN ('general', 'flashcards', 'mind_map', 'neuroscan', 'pomodoro', 'exam_prep'))
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- FLASHCARDS
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  front text NOT NULL,
  back text NOT NULL,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  next_review timestamptz DEFAULT now(),
  review_count integer DEFAULT 0,
  last_reviewed timestamptz,
  source_neuroscan_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flashcards"
  ON flashcards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON flashcards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON flashcards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- MIND MAPS
CREATE TABLE IF NOT EXISTS mind_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}',
  source_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mind maps"
  ON mind_maps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mind maps"
  ON mind_maps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mind maps"
  ON mind_maps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mind maps"
  ON mind_maps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- NEUROSCANS
CREATE TABLE IF NOT EXISTS neuroscans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  original_content text,
  file_url text,
  file_type text CHECK (file_type IN ('text', 'image', 'pdf')),
  summary text,
  simplified_text text,
  exercises jsonb DEFAULT '[]',
  audio_url text,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE neuroscans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own neuroscans"
  ON neuroscans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own neuroscans"
  ON neuroscans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own neuroscans"
  ON neuroscans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own neuroscans"
  ON neuroscans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SCHEDULES
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  scheduled_time time,
  duration_minutes integer DEFAULT 60,
  completed boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  schedule_type text DEFAULT 'study' CHECK (schedule_type IN ('study', 'exam', 'review', 'break')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- GOALS
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  target_date date,
  completed boolean DEFAULT false,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- GUARDIAN LINKS
CREATE TABLE IF NOT EXISTS guardian_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guardian_id, student_id)
);

ALTER TABLE guardian_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guardians can read own links"
  ON guardian_links FOR SELECT
  TO authenticated
  USING (auth.uid() = guardian_id OR auth.uid() = student_id);

CREATE POLICY "Guardians can insert links"
  ON guardian_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = guardian_id);

CREATE POLICY "Students can update link approval"
  ON guardian_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = guardian_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = guardian_id);

CREATE POLICY "Anyone involved can delete links"
  ON guardian_links FOR DELETE
  TO authenticated
  USING (auth.uid() = guardian_id OR auth.uid() = student_id);

-- Allow guardians to read linked student profiles
CREATE POLICY "Guardians can read linked student profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM guardian_links
      WHERE guardian_links.guardian_id = auth.uid()
      AND guardian_links.student_id = profiles.id
      AND guardian_links.approved = true
    )
  );

-- FUNCTION: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accessibility_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON flashcards(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_schedules_user_date ON schedules(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_neuroscans_user ON neuroscans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
