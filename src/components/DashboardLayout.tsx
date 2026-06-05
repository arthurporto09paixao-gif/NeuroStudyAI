import { useState, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Brain, Home, BookOpen, MessageSquare, CreditCard,
  GitBranch, Calendar, BarChart3, Settings, LogOut,
  Menu, X, Accessibility, Scan, Users, Gamepad2, Timer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export type DashboardSection =
  | 'home' | 'subjects' | 'assistant' | 'neuroscan'
  | 'flashcards' | 'mindmaps' | 'schedule' | 'reports'
  | 'settings' | 'accessibility' | 'guardian' | 'focus';

interface NavItemDef {
  id: DashboardSection;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  currentSection: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
  onFocusMode: () => void;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'subjects', label: 'Matérias', icon: BookOpen },
  { id: 'assistant', label: 'Assistente IA', icon: MessageSquare, badge: 'IA' },
  { id: 'neuroscan', label: 'NeuroScanner', icon: Scan },
  { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
  { id: 'mindmaps', label: 'Mapas Mentais', icon: GitBranch },
  { id: 'schedule', label: 'Cronograma', icon: Calendar },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

const NAV_BOTTOM: NavItemDef[] = [
  { id: 'focus', label: 'Jogos de Foco', icon: Gamepad2 },
  { id: 'accessibility', label: 'Acessibilidade', icon: Accessibility },
  { id: 'guardian', label: 'Responsáveis', icon: Users },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function DashboardLayout({ children, currentSection, onNavigate, onFocusMode }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U';

  const currentLabel = [...NAV_ITEMS, ...NAV_BOTTOM].find(n => n.id === currentSection)?.label ?? 'Dashboard';

  const NavItemBtn = ({ item }: { item: NavItemDef }) => {
    const active = currentSection === item.id;
    return (
      <button
        onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
        aria-current={active ? 'page' : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary-500 ${
          active
            ? 'bg-primary-50 text-primary-700 border border-primary-100'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <item.icon size={17} className={active ? 'text-primary-600' : ''} aria-hidden="true" />
        {item.label}
        {item.badge && (
          <span className="ml-auto badge bg-primary-100 text-primary-700 text-[10px]" aria-label={`${item.label} - com IA`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Brain size={17} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 font-manrope text-[15px]">NeuroStudy AI</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 overflow-y-auto" aria-label="Navegação principal">
        <ul className="space-y-0.5" role="list">
          {NAV_ITEMS.map(item => (
            <li key={item.id}><NavItemBtn item={item} /></li>
          ))}
        </ul>

        <div className="pt-3 mt-3 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2" id="tools-nav-label">
            Ferramentas
          </p>
          <ul className="space-y-0.5" role="list" aria-labelledby="tools-nav-label">
            {NAV_BOTTOM.map(item => (
              <li key={item.id}><NavItemBtn item={item} /></li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <span className="text-primary-700 font-semibold text-xs">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || 'Estudante'}</div>
            <div className="text-xs text-gray-400 truncate">{profile?.grade || 'Perfil'}</div>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Sair da conta"
            title="Sair"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0"
        aria-label="Painel lateral"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 bg-white h-full shadow-xl flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Fechar menu"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900">{currentLabel}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Focus mode button */}
            <button
              onClick={onFocusMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 transition-colors"
              aria-label="Ativar modo foco"
              title="Modo Foco com temporizador e ruído marrom"
            >
              <Timer size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Modo Foco</span>
            </button>

            <div
              className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-primary-700 font-semibold text-xs">{userInitials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
