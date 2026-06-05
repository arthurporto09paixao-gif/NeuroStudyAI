import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, AccessibilitySettings } from '../lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  accessibilitySettings: AccessibilitySettings | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAccessibility: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function applyAccessibilityToDOM(settings: AccessibilitySettings) {
  const body = document.body;
  body.classList.toggle('font-dyslexic', settings.open_dyslexic_font);
  body.classList.toggle('bg-cream', settings.background_color === 'cream');
  body.classList.toggle('dark-mode', settings.background_color === 'dark');
  body.classList.toggle('contrast-high', settings.contrast_mode === 'high');
  body.classList.toggle('reduce-animations', settings.reduce_animations);
  body.classList.toggle('syllable-highlight', settings.syllable_highlight);
  body.classList.remove('font-large', 'font-xlarge', 'font-small');
  if (settings.font_size !== 'medium') body.classList.add(`font-${settings.font_size}`);
  body.classList.remove('spacing-relaxed', 'spacing-loose');
  if (settings.line_spacing !== 'normal') body.classList.add(`spacing-${settings.line_spacing}`);
}

function resetAccessibilityDOM() {
  const body = document.body;
  body.classList.remove(
    'font-dyslexic', 'bg-cream', 'dark-mode', 'contrast-high',
    'reduce-animations', 'syllable-highlight',
    'font-large', 'font-xlarge', 'font-small',
    'spacing-relaxed', 'spacing-loose'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.error('fetchProfile error:', error.message);
    setProfile(data);
    return data;
  };

  const fetchAccessibility = async (userId: string): Promise<AccessibilitySettings | null> => {
    const { data, error } = await supabase
      .from('accessibility_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) console.error('fetchAccessibility error:', error.message);
    setAccessibilitySettings(data);
    if (data) applyAccessibilityToDOM(data);
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([fetchProfile(session.user.id), fetchAccessibility(session.user.id)])
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await Promise.all([fetchProfile(session.user.id), fetchAccessibility(session.user.id)]);
          setLoading(false);
        })();
      } else {
        // Clear all state and reset DOM when signed out
        setProfile(null);
        setAccessibilitySettings(null);
        resetAccessibilityDOM();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear local state immediately for instant feedback
    setProfile(null);
    setAccessibilitySettings(null);
    resetAccessibilityDOM();
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshAccessibility = async () => {
    if (user) await fetchAccessibility(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, accessibilitySettings,
      loading, signOut, refreshProfile, refreshAccessibility,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
