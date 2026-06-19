-- ============================================================
-- Smart Start — Complete Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE topic_status AS ENUM ('not_started', 'learning', 'completed', 'needs_revision');
CREATE TYPE session_type AS ENUM ('pomodoro', 'stopwatch', 'planned');
CREATE TYPE session_status AS ENUM ('completed', 'partial', 'skipped');
CREATE TYPE revision_status AS ENUM ('pending', 'completed', 'skipped');
CREATE TYPE subscription_status AS ENUM ('free', 'active', 'expired', 'cancelled', 'trial');

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  age INT,
  class_year TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  streak_days INT NOT NULL DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6C5CE7',
  icon TEXT NOT NULL DEFAULT 'book',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_user ON subjects(user_id);

-- ============================================================
-- CHAPTERS TABLE
-- ============================================================

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapters_subject ON chapters(subject_id);
CREATE INDEX idx_chapters_user ON chapters(user_id);

-- ============================================================
-- TOPICS TABLE
-- ============================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status topic_status NOT NULL DEFAULT 'not_started',
  confidence INT NOT NULL DEFAULT 1 CHECK (confidence >= 1 AND confidence <= 5),
  completed_at TIMESTAMPTZ,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_chapter ON topics(chapter_id);
CREATE INDEX idx_topics_user ON topics(user_id);
CREATE INDEX idx_topics_status ON topics(user_id, status);

-- ============================================================
-- EXAMS TABLE
-- ============================================================

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  previous_score TEXT,
  target_score TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exams_user ON exams(user_id);

-- ============================================================
-- AVAILABILITY TABLE
-- ============================================================

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_user ON availability(user_id);

-- ============================================================
-- STUDY SESSIONS TABLE
-- ============================================================

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  session_type session_type NOT NULL DEFAULT 'pomodoro',
  status session_status NOT NULL DEFAULT 'completed',
  duration_minutes INT NOT NULL DEFAULT 0,
  notes TEXT,
  doubts TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_sessions_date ON study_sessions(user_id, started_at);

-- ============================================================
-- DAILY PLANS TABLE
-- ============================================================

CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

CREATE INDEX idx_plans_user_date ON daily_plans(user_id, plan_date);

-- ============================================================
-- REVISION SCHEDULE TABLE
-- ============================================================

CREATE TABLE revision_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  revision_date DATE NOT NULL,
  revision_number INT NOT NULL DEFAULT 1,
  status revision_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revision_user ON revision_schedule(user_id);
CREATE INDEX idx_revision_date ON revision_schedule(user_id, revision_date);
CREATE INDEX idx_revision_topic ON revision_schedule(topic_id);

-- ============================================================
-- MISTAKES TABLE
-- ============================================================

CREATE TABLE mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  mistake TEXT NOT NULL,
  reason TEXT,
  correction TEXT,
  is_corrected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mistakes_user ON mistakes(user_id);
CREATE INDEX idx_mistakes_subject ON mistakes(user_id, subject_id);

-- ============================================================
-- DAILY REFLECTIONS TABLE
-- ============================================================

CREATE TABLE daily_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reflection_date DATE NOT NULL,
  completed_summary TEXT,
  questions_solved INT DEFAULT 0,
  difficulty_notes TEXT,
  tomorrow_priority TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, reflection_date)
);

CREATE INDEX idx_reflections_user ON daily_reflections(user_id);

-- ============================================================
-- ACHIEVEMENTS TABLE
-- ============================================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================================
-- DAILY MISSIONS TABLE
-- ============================================================

CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  missions JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_reward INT NOT NULL DEFAULT 50,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_date)
);

CREATE INDEX idx_missions_user ON daily_missions(user_id);

-- ============================================================
-- SHARE ACTIVITY TABLE
-- ============================================================

CREATE TABLE share_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_method TEXT NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_user ON share_activity(user_id);

-- ============================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER SUBSCRIPTIONS TABLE
-- ============================================================

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'free',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);

-- ============================================================
-- FEATURES TABLE
-- ============================================================

CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name TEXT NOT NULL,
  free_access BOOLEAN NOT NULL DEFAULT true,
  smart_access BOOLEAN NOT NULL DEFAULT true,
  premium_access BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_daily_plans_updated
  BEFORE UPDATE ON daily_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create revision schedule when topic is completed
CREATE OR REPLACE FUNCTION handle_topic_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
    -- Day 1: Tomorrow
    INSERT INTO revision_schedule (user_id, topic_id, revision_date, revision_number)
    VALUES (NEW.user_id, NEW.id, CURRENT_DATE + 1, 1);
    -- Day 2: After 3 days
    INSERT INTO revision_schedule (user_id, topic_id, revision_date, revision_number)
    VALUES (NEW.user_id, NEW.id, CURRENT_DATE + 3, 2);
    -- Day 3: After 7 days
    INSERT INTO revision_schedule (user_id, topic_id, revision_date, revision_number)
    VALUES (NEW.user_id, NEW.id, CURRENT_DATE + 7, 3);
    -- Day 4: After 14 days
    INSERT INTO revision_schedule (user_id, topic_id, revision_date, revision_number)
    VALUES (NEW.user_id, NEW.id, CURRENT_DATE + 14, 4);
    -- Day 5: After 30 days
    INSERT INTO revision_schedule (user_id, topic_id, revision_date, revision_number)
    VALUES (NEW.user_id, NEW.id, CURRENT_DATE + 30, 5);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_topic_completed
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION handle_topic_completion();

-- ============================================================
-- RPC: Increment XP and handle leveling up
-- ============================================================

CREATE OR REPLACE FUNCTION increment_xp(user_id_input UUID, xp_amount INT)
RETURNS JSON AS $$
DECLARE
  current_xp INT;
  current_level INT;
  new_xp INT;
  new_level INT;
  leveled_up BOOLEAN := false;
  level_thresholds INT[] := ARRAY[0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];
BEGIN
  SELECT xp, level INTO current_xp, current_level
  FROM profiles WHERE id = user_id_input;

  new_xp := current_xp + xp_amount;
  new_level := current_level;

  -- Check for level ups
  WHILE new_level < array_length(level_thresholds, 1) AND new_xp >= level_thresholds[new_level + 1] LOOP
    new_level := new_level + 1;
  END LOOP;

  IF new_level > current_level THEN
    leveled_up := true;
  END IF;

  UPDATE profiles
  SET xp = new_xp, level = new_level, last_study_date = CURRENT_DATE
  WHERE id = user_id_input;

  RETURN json_build_object(
    'new_xp', new_xp,
    'new_level', new_level,
    'leveled_up', leveled_up
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: Update study streak
-- ============================================================

CREATE OR REPLACE FUNCTION update_streak(user_id_input UUID)
RETURNS INT AS $$
DECLARE
  current_streak INT;
  last_date DATE;
  new_streak INT;
BEGIN
  SELECT streak_days, last_study_date INTO current_streak, last_date
  FROM profiles WHERE id = user_id_input;

  IF last_date = CURRENT_DATE THEN
    -- Already studied today
    RETURN current_streak;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    new_streak := current_streak + 1;
  ELSE
    -- Streak broken
    new_streak := 1;
  END IF;

  UPDATE profiles
  SET streak_days = new_streak, last_study_date = CURRENT_DATE
  WHERE id = user_id_input;

  RETURN new_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: Check and award achievements
-- ============================================================

CREATE OR REPLACE FUNCTION check_achievements(user_id_input UUID)
RETURNS TEXT[] AS $$
DECLARE
  streak INT;
  completed_topics INT;
  total_sessions INT;
  completed_revisions INT;
  newly_unlocked TEXT[] := ARRAY[]::TEXT[];
  achievement_exists BOOLEAN;
BEGIN
  SELECT streak_days INTO streak FROM profiles WHERE id = user_id_input;
  SELECT COUNT(*) INTO completed_topics FROM topics WHERE user_id = user_id_input AND status = 'completed';
  SELECT COUNT(*) INTO total_sessions FROM study_sessions WHERE user_id = user_id_input;
  SELECT COUNT(*) INTO completed_revisions FROM revision_schedule WHERE user_id = user_id_input AND status = 'completed';

  -- streak_7
  IF streak >= 7 THEN
    SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = user_id_input AND achievement_type = 'streak_7') INTO achievement_exists;
    IF NOT achievement_exists THEN
      INSERT INTO achievements (user_id, achievement_type) VALUES (user_id_input, 'streak_7');
      newly_unlocked := array_append(newly_unlocked, 'streak_7');
    END IF;
  END IF;

  -- streak_30
  IF streak >= 30 THEN
    SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = user_id_input AND achievement_type = 'streak_30') INTO achievement_exists;
    IF NOT achievement_exists THEN
      INSERT INTO achievements (user_id, achievement_type) VALUES (user_id_input, 'streak_30');
      newly_unlocked := array_append(newly_unlocked, 'streak_30');
    END IF;
  END IF;

  -- topics_10
  IF completed_topics >= 10 THEN
    SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = user_id_input AND achievement_type = 'topics_10') INTO achievement_exists;
    IF NOT achievement_exists THEN
      INSERT INTO achievements (user_id, achievement_type) VALUES (user_id_input, 'topics_10');
      newly_unlocked := array_append(newly_unlocked, 'topics_10');
    END IF;
  END IF;

  -- topics_100
  IF completed_topics >= 100 THEN
    SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = user_id_input AND achievement_type = 'topics_100') INTO achievement_exists;
    IF NOT achievement_exists THEN
      INSERT INTO achievements (user_id, achievement_type) VALUES (user_id_input, 'topics_100');
      newly_unlocked := array_append(newly_unlocked, 'topics_100');
    END IF;
  END IF;

  -- sessions_50
  IF total_sessions >= 50 THEN
    SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = user_id_input AND achievement_type = 'sessions_50') INTO achievement_exists;
    IF NOT achievement_exists THEN
      INSERT INTO achievements (user_id, achievement_type) VALUES (user_id_input, 'sessions_50');
      newly_unlocked := array_append(newly_unlocked, 'sessions_50');
    END IF;
  END IF;

  -- revision_master
  IF completed_revisions >= 50 THEN
    SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = user_id_input AND achievement_type = 'revision_master') INTO achievement_exists;
    IF NOT achievement_exists THEN
      INSERT INTO achievements (user_id, achievement_type) VALUES (user_id_input, 'revision_master');
      newly_unlocked := array_append(newly_unlocked, 'revision_master');
    END IF;
  END IF;

  RETURN newly_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: Generate daily missions
-- ============================================================

CREATE OR REPLACE FUNCTION generate_daily_missions(user_id_input UUID)
RETURNS VOID AS $$
DECLARE
  mission_pool TEXT[] := ARRAY[
    'Complete a 25-minute Pomodoro session',
    'Review 3 topics from your revision schedule',
    'Add a new chapter or topic to a subject',
    'Complete 5 study tasks from your daily plan',
    'Log any mistakes you made today',
    'Write your daily reflection',
    'Study for at least 1 hour total',
    'Mark 3 topics as completed',
    'Rate your confidence on 5 topics',
    'Complete a 50-minute deep focus session'
  ];
  selected_missions JSONB;
  shuffled TEXT[];
  mission_exists BOOLEAN;
BEGIN
  -- Check if missions already exist for today
  SELECT EXISTS(
    SELECT 1 FROM daily_missions WHERE user_id = user_id_input AND mission_date = CURRENT_DATE
  ) INTO mission_exists;

  IF mission_exists THEN RETURN; END IF;

  -- Shuffle the pool and pick 3
  shuffled := (SELECT ARRAY(SELECT unnest(mission_pool) ORDER BY random()));

  selected_missions := jsonb_build_array(
    jsonb_build_object('text', shuffled[1], 'completed', false),
    jsonb_build_object('text', shuffled[2], 'completed', false),
    jsonb_build_object('text', shuffled[3], 'completed', false)
  );

  INSERT INTO daily_missions (user_id, mission_date, missions, xp_reward)
  VALUES (user_id_input, CURRENT_DATE, selected_missions, 50);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile, admins can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Generic user-owned table policies (same pattern for most tables)
-- Subjects
CREATE POLICY "Users manage own subjects"
  ON subjects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chapters
CREATE POLICY "Users manage own chapters"
  ON chapters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Topics
CREATE POLICY "Users manage own topics"
  ON topics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Exams
CREATE POLICY "Users manage own exams"
  ON exams FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Availability
CREATE POLICY "Users manage own availability"
  ON availability FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Study Sessions
CREATE POLICY "Users manage own sessions"
  ON study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily Plans
CREATE POLICY "Users manage own plans"
  ON daily_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Revision Schedule
CREATE POLICY "Users manage own revisions"
  ON revision_schedule FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mistakes
CREATE POLICY "Users manage own mistakes"
  ON mistakes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily Reflections
CREATE POLICY "Users manage own reflections"
  ON daily_reflections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Users manage own achievements"
  ON achievements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily Missions
CREATE POLICY "Users manage own missions"
  ON daily_missions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Share Activity
CREATE POLICY "Users manage own shares"
  ON share_activity FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscription Plans (read-only for all authenticated users)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- Features (read-only for all authenticated users)
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view features"
  ON features FOR SELECT
  USING (true);

-- Admin policies for admin-managed tables
CREATE POLICY "Admin manages plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin manages features"
  ON features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed subscription plans (placeholders)
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, is_active) VALUES
  ('Free', 'Basic features for getting started', 0, 'monthly', '["Basic study tracking", "3 subjects", "Pomodoro timer", "Basic analytics"]'::jsonb, true),
  ('Smart', 'Enhanced features for serious students', 9.99, 'monthly', '["Unlimited subjects", "Advanced analytics", "PDF export", "Priority support", "Custom themes"]'::jsonb, false),
  ('Premium', 'Everything you need to excel', 19.99, 'monthly', '["Everything in Smart", "AI study suggestions", "Collaboration", "Advanced reports", "API access"]'::jsonb, false);

-- Seed features
INSERT INTO features (feature_name, free_access, smart_access, premium_access) VALUES
  ('Study Tracking', true, true, true),
  ('Pomodoro Timer', true, true, true),
  ('Basic Analytics', true, true, true),
  ('Spaced Revision', true, true, true),
  ('Unlimited Subjects', false, true, true),
  ('PDF Export', false, true, true),
  ('Advanced Analytics', false, true, true),
  ('Custom Themes', false, true, true),
  ('AI Suggestions', false, false, true),
  ('Collaboration', false, false, true),
  ('Advanced Reports', false, false, true);
