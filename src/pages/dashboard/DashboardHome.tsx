import { useEffect, useState } from 'react';
import { BookOpen, Clock, CreditCard, GitBranch, Plus, ArrowRight, Target, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Subject, StudySession, Schedule, Goal } from '../../lib/types';
import type { DashboardSection } from '../../components/DashboardLayout';

interface DashboardHomeProps {
  onNavigate: (section: DashboardSection) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [mindMapCount, setMindMapCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      supabase.from('subjects').select('*').eq('user_id', user.id).limit(5),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).gte('started_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('schedules').select('*').eq('user_id', user.id).gte('scheduled_date', today).order('scheduled_date').limit(5),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('completed', false).limit(4),
      supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('mind_maps').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([s, ss, sc, g, fc, mm]) => {
      setSubjects(s.data || []);
      setSessions(ss.data || []);
      setSchedules(sc.data || []);
      setGoals(g.data || []);
      setFlashcardCount(fc.count || 0);
      setMindMapCount(mm.count || 0);
      setLoading(false);
    });
  }, [user]);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasData = subjects.length > 0 || sessions.length > 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-manrope">
          {greeting()}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">
            {hasData ? `${totalHours}h${totalMins > 0 ? ` ${totalMins}m` : ''}` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Estudados esta semana</div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">{flashcardCount || '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">Flashcards criados</div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <GitBranch size={18} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">{mindMapCount || '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">Mapas mentais</div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">{goals.length || '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">Metas ativas</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Subjects */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">Minhas Materias</h3>
            <button onClick={() => onNavigate('subjects')} className="text-xs text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </button>
          </div>
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">Nenhuma materia adicionada ainda</p>
              <button onClick={() => onNavigate('subjects')} className="btn-primary text-xs px-4 py-2">
                <Plus size={13} />
                Adicionar materia
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {subjects.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => onNavigate('subjects')}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="text-sm font-medium text-gray-900 flex-1">{sub.name}</span>
                  {sub.exam_date && (
                    <span className="text-xs text-gray-400">
                      Prova: {new Date(sub.exam_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ))}
              <button onClick={() => onNavigate('subjects')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors mt-1">
                <Plus size={13} />
                Adicionar materia
              </button>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">Proximas atividades</h3>
            <button onClick={() => onNavigate('schedule')} className="text-xs text-primary-600 font-medium hover:text-primary-700">
              <ArrowRight size={12} />
            </button>
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">Nenhuma atividade agendada</p>
              <button onClick={() => onNavigate('schedule')} className="btn-secondary text-xs px-4 py-2">
                Criar cronograma
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {schedules.slice(0, 5).map(sc => (
                <div key={sc.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    sc.priority === 'high' ? 'bg-red-400' : sc.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                  }`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{sc.title}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(sc.scheduled_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      {sc.scheduled_time && ` — ${sc.scheduled_time.slice(0, 5)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-semibold text-gray-900 font-jakarta mb-3">Acesso rapido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Assistente IA', desc: 'Tire duvidas com o tutor', icon: '💬', section: 'assistant' as const },
            { label: 'NeuroScanner', desc: 'Analise um conteudo', icon: '🔍', section: 'neuroscan' as const },
            { label: 'Novo flashcard', desc: 'Crie cartoes de memoria', icon: '🗃', section: 'flashcards' as const },
            { label: 'Mapa mental', desc: 'Visualize o conteudo', icon: '🧠', section: 'mindmaps' as const },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => onNavigate(action.section)}
              className="card-hover p-4 text-left transition-all group"
            >
              <span className="text-2xl mb-2 block" role="img">{action.icon}</span>
              <div className="font-medium text-sm text-gray-900 group-hover:text-primary-700 transition-colors">{action.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{action.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">Metas em andamento</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {goals.map(goal => (
              <div key={goal.id} className="p-3.5 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                  <span className="text-xs font-semibold text-primary-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
