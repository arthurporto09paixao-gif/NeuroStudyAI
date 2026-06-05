import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Timer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FocusModeProps {
  onClose: () => void;
}

type NoiseType = 'brown' | 'white' | 'pink' | 'off';
type Phase = 'work' | 'shortBreak' | 'longBreak';

const PHASE_CONFIG: Record<Phase, { label: string; minutes: number; color: string }> = {
  work:       { label: 'Foco',         minutes: 25, color: '#1E3A8A' },
  shortBreak: { label: 'Pausa curta',  minutes: 5,  color: '#10B981' },
  longBreak:  { label: 'Pausa longa',  minutes: 15, color: '#F59E0B' },
};

function createBrownNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createWhiteNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createPinkNoise(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

export default function FocusMode({ onClose }: FocusModeProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PHASE_CONFIG.work.minutes * 60);
  const [noise, setNoise] = useState<NoiseType>('brown');
  const [volume, setVolume] = useState(0.4);
  const [customMinutes, setCustomMinutes] = useState<Record<Phase, number>>({
    work: 25, shortBreak: 5, longBreak: 15,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  const startNoise = useCallback((type: NoiseType, vol: number) => {
    stopNoise();
    if (type === 'off') return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const source = type === 'brown' ? createBrownNoise(ctx)
      : type === 'white' ? createWhiteNoise(ctx)
      : createPinkNoise(ctx);
    source.connect(gain);
    source.start();
    sourceRef.current = source;
  }, []);

  const stopNoise = () => {
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} sourceRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    gainRef.current = null;
  };

  useEffect(() => {
    if (running && noise !== 'off') {
      startNoise(noise, volume);
    } else {
      stopNoise();
    }
    return stopNoise;
  }, [running, noise]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    setSecondsLeft(customMinutes[phase] * 60);
    setRunning(false);
  }, [phase, customMinutes]);

  useEffect(() => {
    if (!running) return;
    if (!sessionStartRef.current) sessionStartRef.current = new Date();
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval);
          handlePhaseComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, phase]);

  const handlePhaseComplete = async () => {
    setRunning(false);
    stopNoise();

    if (phase === 'work' && user && sessionStartRef.current) {
      const duration = customMinutes.work;
      await supabase.from('study_sessions').insert({
        user_id: user.id,
        session_type: 'pomodoro',
        duration_minutes: duration,
        started_at: sessionStartRef.current.toISOString(),
        ended_at: new Date().toISOString(),
        notes: 'Sessão Pomodoro — Modo Foco',
      });
      sessionStartRef.current = null;
    }

    const newCount = phase === 'work' ? pomodoroCount + 1 : pomodoroCount;
    if (phase === 'work') {
      setPomodoroCount(newCount);
      setPhase(newCount % 4 === 0 ? 'longBreak' : 'shortBreak');
    } else {
      setPhase('work');
    }
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(customMinutes[phase] * 60);
    sessionStartRef.current = null;
    stopNoise();
  };

  const toggleRun = () => {
    if (!running) sessionStartRef.current = new Date();
    setRunning(r => !r);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const total = customMinutes[phase] * 60;
  const progress = ((total - secondsLeft) / total) * 100;
  const phaseConf = PHASE_CONFIG[phase];
  const circumference = 2 * Math.PI * 54;

  const NOISE_OPTIONS: { id: NoiseType; label: string }[] = [
    { id: 'brown', label: 'Marrom' },
    { id: 'white', label: 'Branco' },
    { id: 'pink', label: 'Rosa' },
    { id: 'off', label: 'Desligado' },
  ];

  useEffect(() => () => stopNoise(), []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-mode-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-primary-600" aria-hidden="true" />
            <h2 id="focus-mode-title" className="font-semibold text-gray-900 font-jakarta">Modo Foco</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Fechar modo foco">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Phase selector */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl" role="tablist" aria-label="Fases do Pomodoro">
            {(Object.keys(PHASE_CONFIG) as Phase[]).map(p => (
              <button
                key={p}
                role="tab"
                aria-selected={phase === p}
                onClick={() => setPhase(p)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${phase === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {PHASE_CONFIG[p].label}
              </button>
            ))}
          </div>

          {/* Timer circle */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-36 h-36" aria-label={`Tempo restante: ${minutes}m ${seconds}s`}>
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={phaseConf.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 font-manrope tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400">{phaseConf.label}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Reiniciar timer"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={toggleRun}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-medium transition-all active:scale-95 hover:opacity-90"
                style={{ backgroundColor: phaseConf.color }}
                aria-label={running ? 'Pausar timer' : 'Iniciar timer'}
                aria-pressed={running}
              >
                {running ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <div className="p-2.5 rounded-xl w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <div className="text-xs text-center text-gray-500">
                  <span className="font-bold text-gray-900">{pomodoroCount}</span>
                  <br />🍅
                </div>
              </div>
            </div>
          </div>

          {/* Noise controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {noise !== 'off' ? <Volume2 size={15} className="text-gray-500" /> : <VolumeX size={15} className="text-gray-400" />}
                <span className="text-sm font-medium text-gray-700">Ruído de fundo</span>
              </div>
            </div>
            <div className="flex gap-1.5" role="radiogroup" aria-label="Tipo de ruído">
              {NOISE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={noise === opt.id}
                  onClick={() => setNoise(opt.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${noise === opt.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {noise !== 'off' && (
              <div className="flex items-center gap-3">
                <VolumeX size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-primary-600"
                  aria-label="Volume do ruído"
                />
                <Volume2 size={13} className="text-gray-400 flex-shrink-0" />
              </div>
            )}
          </div>

          {/* Custom durations */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duração (minutos)</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PHASE_CONFIG) as Phase[]).map(p => (
                <div key={p}>
                  <label className="text-xs text-gray-500 block mb-1">{PHASE_CONFIG[p].label}</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={customMinutes[p]}
                    onChange={e => setCustomMinutes(prev => ({ ...prev, [p]: parseInt(e.target.value) || 1 }))}
                    className="input-field py-1.5 text-sm text-center"
                    aria-label={`Duração da fase ${PHASE_CONFIG[p].label}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
