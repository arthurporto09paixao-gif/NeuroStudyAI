import { useState, useEffect } from 'react';
import { Plus, GitBranch, Loader2, X, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { MindMap, Subject } from '../../lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface MindMapNode {
  title: string;
  nodes: string[];
  children?: { label: string; items: string[] }[];
}

export default function MindMaps() {
  const { user } = useAuth();
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MindMap | null>(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: '', text: '', subject_id: '' });
  const [zoom, setZoom] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('mind_maps').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('user_id', user.id),
    ]).then(([mm, sub]) => {
      setMaps(mm.data || []);
      setSubjects(sub.data || []);
      setLoading(false);
    });
  }, [user]);

  const generateMap = async () => {
    if (!user || !form.text.trim() || !form.title.trim()) return;
    setGenerating(true);
    setGenerateError('');

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-mindmap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: form.text, title: form.title }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar mapa mental');

      const content = data.mind_map || { title: form.title, nodes: [form.title], children: [] };
      const { data: saved, error: saveError } = await supabase.from('mind_maps').insert({
        user_id: user.id,
        title: form.title,
        content,
        source_text: form.text,
        subject_id: form.subject_id || null,
      }).select().single();

      if (saveError) throw new Error(saveError.message);
      if (saved) {
        setMaps(prev => [saved, ...prev]);
        setSelectedMap(saved);
        setShowForm(false);
        setForm({ title: '', text: '', subject_id: '' });
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Erro ao gerar mapa mental. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const deleteMap = async (id: string) => {
    await supabase.from('mind_maps').delete().eq('id', id);
    setMaps(prev => prev.filter(m => m.id !== id));
    if (selectedMap?.id === id) setSelectedMap(null);
    setDeleteConfirm(null);
  };

  const MindMapViz = ({ content }: { content: MindMapNode }) => {
    const centerColor = '#1E3A8A';
    const branchColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#EC4899'];

    return (
      <div
        className="p-6 overflow-auto min-h-[300px] flex items-start justify-center"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
      >
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
          <div className="px-6 py-3 rounded-2xl text-white font-bold text-base font-manrope shadow-lg text-center" style={{ backgroundColor: centerColor, maxWidth: '300px' }}>
            {content.title || content.nodes?.[0] || 'Mapa Mental'}
          </div>

          {content.children && content.children.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
              {content.children.map((branch, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm text-center shadow" style={{ backgroundColor: branchColors[i % branchColors.length] }}>
                    {branch.label}
                  </div>
                  {branch.items && branch.items.map((item, j) => (
                    <div key={j} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-700 border text-center" style={{ borderColor: branchColors[i % branchColors.length] + '60', backgroundColor: branchColors[i % branchColors.length] + '10' }}>
                      {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : content.nodes && content.nodes.length > 1 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {content.nodes.slice(1).map((node, i) => (
                <div key={i} className="px-4 py-2.5 rounded-xl text-white font-medium text-sm text-center shadow" style={{ backgroundColor: branchColors[i % branchColors.length] }}>
                  {node}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-map-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 id="delete-map-title" className="font-bold text-gray-900 font-manrope mb-2">Excluir mapa mental?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={() => deleteMap(deleteConfirm)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Mapas Mentais</h2>
          <p className="section-subtitle">{maps.length} {maps.length === 1 ? 'mapa criado' : 'mapas criados'}</p>
        </div>
        <button onClick={() => { setShowForm(true); setGenerateError(''); }} className="btn-primary text-sm w-fit" aria-label="Criar novo mapa mental">
          <Plus size={14} aria-hidden="true" />
          Criar mapa mental
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 font-jakarta">Gerar mapa mental com IA</h3>
            <button onClick={() => { setShowForm(false); setGenerateError(''); }} className="text-gray-400 hover:text-gray-600" aria-label="Fechar formulário"><X size={16} /></button>
          </div>
          {generateError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4" role="alert">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{generateError}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="mm-title">Título *</label>
              <input id="mm-title" type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Revolução Francesa" className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="mm-text">Conteúdo para gerar o mapa *</label>
              <textarea
                id="mm-text"
                value={form.text}
                onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                placeholder="Cole um texto, lista de tópicos ou um resumo para gerar o mapa mental..."
                rows={5}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label" htmlFor="mm-subject">Matéria (opcional)</label>
              <select id="mm-subject" value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} className="input-field">
                <option value="">Sem matéria</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setGenerateError(''); }} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={generateMap} disabled={!form.title.trim() || !form.text.trim() || generating} className="btn-primary text-sm">
                {generating ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" />Gerando...</> : 'Gerar mapa mental'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Map list */}
        <div className="lg:col-span-1 space-y-2" role="list" aria-label="Lista de mapas mentais">
          {maps.length === 0 ? (
            <div className="card p-8 text-center">
              <GitBranch size={32} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-gray-500">Nenhum mapa criado ainda</p>
            </div>
          ) : (
            maps.map(map => {
              const sub = subjects.find(s => s.id === map.subject_id);
              return (
                <div
                  key={map.id}
                  role="listitem"
                  className={`card p-4 cursor-pointer group transition-all ${selectedMap?.id === map.id ? 'border-primary-400 bg-primary-50' : 'hover:border-gray-300'}`}
                  onClick={() => setSelectedMap(map)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedMap(map)}
                  aria-label={`Mapa: ${map.title}${selectedMap?.id === map.id ? ' (selecionado)' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sub && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} aria-hidden="true" />}
                        <span className="text-sm font-medium text-gray-900 truncate">{map.title}</span>
                      </div>
                      <time className="text-xs text-gray-400" dateTime={map.created_at}>
                        {new Date(map.created_at).toLocaleDateString('pt-BR')}
                      </time>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(map.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 flex-shrink-0 transition-all"
                      aria-label={`Excluir mapa: ${map.title}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map visualization */}
        <div className="lg:col-span-2">
          {selectedMap ? (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 font-jakarta text-sm">{selectedMap.title}</h3>
                <div className="flex gap-1" role="group" aria-label="Controles de zoom">
                  <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="btn-ghost p-2" aria-label="Diminuir zoom"><ZoomOut size={14} /></button>
                  <button onClick={() => setZoom(1)} className="btn-ghost px-2 py-1 text-xs" aria-label="Redefinir zoom">{Math.round(zoom * 100)}%</button>
                  <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="btn-ghost p-2" aria-label="Aumentar zoom"><ZoomIn size={14} /></button>
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden" style={{ minHeight: '400px' }}>
                <MindMapViz content={selectedMap.content as unknown as MindMapNode} />
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center h-full flex flex-col items-center justify-center">
              <GitBranch size={36} className="text-gray-300 mb-3" aria-hidden="true" />
              <p className="text-sm text-gray-500">Selecione um mapa para visualizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
