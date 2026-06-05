import { useState, useEffect, useId } from 'react';
import { Loader2, Save, Check, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { applyAccessibilityToDOM } from '../../contexts/AuthContext';
import type { AccessibilitySettings } from '../../lib/types';

const DEFAULTS: Partial<AccessibilitySettings> = {
  dyslexia_mode: false,
  open_dyslexic_font: false,
  reading_ruler: false,
  syllable_highlight: false,
  text_to_speech: false,
  background_color: 'white',
  adhd_mode: false,
  tea_mode: false,
  reduce_animations: false,
  font_size: 'medium',
  line_spacing: 'normal',
  contrast_mode: 'normal',
};

interface ToggleProps {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, desc, checked, onChange }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">{label}</label>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-primary-500 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
        aria-label={label}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

interface RadioGroupProps {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}

function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  const groupId = useId();
  return (
    <fieldset className="py-4 border-b border-gray-100 last:border-0">
      <legend className="text-sm font-medium text-gray-900 mb-3" id={groupId}>{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={groupId}>
        {options.map(([val, lbl]) => (
          <button
            key={val}
            role="radio"
            aria-checked={value === val}
            onClick={() => onChange(val)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all focus-visible:outline-2 focus-visible:outline-primary-500 ${
              value === val
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function AccessibilityPage() {
  const { user, accessibilitySettings, refreshAccessibility } = useAuth();
  const [settings, setSettings] = useState<Partial<AccessibilitySettings>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (accessibilitySettings) setSettings(accessibilitySettings);
  }, [accessibilitySettings]);

  const update = (key: keyof AccessibilitySettings, value: unknown) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaved(false);
    applyAccessibilityToDOM(next as AccessibilitySettings);
  };

  const resetDefaults = () => {
    setSettings(DEFAULTS);
    setSaved(false);
    applyAccessibilityToDOM(DEFAULTS as AccessibilitySettings);
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from('accessibility_settings').update({
      ...settings,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
    await refreshAccessibility();
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const s = settings;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Acessibilidade</h2>
          <p className="section-subtitle">Configure a interface para melhor atender suas necessidades</p>
        </div>
        <button onClick={resetDefaults} className="btn-ghost text-xs w-fit flex-shrink-0" aria-label="Redefinir configurações padrão">
          <RotateCcw size={13} />
          Redefinir padrões
        </button>
      </div>

      {/* Dyslexia mode */}
      <section className="card p-5" aria-labelledby="dyslexia-heading">
        <h3 id="dyslexia-heading" className="font-semibold text-gray-900 font-jakarta flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
          Modo Dislexia
        </h3>
        <p className="text-xs text-gray-400 mb-4">Configurações recomendadas para pessoas com dislexia</p>
        <Toggle
          label="Ativar Modo Dislexia"
          desc="Habilita todas as configurações recomendadas"
          checked={s.dyslexia_mode || false}
          onChange={v => update('dyslexia_mode', v)}
        />
        <Toggle
          label="Fonte OpenDyslexic"
          desc="Fonte especialmente desenvolvida para facilitar a leitura"
          checked={s.open_dyslexic_font || false}
          onChange={v => update('open_dyslexic_font', v)}
        />
        <Toggle
          label="Régua de leitura"
          desc="Linha de destaque que acompanha o movimento do mouse"
          checked={s.reading_ruler || false}
          onChange={v => update('reading_ruler', v)}
        />
        <Toggle
          label="Destaque de sílabas"
          desc="Sílabas alternadas em cores diferentes para facilitar a decodificação"
          checked={s.syllable_highlight || false}
          onChange={v => update('syllable_highlight', v)}
        />
        <Toggle
          label="Leitura em voz alta"
          desc="Texto é lido em voz alta pelo sintetizador de voz"
          checked={s.text_to_speech || false}
          onChange={v => update('text_to_speech', v)}
        />
        <RadioGroup
          label="Cor de fundo"
          options={[['white', 'Branco'], ['cream', 'Creme'], ['dark', 'Escuro']]}
          value={s.background_color || 'white'}
          onChange={v => update('background_color', v)}
        />
      </section>

      {/* ADHD mode */}
      <section className="card p-5" aria-labelledby="adhd-heading">
        <h3 id="adhd-heading" className="font-semibold text-gray-900 font-jakarta flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
          Modo TDAH
        </h3>
        <p className="text-xs text-gray-400 mb-4">Configurações para gerenciamento de atenção e foco</p>
        <Toggle
          label="Ativar Modo TDAH"
          desc="Habilita divisão de conteúdo e ferramentas de foco"
          checked={s.adhd_mode || false}
          onChange={v => update('adhd_mode', v)}
        />
      </section>

      {/* TEA mode */}
      <section className="card p-5" aria-labelledby="tea-heading">
        <h3 id="tea-heading" className="font-semibold text-gray-900 font-jakarta flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
          Modo TEA
        </h3>
        <p className="text-xs text-gray-400 mb-4">Interface previsível e redução de estímulos visuais</p>
        <Toggle
          label="Ativar Modo TEA"
          desc="Interface mais estruturada e previsível"
          checked={s.tea_mode || false}
          onChange={v => update('tea_mode', v)}
        />
        <Toggle
          label="Reduzir animações"
          desc="Remove transições e animações da interface"
          checked={s.reduce_animations || false}
          onChange={v => update('reduce_animations', v)}
        />
      </section>

      {/* General preferences */}
      <section className="card p-5" aria-labelledby="general-heading">
        <h3 id="general-heading" className="font-semibold text-gray-900 font-jakarta mb-4">Preferências gerais</h3>
        <RadioGroup
          label="Tamanho do texto"
          options={[['small', 'Pequeno'], ['medium', 'Normal'], ['large', 'Grande'], ['xlarge', 'Extra grande']]}
          value={s.font_size || 'medium'}
          onChange={v => update('font_size', v)}
        />
        <RadioGroup
          label="Espaçamento entre linhas"
          options={[['normal', 'Normal'], ['relaxed', 'Relaxado'], ['loose', 'Amplo']]}
          value={s.line_spacing || 'normal'}
          onChange={v => update('line_spacing', v)}
        />
        <RadioGroup
          label="Contraste"
          options={[['normal', 'Normal'], ['high', 'Alto contraste']]}
          value={s.contrast_mode || 'normal'}
          onChange={v => update('contrast_mode', v)}
        />
      </section>

      <button
        onClick={save}
        disabled={loading}
        className="btn-primary w-full justify-center py-3 text-sm"
        aria-label="Salvar configurações de acessibilidade"
      >
        {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : saved ? <Check size={15} aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
        {saved ? 'Configurações salvas' : 'Salvar configurações'}
      </button>
    </div>
  );
}
