import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, ImageIcon, Type, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, CreditCard, GitBranch } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type InputMode = 'text' | 'image' | 'pdf';

interface ScanResult {
  summary: string;
  simplified_text: string;
  exercises: Array<{ question: string; answer: string }>;
  flashcards: Array<{ front: string; back: string }>;
  mind_map: { title: string; nodes: string[]; children?: { label: string; items: string[] }[] };
}

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

export default function NeuroScanner() {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [savedFlashcards, setSavedFlashcards] = useState(false);
  const [savedMindMap, setSavedMindMap] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_BYTES) return `Arquivo muito grande. Tamanho máximo: 20 MB.`;
    if (mode === 'image' && !f.type.startsWith('image/')) return 'Selecione uma imagem (JPG, PNG, WEBP).';
    if (mode === 'pdf' && f.type !== 'application/pdf') return 'Selecione um arquivo PDF.';
    return null;
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    const err = validateFile(dropped);
    if (err) { setError(err); return; }
    setFile(dropped);
    setError('');
  }, [mode]);

  const uploadFile = async (f: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');
    const ext = f.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('neurostudy-uploads')
      .upload(path, f, { contentType: f.type, upsert: false });
    if (error) throw new Error(`Upload falhou: ${error.message}`);
    const { data } = supabase.storage.from('neurostudy-uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleProcess = async () => {
    if (!user) return;
    if (mode === 'text' && !text.trim()) { setError('Cole ou digite um texto para analisar.'); return; }
    if ((mode === 'image' || mode === 'pdf') && !file) { setError('Selecione um arquivo.'); return; }
    if (!title.trim()) { setError('Informe um título para este conteúdo.'); return; }

    setProcessing(true);
    setError('');
    setResult(null);
    setSavedFlashcards(false);
    setSavedMindMap(false);

    try {
      let content = text;
      let fileUrl: string | undefined;

      // Upload file if provided
      if (file && (mode === 'image' || mode === 'pdf')) {
        setUploadProgress(10);
        fileUrl = await uploadFile(file);
        setUploadProgress(40);
        content = `[Arquivo: ${file.name}]`;
      }

      const { data: scanData, error: insertError } = await supabase
        .from('neuroscans')
        .insert({
          user_id: user.id,
          title,
          original_content: content,
          file_url: fileUrl || null,
          file_type: mode,
          processing_status: 'processing',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setUploadProgress(50);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/neuroscanner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title,
          neuroscanId: scanData.id,
          fileUrl,
          fileType: mode,
        }),
      });

      setUploadProgress(90);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setResult(data);
      setUploadProgress(100);

      await supabase.from('neuroscans').update({
        summary: data.summary,
        simplified_text: data.simplified_text,
        exercises: data.exercises || [],
        processing_status: 'completed',
      }).eq('id', scanData.id);

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao processar';
      setError(`Erro: ${msg}. Verifique sua conexão e tente novamente.`);
      console.error(e);
    } finally {
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const saveFlashcards = async () => {
    if (!user || !result?.flashcards?.length) return;
    await supabase.from('flashcards').insert(
      result.flashcards.map(fc => ({
        user_id: user.id,
        front: fc.front,
        back: fc.back,
        difficulty: 'medium' as const,
      }))
    );
    setSavedFlashcards(true);
  };

  const saveMindMap = async () => {
    if (!user || !result?.mind_map) return;
    await supabase.from('mind_maps').insert({
      user_id: user.id,
      title: result.mind_map.title || title,
      content: result.mind_map,
      source_text: text || null,
    });
    setSavedMindMap(true);
  };

  const Section = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        aria-expanded={expandedSection === id}
        aria-controls={`section-${id}`}
      >
        <span className="font-semibold text-gray-900 text-sm font-jakarta">{label}</span>
        {expandedSection === id
          ? <ChevronUp size={15} className="text-gray-400" aria-hidden="true" />
          : <ChevronDown size={15} className="text-gray-400" aria-hidden="true" />}
      </button>
      {expandedSection === id && (
        <div id={`section-${id}`} className="px-5 pb-5 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="section-title">NeuroScanner</h2>
        <p className="section-subtitle">Envie qualquer conteúdo e receba um resumo adaptado, exercícios e mais</p>
      </div>

      <div className="card p-5 sm:p-6">
        {/* Mode selector */}
        <div role="group" aria-label="Tipo de entrada" className="flex gap-1.5 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
          {([
            ['text', 'Texto', Type],
            ['image', 'Imagem', ImageIcon],
            ['pdf', 'PDF', FileText],
          ] as [InputMode, string, typeof Type][]).map(([m, l, Icon]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setFile(null); setText(''); setError(''); setResult(null); }}
              aria-pressed={mode === m}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="scan-title" className="label">Título do conteúdo *</label>
            <input
              id="scan-title"
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="Ex: Fotossíntese — Biologia 9º ano"
              className="input-field"
            />
          </div>

          {mode === 'text' ? (
            <div>
              <label htmlFor="scan-content" className="label">Conteúdo *</label>
              <textarea
                id="scan-content"
                value={text}
                onChange={e => { setText(e.target.value); setError(''); }}
                placeholder="Cole aqui o texto do livro, apostila ou qualquer conteúdo que deseja analisar..."
                rows={8}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1" aria-live="polite">{text.length} caracteres</p>
            </div>
          ) : (
            <div>
              <label className="label">{mode === 'image' ? 'Imagem (JPG, PNG, WEBP)' : 'Arquivo PDF'} *</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleFileDrop}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                role="button"
                aria-label={`Clique ou arraste para selecionar ${mode === 'image' ? 'uma imagem' : 'um PDF'}`}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-primary-400 bg-primary-50'
                    : dragging
                    ? 'border-primary-400 bg-primary-50 scale-[1.01]'
                    : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle size={28} className="text-primary-600" aria-hidden="true" />
                    <span className="text-sm font-medium text-primary-700">{file.name}</span>
                    <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium mt-1"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={28} className="text-gray-400" aria-hidden="true" />
                    <span className="text-sm text-gray-600">Clique para selecionar ou arraste o arquivo</span>
                    <span className="text-xs text-gray-400">{mode === 'image' ? 'JPG, PNG, WEBP — máx. 10 MB' : 'PDF — máx. 20 MB'}</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={mode === 'image' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'}
                className="hidden"
                aria-hidden="true"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const err = validateFile(f);
                  if (err) { setError(err); return; }
                  setFile(f);
                  setError('');
                }}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {processing && uploadProgress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Processando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progresso do processamento"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={processing}
            className="btn-primary w-full justify-center py-3 text-sm"
            aria-busy={processing}
          >
            {processing
              ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />Analisando conteúdo...</>
              : 'Analisar com IA'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-fade-in" aria-label="Resultados da análise">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-700">Análise concluída</span>
          </div>

          <Section id="summary" label="Resumo">
            <p className="text-sm text-gray-700 leading-relaxed mt-3 whitespace-pre-wrap">{result.summary}</p>
          </Section>

          <Section id="simplified" label="Texto Simplificado">
            <p className="text-sm text-gray-700 leading-relaxed mt-3 whitespace-pre-wrap">{result.simplified_text}</p>
          </Section>

          <Section id="exercises" label={`Exercícios (${result.exercises?.length || 0})`}>
            <div className="mt-3 space-y-4">
              {result.exercises?.map((ex, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-900 mb-2">{i + 1}. {ex.question}</p>
                  <details>
                    <summary className="text-xs text-primary-600 cursor-pointer font-medium hover:text-primary-700 w-fit">
                      Ver resposta
                    </summary>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{ex.answer}</p>
                  </details>
                </div>
              ))}
            </div>
          </Section>

          <Section id="flashcards" label={`Flashcards (${result.flashcards?.length || 0})`}>
            <div className="mt-3 space-y-2">
              {result.flashcards?.map((fc, i) => (
                <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{fc.front}</p>
                  <p className="text-sm text-gray-500 mt-1">{fc.back}</p>
                </div>
              ))}
              {(result.flashcards?.length || 0) > 0 && !savedFlashcards && (
                <button onClick={saveFlashcards} className="btn-secondary w-full justify-center text-sm mt-2">
                  <CreditCard size={14} aria-hidden="true" />
                  Salvar flashcards na coleção
                </button>
              )}
              {savedFlashcards && (
                <div className="flex items-center gap-2 text-sm text-green-700 justify-center py-2" role="status">
                  <CheckCircle size={14} aria-hidden="true" />
                  Flashcards salvos com sucesso
                </div>
              )}
            </div>
          </Section>

          <Section id="mindmap" label="Mapa Mental">
            <div className="mt-3">
              <div className="text-center mb-4">
                <h4 className="font-semibold text-gray-900 font-jakarta">{result.mind_map?.title}</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {result.mind_map?.nodes?.map((node, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-sm font-medium text-center ${
                      i === 0 ? 'bg-primary-100 text-primary-800 col-span-2' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {node}
                  </div>
                ))}
              </div>
              {!savedMindMap && (
                <button onClick={saveMindMap} className="btn-secondary w-full justify-center text-sm mt-3">
                  <GitBranch size={14} aria-hidden="true" />
                  Salvar mapa mental
                </button>
              )}
              {savedMindMap && (
                <div className="flex items-center gap-2 text-sm text-green-700 justify-center py-2 mt-2" role="status">
                  <CheckCircle size={14} aria-hidden="true" />
                  Mapa mental salvo
                </div>
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
