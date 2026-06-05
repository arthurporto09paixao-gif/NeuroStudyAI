import { useState } from 'react';
import { Brain, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'profile', title: 'Perfil de estudo', desc: 'Nos ajude a personalizar sua experiencia' },
  { id: 'neurodivergence', title: 'Perfil cognitivo', desc: 'Selecione o que se aplica a voce' },
  { id: 'preferences', title: 'Como voce aprende', desc: 'Escolha seus metodos preferidos de estudo' },
  { id: 'complete', title: 'Tudo pronto', desc: 'Sua plataforma esta configurada' },
];

const GRADES = [
  'Ensino Fundamental I (1-5)', 'Ensino Fundamental II (6-9)',
  '1 ano do Ensino Medio', '2 ano do Ensino Medio', '3 ano do Ensino Medio',
  'Ensino Superior', 'Pos-graduacao', 'Concursos Publicos', 'Outro',
];

const NEURODIVERGENCES = [
  { id: 'dyslexia', label: 'Dislexia', desc: 'Dificuldade com leitura e escrita' },
  { id: 'adhd', label: 'TDAH', desc: 'Deficit de atencao e hiperatividade' },
  { id: 'tea', label: 'TEA', desc: 'Transtorno do Espectro Autista' },
  { id: 'dyscalculia', label: 'Discalculia', desc: 'Dificuldade com numeros e matematica' },
  { id: 'other', label: 'Outra', desc: 'Outra dificuldade de aprendizagem' },
  { id: 'prefer_not', label: 'Prefiro nao informar', desc: '' },
];

const LEARNING_PREFS = [
  { id: 'videos', label: 'Videos', icon: '▶' },
  { id: 'audio', label: 'Audios', icon: '🎧' },
  { id: 'images', label: 'Imagens e Infograficos', icon: '🖼' },
  { id: 'exercises', label: 'Exercicios Praticos', icon: '✏' },
  { id: 'mind_maps', label: 'Mapas Mentais', icon: '🧠' },
  { id: 'flashcards', label: 'Flashcards', icon: '🗃' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    age: '',
    grade: '',
    course: '',
    neurodivergences: [] as string[],
    learning_preferences: [] as string[],
  });

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const canProceed = () => {
    if (step === 0) return data.grade !== '';
    if (step === 1) return data.neurodivergences.length > 0;
    if (step === 2) return data.learning_preferences.length > 0;
    return true;
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any).update({
      full_name: data.name || undefined,
      age: data.age ? parseInt(data.age) : undefined,
      grade: data.grade,
      course: data.course || undefined,
      neurodivergences: data.neurodivergences,
      learning_preferences: data.learning_preferences,
      onboarding_completed: true,
    }).eq('id', user.id);

    const settingsUpdate = {
      dyslexia_mode: data.neurodivergences.includes('dyslexia'),
      adhd_mode: data.neurodivergences.includes('adhd'),
      tea_mode: data.neurodivergences.includes('tea'),
      ...(data.neurodivergences.includes('dyslexia') ? {
        reading_ruler: true,
        line_spacing: 'relaxed' as const,
        background_color: 'cream' as const,
      } : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('accessibility_settings') as any).update(settingsUpdate).eq('user_id', user.id);
    await refreshProfile();
    setLoading(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
              <Brain size={17} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 font-manrope">NeuroStudy AI</span>
          </div>
          <div
            className="flex items-center justify-center gap-1.5 mt-4"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label={`Etapa ${step + 1} de ${STEPS.length}`}
          >
            {STEPS.map((_s, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-primary-600 w-8' : i === step ? 'bg-primary-600 w-8' : 'bg-gray-200 w-4'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Etapa {step + 1} de {STEPS.length}</p>
        </div>

        <div className="card p-7 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 font-manrope mb-1">{STEPS[step].title}</h2>
          <p className="text-sm text-gray-500 mb-6">{STEPS[step].desc}</p>

          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Nome (opcional)</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Como prefere ser chamado(a)"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Idade</label>
                  <input
                    type="number"
                    value={data.age}
                    onChange={e => setData(p => ({ ...p, age: e.target.value }))}
                    placeholder="Ex: 16"
                    min="5"
                    max="80"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Curso / Disciplina</label>
                  <input
                    type="text"
                    value={data.course}
                    onChange={e => setData(p => ({ ...p, course: e.target.value }))}
                    placeholder="Ex: Medicina"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label">Serie / Nivel de ensino *</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto">
                  {GRADES.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setData(p => ({ ...p, grade: g }))}
                      className={`text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        data.grade === g
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Neurodivergences */}
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">Selecione todas que se aplicam. Esta informacao e usada somente para personalizar sua experiencia.</p>
              {NEURODIVERGENCES.map(nd => (
                <button
                  key={nd.id}
                  type="button"
                  onClick={() => {
                    if (nd.id === 'prefer_not') {
                      setData(p => ({ ...p, neurodivergences: ['prefer_not'] }));
                    } else {
                      const next = toggleItem(data.neurodivergences.filter(n => n !== 'prefer_not'), nd.id);
                      setData(p => ({ ...p, neurodivergences: next }));
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                    data.neurodivergences.includes(nd.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <div className={`font-medium text-sm ${data.neurodivergences.includes(nd.id) ? 'text-primary-700' : 'text-gray-800'}`}>{nd.label}</div>
                    {nd.desc && <div className="text-xs text-gray-400 mt-0.5">{nd.desc}</div>}
                  </div>
                  {data.neurodivergences.includes(nd.id) && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Learning preferences */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {LEARNING_PREFS.map(lp => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => setData(p => ({ ...p, learning_preferences: toggleItem(p.learning_preferences, lp.id) }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                    data.learning_preferences.includes(lp.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl" role="img">{lp.icon}</span>
                  <span className={`text-sm font-medium ${data.learning_preferences.includes(lp.id) ? 'text-primary-700' : 'text-gray-700'}`}>{lp.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-primary-700" />
              </div>
              <h3 className="font-bold text-gray-900 font-manrope text-lg mb-2">Configuracao concluida</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Sua plataforma foi configurada com base no seu perfil de aprendizagem. Voce pode ajustar qualquer configuracao a qualquer momento nas Configuracoes de Acessibilidade.
              </p>
              <div className="text-left space-y-2">
                {data.neurodivergences.filter(n => n !== 'prefer_not').map(nd => {
                  const item = NEURODIVERGENCES.find(n => n.id === nd);
                  return item ? (
                    <div key={nd} className="flex items-center gap-2.5 px-3 py-2 bg-primary-50 rounded-lg">
                      <Check size={13} className="text-primary-600" />
                      <span className="text-sm text-primary-700 font-medium">Modo {item.label} ativado</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleComplete} disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Acessar a plataforma'}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
