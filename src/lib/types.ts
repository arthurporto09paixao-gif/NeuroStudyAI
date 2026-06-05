export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Simplified types for use throughout the app
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'guardian' | 'teacher' | 'admin';
  age: number | null;
  grade: string | null;
  course: string | null;
  neurodivergences: string[];
  learning_preferences: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessibilitySettings {
  id: string;
  user_id: string;
  dyslexia_mode: boolean;
  adhd_mode: boolean;
  tea_mode: boolean;
  font_size: 'small' | 'medium' | 'large' | 'xlarge';
  line_spacing: 'normal' | 'relaxed' | 'loose';
  contrast_mode: 'normal' | 'high' | 'dark';
  reading_ruler: boolean;
  text_to_speech: boolean;
  background_color: 'white' | 'cream' | 'dark';
  open_dyslexic_font: boolean;
  syllable_highlight: boolean;
  reduce_animations: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  exam_date: string | null;
  target_grade: number | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  session_type: 'general' | 'flashcards' | 'mind_map' | 'neuroscan' | 'pomodoro' | 'exam_prep';
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string | null;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review: string;
  review_count: number;
  last_reviewed: string | null;
  source_neuroscan_id: string | null;
  created_at: string;
}

export interface MindMap {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: Json;
  source_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface Neuroscan {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  original_content: string | null;
  file_url: string | null;
  file_type: 'text' | 'image' | 'pdf' | null;
  summary: string | null;
  simplified_text: string | null;
  exercises: Json;
  audio_url: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  schedule_type: 'study' | 'exam' | 'review' | 'break';
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean;
  progress: number;
  created_at: string;
}

export interface GuardianLink {
  id: string;
  guardian_id: string;
  student_id: string;
  approved: boolean;
  created_at: string;
}

// Database type for Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      accessibility_settings: {
        Row: AccessibilitySettings;
        Insert: Partial<AccessibilitySettings> & { user_id: string };
        Update: Partial<AccessibilitySettings>;
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Subject, 'id'>>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, 'id'> & { id?: string };
        Update: Partial<Omit<StudySession, 'id'>>;
      };
      flashcards: {
        Row: Flashcard;
        Insert: Omit<Flashcard, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Flashcard, 'id'>>;
      };
      mind_maps: {
        Row: MindMap;
        Insert: Omit<MindMap, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<MindMap, 'id'>>;
      };
      neuroscans: {
        Row: Neuroscan;
        Insert: Omit<Neuroscan, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Neuroscan, 'id'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'> & { id?: string; session_id?: string };
        Update: Partial<Omit<ChatMessage, 'id'>>;
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Schedule, 'id'>>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Goal, 'id'>>;
      };
      guardian_links: {
        Row: GuardianLink;
        Insert: Omit<GuardianLink, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<GuardianLink, 'id'>>;
      };
    };
  };
};
