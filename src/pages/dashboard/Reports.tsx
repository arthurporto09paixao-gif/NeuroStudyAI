import { useState, useEffect } from 'react';
import { BarChart3, Clock, CreditCard, GitBranch, Target, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { StudySession, Subject } from '../../lib/types';

export default function Reports() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [mindMapCount, setMindMapCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (!user) return;
    const cutoff = period === 'week'
      ? new Date(Date.now() - 7 * 86400000).toISOString()
      : period === 'month'
      ? new Date(Date.now() - 30 * 86400000).toISOString()
      : new Date(0).toISOString();

    Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', user.id).gte('started_at', cutoff).order('started_at'),
      supabase.from('subjects').select('*').eq('user_id', user.id),
      supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('mind_maps').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([sess, sub, fc, mm]) => {
      setSessions(sess.data || []);
      setSubjects(sub.data || []);
      setFlashcardCount(fc.count || 0);
      setMindMapCount(mm.count || 0);
      setLoading(false);
    });
  }, [user, period]);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const sessionsByType = sessions.reduce((acc, s) => {
    acc[s.session_type] = (acc[s.session_type] || 0) + s.duration_minutes;
    return acc;
  }, {} as Record<string, number>);

  const dayLabels: Record<string, number> = {};
  sessions.forEach(s => {
    const day = new Date(s.started_at).toLocaleDateString('pt-BR', { weekday: 'short' });
    dayLabels[day] = (dayLabels[day] || 0) + s.duration_minutes;
  });

  const typeLabels: Record<string, string> = {
    general: 'Geral',
    flashcards: 'Flashcards',
    mind_map: 'Mapas Mentais',
    neuroscan: 'NeuroScanner',
    pomodoro: 'Pomodoro',
    exam_prep: 'Prep Prova',
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;

  const hasData = sessions.length > 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Relatorios</h2>
          <p className="section-subtitle">Seu historico de aprendizagem</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {([['week', 'Semana'], ['month', 'Mes'], ['all', 'Total']] as [typeof period, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Clock size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">
            {hasData ? `${totalHours}h${totalMins > 0 ? ` ${totalMins}m` : ''}` : '—'}
          </div>
          <div className="text-xs text-gray-500">Tempo estudado</div>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">{hasData ? sessions.length : '—'}</div>
          <div className="text-xs text-gray-500">Sessoes de estudo</div>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <CreditCard size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">{flashcardCount || '—'}</div>
          <div className="text-xs text-gray-500">Flashcards criados</div>
        </div>
        <div className="card p-4">
          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center mb-3">
            <GitBranch size={18} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-manrope">{mindMapCount || '—'}</div>
          <div className="text-xs text-gray-500">Mapas mentais</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sessions by type */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 font-jakarta mb-4">Atividades por tipo</h3>
          {!hasData ? (
            <div className="text-center py-8">
              <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhuma sessao registrada neste periodo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(sessionsByType).map(([type, mins]) => {
                const pct = Math.round((mins / totalMinutes) * 100);
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{typeLabels[type] || type}</span>
                      <span className="font-medium">{Math.floor(mins / 60)}h {mins % 60}m</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Day activity */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 font-jakarta mb-4">Atividade por dia</h3>
          {!hasData ? (
            <div className="text-center py-8">
              <Target size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(dayLabels).slice(-7).map(([day, mins]) => {
                const maxMins = Math.max(...Object.values(dayLabels));
                const pct = Math.round((mins / maxMins) * 100);
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">{day}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{Math.floor(mins / 60)}h {mins % 60}m</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Subjects overview */}
      {subjects.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 font-jakarta mb-4">Materias cadastradas</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                <span className="text-sm font-medium text-gray-800">{sub.name}</span>
                {sub.exam_date && (
                  <span className="ml-auto text-xs text-gray-400">{new Date(sub.exam_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasData && sessions.length === 0 && (
        <div className="card p-10 text-center">
          <BarChart3 size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 font-manrope mb-2">Nenhum dado disponivel</h3>
          <p className="text-sm text-gray-400">Comece a estudar para ver seu progresso aqui. Os dados serao registrados automaticamente conforme voce usa a plataforma.</p>
        </div>
      )}
    </div>
  );
}
