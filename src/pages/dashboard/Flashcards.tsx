import { useState, useEffect, useRef } from 'react';
import { Plus, CreditCard, X, ChevronLeft, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Flashcard, Subject } from '../../lib/types';

type ViewMode = 'list' | 'study';

interface ConfirmDialog {
  id: string;
  message: string;
}

export default function Flashcards() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [form, setForm] = useState<{ front: string; back: string; subject_id: string; difficulty: 'easy' | 'medium' | 'hard' }>({
    front: '', back: '', subject_id: '', difficulty: 'medium',
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('flashcards').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]).then(([fc, sub]) => {
      setFlashcards(fc.data || []);
      setSubjects(sub.data || []);
      setLoading(false);
    });
  }, [user]);

  // Keyboard handler for study mode
  useEffect(() => {
    if (view !== 'study') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f); }
      if (flipped) {
        if (e.key === '1') handleReviewCard('hard');
        if (e.key === '2') handleReviewCard('medium');
        if (e.key === '3') handleReviewCard('easy');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, flipped, studyIndex]);

  const saveCard = async () => {
    if (!user || !form.front.trim() || !form.back.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('flashcards').insert({
      user_id: user.id,
      front: form.front,
      back: form.back,
      subject_id: form.subject_id || null,
      difficulty: form.difficulty,
    }).select().single();
    if (data) {
      setFlashcards(prev => [data, ...prev]);
      setForm({ front: '', back: '', subject_id: '', difficulty: 'medium' });
      setShowForm(false);
    }
    setSaving(false);
  };

  const deleteCard = (id: string) => {
    setConfirmDialog({ id, message: 'Tem certeza que deseja excluir este flashcard?' });
  };

  const confirmDelete = async () => {
    if (!confirmDialog) return;
    await supabase.from('flashcards').delete().eq('id', confirmDialog.id);
    setFlashcards(prev => prev.filter(c => c.id !== confirmDialog.id));
    setConfirmDialog(null);
  };

  const studyCards = flashcards.filter(c => new Date(c.next_review) <= new Date());

  const handleReviewCard = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const card = studyCards[studyIndex];
    if (!card) return;
    const days = difficulty === 'easy' ? 7 : difficulty === 'medium' ? 3 : 1;
    const nextReview = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from('flashcards').update({
      difficulty,
      next_review: nextReview,
      review_count: card.review_count + 1,
      last_reviewed: new Date().toISOString(),
    }).eq('id', card.id);
    setFlashcards(prev => prev.map(c => c.id === card.id ? { ...c, difficulty, next_review: nextReview, review_count: c.review_count + 1 } : c));

    if (studyIndex < studyCards.length - 1) {
      setStudyIndex(i => i + 1);
      setFlipped(false);
      cardRef.current?.focus();
    } else {
      setView('list');
      setStudyIndex(0);
      setFlipped(false);
    }
  };

  const filteredCards = filter === 'all' ? flashcards : flashcards.filter(c => c.difficulty === filter);

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;

  // Study mode
  if (view === 'study' && studyCards.length > 0) {
    const card = studyCards[studyIndex];
    const pct = (studyIndex / studyCards.length) * 100;
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { setView('list'); setStudyIndex(0); setFlipped(false); }}
            className="btn-ghost text-sm"
            aria-label="Sair do modo estudo"
          >
            <ChevronLeft size={15} aria-hidden="true" />
            Sair do estudo
          </button>
          <span className="text-sm text-gray-500 font-medium" aria-live="polite">
            {studyIndex + 1} / {studyCards.length}
          </span>
        </div>

        <div
          className="w-full bg-gray-200 rounded-full h-1.5 mb-6"
          role="progressbar"
          aria-valuenow={studyIndex}
          aria-valuemin={0}
          aria-valuemax={studyCards.length}
          aria-label={`Progresso: ${studyIndex} de ${studyCards.length} cartões revisados`}
        >
          <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        <p className="text-xs text-gray-400 text-center mb-3" aria-hidden="true">
          Espaço ou Enter para virar · 1=Difícil · 2=Médio · 3=Fácil
        </p>

        {/* Flip card */}
        <div
          ref={cardRef}
          onClick={() => setFlipped(!flipped)}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f); } }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `Resposta: ${card.back}. Pressione Espaço para voltar.` : `Pergunta: ${card.front}. Pressione Espaço para ver a resposta.`}
          style={{ perspective: '1000px' }}
          className="cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-primary-500 rounded-2xl"
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '220px',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 card p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
              aria-hidden={flipped}
            >
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-semibold">Pergunta</p>
              <p className="text-lg font-semibold text-gray-900 leading-relaxed">{card.front}</p>
              <p className="text-xs text-gray-400 mt-4">Toque ou pressione Enter para revelar</p>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 card p-8 flex flex-col items-center justify-center text-center bg-primary-50 border-primary-200"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              aria-hidden={!flipped}
            >
              <p className="text-xs text-primary-500 mb-3 uppercase tracking-wider font-semibold">Resposta</p>
              <p className="text-lg font-semibold text-primary-900 leading-relaxed">{card.back}</p>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="mt-6 animate-fade-in" role="group" aria-label="Como foi sua resposta?">
            <p className="text-center text-sm text-gray-500 mb-3">Como foi sua resposta?</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                ['hard', 'Difícil', 'Revisar amanhã', 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'],
                ['medium', 'Médio', 'Revisar em 3 dias', 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'],
                ['easy', 'Fácil', 'Revisar em 7 dias', 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'],
              ] as [string, string, string, string][]).map(([diff, label, sub, cls]) => (
                <button
                  key={diff}
                  onClick={() => handleReviewCard(diff as 'easy' | 'medium' | 'hard')}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${cls}`}
                  aria-label={`Marcar como ${label} — ${sub}`}
                >
                  {label}
                  <div className="text-xs font-normal mt-0.5 opacity-75">{sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Confirm delete dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 id="confirm-title" className="font-semibold text-gray-900">Excluir flashcard</h3>
                <p className="text-sm text-gray-500 mt-1">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDialog(null)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={confirmDelete} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Flashcards</h2>
          <p className="section-subtitle">
            {flashcards.length} {flashcards.length === 1 ? 'cartão' : 'cartões'}
            {studyCards.length > 0 && ` · ${studyCards.length} para revisar hoje`}
          </p>
        </div>
        <div className="flex gap-2">
          {studyCards.length > 0 && (
            <button
              onClick={() => { setView('study'); setStudyIndex(0); setFlipped(false); }}
              className="btn-secondary text-sm"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Estudar ({studyCards.length})
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={14} aria-hidden="true" />
            Novo flashcard
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 animate-fade-in" role="region" aria-label="Criar novo flashcard">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">Novo flashcard</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Fechar formulário">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fc-front" className="label">Pergunta / Frente *</label>
              <textarea
                id="fc-front"
                value={form.front}
                onChange={e => setForm(p => ({ ...p, front: e.target.value }))}
                placeholder="Ex: O que é fotossíntese?"
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label htmlFor="fc-back" className="label">Resposta / Verso *</label>
              <textarea
                id="fc-back"
                value={form.back}
                onChange={e => setForm(p => ({ ...p, back: e.target.value }))}
                placeholder="Ex: Processo pelo qual as plantas produzem..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="fc-subject" className="label">Matéria (opcional)</label>
              <select id="fc-subject" value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} className="input-field">
                <option value="">Sem matéria</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="fc-difficulty" className="label">Dificuldade inicial</label>
              <select id="fc-difficulty" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))} className="input-field">
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancelar</button>
            <button onClick={saveCard} disabled={!form.front.trim() || !form.back.trim() || saving} className="btn-primary text-sm">
              {saving ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
              Salvar flashcard
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div role="group" aria-label="Filtrar por dificuldade" className="flex gap-1.5 flex-wrap">
        {[['all', 'Todos'], ['easy', 'Fácil'], ['medium', 'Médio'], ['hard', 'Difícil']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            aria-pressed={filter === val}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {filteredCards.length === 0 ? (
        <div className="card p-10 text-center">
          <CreditCard size={36} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-gray-500 mb-4">
            {flashcards.length === 0 ? 'Nenhum flashcard criado ainda' : 'Nenhum flashcard neste filtro'}
          </p>
          {flashcards.length === 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm mx-auto">
              <Plus size={13} aria-hidden="true" />
              Criar primeiro flashcard
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="Lista de flashcards">
          {filteredCards.map(card => {
            const sub = subjects.find(s => s.id === card.subject_id);
            return (
              <article key={card.id} className="card p-4 group relative" role="listitem">
                <button
                  onClick={() => deleteCard(card.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all focus-visible:opacity-100"
                  aria-label={`Excluir flashcard: ${card.front}`}
                >
                  <X size={13} aria-hidden="true" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  {sub && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} aria-label={`Matéria: ${sub.name}`} />
                  )}
                  <span className={`badge text-[10px] ${
                    card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    card.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {card.difficulty === 'easy' ? 'Fácil' : card.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                  </span>
                  {new Date(card.next_review) <= new Date() && (
                    <span className="badge bg-primary-100 text-primary-700 text-[10px]">Revisar</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{card.front}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{card.back}</p>
                <div className="text-[10px] text-gray-300 mt-3">
                  {card.review_count > 0 ? `Revisado ${card.review_count}x` : 'Não revisado ainda'}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
