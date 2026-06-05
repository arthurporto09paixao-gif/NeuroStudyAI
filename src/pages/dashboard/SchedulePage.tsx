import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle, Circle, Loader2, X, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Schedule, Subject } from '../../lib/types';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function getWeekDays(date: Date) {
  const week = [];
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d);
  }
  return week;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({
    title: '', description: '', scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '', duration_minutes: '60', priority: 'medium' as const,
    schedule_type: 'study' as const, subject_id: '',
  });

  const currentWeek = getWeekDays(new Date(Date.now() + weekOffset * 7 * 86400000));

  useEffect(() => {
    if (!user) return;
    const start = currentWeek[0].toISOString().split('T')[0];
    const end = currentWeek[6].toISOString().split('T')[0];
    Promise.all([
      supabase.from('schedules').select('*').eq('user_id', user.id).gte('scheduled_date', start).lte('scheduled_date', end).order('scheduled_date').order('scheduled_time'),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]).then(([sc, sub]) => {
      setSchedules(sc.data || []);
      setSubjects(sub.data || []);
      setLoading(false);
    });
  }, [user, weekOffset]);

  const save = async () => {
    if (!user || !form.title.trim() || !form.scheduled_date) return;
    setSaving(true);
    const { data } = await supabase.from('schedules').insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time || null,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      priority: form.priority,
      schedule_type: form.schedule_type,
      subject_id: form.subject_id || null,
    }).select().single();
    if (data) {
      setSchedules(prev => [...prev, data].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)));
      setShowForm(false);
      setForm({ title: '', description: '', scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '', duration_minutes: '60', priority: 'medium', schedule_type: 'study', subject_id: '' });
    }
    setSaving(false);
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from('schedules').update({ completed: !completed }).eq('id', id);
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !completed } : s));
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id);
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const typeColors = { study: 'bg-blue-100 text-blue-700', exam: 'bg-red-100 text-red-700', review: 'bg-amber-100 text-amber-700', break: 'bg-green-100 text-green-700' };
  const typeLabels = { study: 'Estudo', exam: 'Prova', review: 'Revisao', break: 'Pausa' };
  const priorityDot = { low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-400' };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Cronograma</h2>
          <p className="section-subtitle">{schedules.length} atividades esta semana</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm w-fit">
          <Plus size={14} />
          Nova atividade
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">Nova atividade</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Titulo *</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Revisao de Matematica" className="input-field" />
            </div>
            <div>
              <label className="label">Data *</label>
              <input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label">Horario</label>
              <input type="time" value={form.scheduled_time} onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label">Duracao (minutos)</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} min="5" max="480" className="input-field" />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select value={form.schedule_type} onChange={e => setForm(p => ({ ...p, schedule_type: e.target.value as typeof form.schedule_type }))} className="input-field">
                <option value="study">Estudo</option>
                <option value="exam">Prova</option>
                <option value="review">Revisao</option>
                <option value="break">Pausa</option>
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof form.priority }))} className="input-field">
                <option value="low">Baixa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="label">Materia (opcional)</label>
              <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} className="input-field">
                <option value="">Sem materia</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Descricao</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcional" className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancelar</button>
            <button onClick={save} disabled={!form.title.trim() || !form.scheduled_date || saving} className="btn-primary text-sm">
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Week navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost text-sm px-3 py-1.5">Anterior</button>
          <span className="text-sm font-semibold text-gray-700">
            {currentWeek[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — {currentWeek[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost text-sm px-3 py-1.5">Proxima</button>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-1">
          {currentWeek.map((day, i) => {
            const dateStr = day.toISOString().split('T')[0];
            const daySchedules = schedules.filter(s => s.scheduled_date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            return (
              <div key={i} className={`rounded-xl p-2 min-h-[80px] ${isToday ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}>
                <div className={`text-[10px] font-semibold mb-1 ${isToday ? 'text-primary-600' : 'text-gray-400'}`}>{DAYS[i]}</div>
                <div className={`text-sm font-bold ${isToday ? 'text-primary-700' : 'text-gray-800'}`}>{day.getDate()}</div>
                <div className="mt-1 space-y-0.5">
                  {daySchedules.map(s => (
                    <div
                      key={s.id}
                      className={`text-[9px] px-1 py-0.5 rounded truncate ${typeColors[s.schedule_type]} ${s.completed ? 'opacity-50 line-through' : ''}`}
                    >
                      {s.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule list */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 font-jakarta mb-4">Atividades da semana</h3>
        {schedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma atividade esta semana</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map(s => {
              const sub = subjects.find(sub => sub.id === s.subject_id);
              return (
                <div key={s.id} className={`flex items-start gap-3 p-3.5 rounded-xl border group transition-all ${s.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  <button onClick={() => toggleComplete(s.id, s.completed)} className="mt-0.5">
                    {s.completed ? <CheckCircle size={17} className="text-green-500" /> : <Circle size={17} className="text-gray-300 hover:text-primary-500 transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${s.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{s.title}</span>
                      <span className={`badge text-[10px] ${typeColors[s.schedule_type]}`}>{typeLabels[s.schedule_type]}</span>
                      {sub && <span className="text-[10px] text-gray-400">{sub.name}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[s.priority]}`} />
                      <span className="text-xs text-gray-400">
                        {new Date(s.scheduled_date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {s.scheduled_time && ` — ${s.scheduled_time.slice(0, 5)}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />
                        {s.duration_minutes}min
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteSchedule(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
