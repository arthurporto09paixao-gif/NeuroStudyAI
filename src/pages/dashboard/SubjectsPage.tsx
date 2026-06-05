import { useState, useEffect } from 'react';
import { Plus, BookOpen, Loader2, X, Edit2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Subject } from '../../lib/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16', '#F97316'];

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', color: '#3B82F6', exam_date: '', target_grade: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('*').eq('user_id', user.id).order('created_at').then(({ data }) => {
      setSubjects(data || []);
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name,
      color: form.color,
      exam_date: form.exam_date || null,
      target_grade: form.target_grade ? parseFloat(form.target_grade) : null,
    };

    if (editingId) {
      const { data } = await supabase.from('subjects').update(payload).eq('id', editingId).select().single();
      if (data) setSubjects(prev => prev.map(s => s.id === editingId ? data : s));
      setEditingId(null);
    } else {
      const { data } = await supabase.from('subjects').insert(payload).select().single();
      if (data) setSubjects(prev => [...prev, data]);
    }

    setForm({ name: '', color: '#3B82F6', exam_date: '', target_grade: '' });
    setShowForm(false);
    setSaving(false);
  };

  const deleteSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
    setSubjects(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  const startEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setForm({ name: sub.name, color: sub.color, exam_date: sub.exam_date || '', target_grade: sub.target_grade?.toString() || '' });
    setShowForm(true);
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" /></div>;

  const subjectToDelete = subjects.find(s => s.id === deleteConfirm);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-subject-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 id="delete-subject-title" className="font-bold text-gray-900 font-manrope mb-2">Excluir matéria?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Tem certeza que deseja excluir <strong>{subjectToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={() => deleteSubject(deleteConfirm)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Matérias</h2>
          <p className="section-subtitle">{subjects.length} {subjects.length === 1 ? 'matéria' : 'matérias'} cadastradas</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ name: '', color: '#3B82F6', exam_date: '', target_grade: '' }); setShowForm(true); }}
          className="btn-primary text-sm w-fit"
          aria-label="Adicionar nova matéria"
        >
          <Plus size={14} aria-hidden="true" />
          Adicionar matéria
        </button>
      </div>

      {showForm && (
        <div className="card p-5 animate-fade-in" role="region" aria-label={editingId ? 'Editar matéria' : 'Nova matéria'}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">{editingId ? 'Editar matéria' : 'Nova matéria'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600" aria-label="Fechar formulário"><X size={16} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="subject-name">Nome da matéria *</label>
              <input id="subject-name" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Matemática, Biologia, História..." className="input-field" autoFocus />
            </div>
            <fieldset>
              <legend className="label mb-2">Cor</legend>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                    aria-pressed={form.color === c}
                  />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0" title="Cor personalizada" aria-label="Cor personalizada" />
              </div>
            </fieldset>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="exam-date">Data da prova (opcional)</label>
                <input id="exam-date" type="date" value={form.exam_date} onChange={e => setForm(p => ({ ...p, exam_date: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label" htmlFor="target-grade">Nota alvo (opcional)</label>
                <input id="target-grade" type="number" value={form.target_grade} onChange={e => setForm(p => ({ ...p, target_grade: e.target.value }))} placeholder="Ex: 7.5" min="0" max="10" step="0.1" className="input-field" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-ghost text-sm">Cancelar</button>
            <button onClick={save} disabled={!form.name.trim() || saving} className="btn-primary text-sm">
              {saving ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : editingId ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
              {editingId ? 'Salvar alterações' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="font-semibold text-gray-700 font-manrope mb-2">Nenhuma matéria ainda</h3>
          <p className="text-sm text-gray-400 mb-5">Adicione as matérias que você está estudando para organizar seu conteúdo</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mx-auto">
            <Plus size={13} aria-hidden="true" />
            Adicionar primeira matéria
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {subjects.map(sub => (
            <div key={sub.id} className="card-hover p-5 group" role="listitem">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sub.color + '20' }} aria-hidden="true">
                  <BookOpen size={20} style={{ color: sub.color }} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(sub)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                    aria-label={`Editar ${sub.name}`}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(sub.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    aria-label={`Excluir ${sub.name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div className="w-3 h-1 rounded-full mb-2" style={{ backgroundColor: sub.color }} aria-hidden="true" />
              <h3 className="font-semibold text-gray-900 font-jakarta mb-2">{sub.name}</h3>
              <div className="space-y-1">
                {sub.exam_date && (
                  <div className="text-xs text-gray-500">
                    Prova: {new Date(sub.exam_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </div>
                )}
                {sub.target_grade && (
                  <div className="text-xs text-gray-500">Nota alvo: {sub.target_grade}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
