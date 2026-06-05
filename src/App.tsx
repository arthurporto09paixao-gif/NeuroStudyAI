import { useEffect, useState, useRef } from 'react';

 
const removeFloating = () => {
document.querySelectorAll('[style="position: fixed"][style="bottom: 1rem"][style="right: 1rem"][style="z-index: 2147483647"]').forEach(el => el.remove());

};

// executa já no load
removeFloating();

// observa mudanças no DOM
const observer = new MutationObserver(removeFloating);
observer.observe(document.body, { childList: true, subtree: true });

import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import DashboardLayout, { type DashboardSection } from './components/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import AIAssistant from './pages/dashboard/AIAssistant';
import NeuroScanner from './pages/dashboard/NeuroScanner';
import Flashcards from './pages/dashboard/Flashcards';
import MindMaps from './pages/dashboard/MindMaps';
import SchedulePage from './pages/dashboard/SchedulePage';
import Reports from './pages/dashboard/Reports';
import AccessibilityPage from './pages/dashboard/AccessibilityPage';
import GuardianPanel from './pages/dashboard/GuardianPanel';
import SettingsPage from './pages/dashboard/SettingsPage';
import SubjectsPage from './pages/dashboard/SubjectsPage';
import FocusGames from './pages/dashboard/FocusGames';
import FocusMode from './components/FocusMode';
import ResetPasswordPage from './pages/ResetPasswordPage';

type AppPage = 'landing' | 'login' | 'register' | 'reset' | 'reset-password';

function AppContent() {
  const { user, loading, profile, accessibilitySettings, refreshProfile } = useAuth();
  const [page, setPage] = useState<AppPage>('landing');
  const [section, setSection] = useState<DashboardSection>('home');
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Detect password reset tokens in URL
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const type = params.get('type');
    if (type === 'recovery') {
      setPage('reset-password');
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (rulerRef.current && accessibilitySettings?.reading_ruler) {
        rulerRef.current.style.top = `${e.clientY - 20}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [accessibilitySettings?.reading_ruler]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-primary-800 rounded-xl flex items-center justify-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Password reset page — shown to unauthenticated users arriving from email link
  if (page === 'reset-password') {
    return <ResetPasswordPage onDone={() => setPage('login')} />;
  }

  // Authenticated user flow
  if (user) {
    // Show onboarding if profile exists but isn't completed
    if (profile && !profile.onboarding_completed) {
      return <Onboarding onComplete={async () => { await refreshProfile(); }} />;
    }

    // If profile hasn't loaded yet but user exists, show loading
    if (!profile) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <>
        {/* Skip to main content — WCAG 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-700 focus:text-white focus:rounded-lg focus:font-semibold focus:text-sm"
        >
          Ir para o conteúdo principal
        </a>

        {accessibilitySettings?.reading_ruler && (
          <div
            ref={rulerRef}
            className="reading-ruler"
            role="presentation"
            aria-hidden="true"
          />
        )}

        <DashboardLayout
          currentSection={section}
          onNavigate={setSection}
          onFocusMode={() => setFocusModeOpen(true)}
        >
          <main id="main-content" className="flex-1 overflow-y-auto focus:outline-none" tabIndex={-1}>
            {section === 'home' && <DashboardHome onNavigate={setSection} />}
            {section === 'subjects' && <SubjectsPage />}
            {section === 'assistant' && <AIAssistant />}
            {section === 'neuroscan' && <NeuroScanner />}
            {section === 'flashcards' && <Flashcards />}
            {section === 'mindmaps' && <MindMaps />}
            {section === 'schedule' && <SchedulePage />}
            {section === 'reports' && <Reports />}
            {section === 'accessibility' && <AccessibilityPage />}
            {section === 'guardian' && <GuardianPanel />}
            {section === 'settings' && <SettingsPage />}
            {section === 'focus' && <FocusGames />}
          </main>
        </DashboardLayout>

        {focusModeOpen && (
          <FocusMode onClose={() => setFocusModeOpen(false)} />
        )}
      </>
    );
  }

  // Unauthenticated flow
  if (page === 'landing') return <LandingPage onNavigate={(p) => setPage(p as AppPage)} />;
  if (page === 'login' || page === 'register' || page === 'reset') {
    return <AuthPage mode={page} onNavigate={(p) => setPage(p as AppPage)} />;
  }
  return <LandingPage onNavigate={(p) => setPage(p as AppPage)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
