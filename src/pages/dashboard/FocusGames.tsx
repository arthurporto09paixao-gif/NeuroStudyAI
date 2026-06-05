import { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2, Trophy, RotateCcw, ChevronRight, CheckCircle, XCircle, Wind } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type GameId = 'sequence' | 'wordmatch' | 'breathing';

interface GameScore {
  gameId: GameId;
  score: number;
  date: string;
}

// ─── Sequence Memory ────────────────────────────────────────────────────────
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const COLOR_NAMES = ['Azul', 'Verde', 'Amarelo', 'Vermelho'];

function SequenceGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<'watch' | 'input' | 'result'>('watch');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [failed, setFailed] = useState(false);

  const showSequence = useCallback((seq: number[]) => {
    let i = 0;
    const interval = setInterval(() => {
      setActiveIdx(seq[i]);
      setTimeout(() => setActiveIdx(null), 500);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => setPhase('input'), 700);
      }
    }, 900);
  }, []);

  const startLevel = useCallback((lvl: number) => {
    const newSeq = Array.from({ length: lvl + 2 }, () => Math.floor(Math.random() * 4));
    setSequence(newSeq);
    setPlayerSeq([]);
    setPhase('watch');
    setTimeout(() => showSequence(newSeq), 800);
  }, [showSequence]);

  useEffect(() => { startLevel(1); }, [startLevel]);

  const handlePress = (idx: number) => {
    if (phase !== 'input') return;
    const next = [...playerSeq, idx];
    setPlayerSeq(next);
    const pos = next.length - 1;
    if (next[pos] !== sequence[pos]) {
      setFailed(true);
      setPhase('result');
      return;
    }
    if (next.length === sequence.length) {
      setPhase('result');
    }
  };

  const handleNext = () => {
    if (failed) {
      onFinish(level - 1);
    } else {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      startLevel(nextLvl);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-500 mb-1">Nível {level}</div>
        <div className="text-xs text-gray-400">
          {phase === 'watch' ? 'Observe a sequência...' : phase === 'input' ? `Repita a sequência (${playerSeq.length}/${sequence.length})` : failed ? 'Errou! Tente novamente' : 'Correto! Próximo nível?'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {COLORS.map((color, i) => (
          <button
            key={i}
            onClick={() => handlePress(i)}
            disabled={phase !== 'input'}
            className="w-28 h-28 rounded-2xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-gray-500 disabled:cursor-default"
            style={{
              backgroundColor: color,
              opacity: activeIdx === i ? 1 : phase === 'input' ? 0.85 : 0.5,
              transform: activeIdx === i ? 'scale(1.06)' : 'scale(1)',
              boxShadow: activeIdx === i ? `0 0 24px ${color}80` : undefined,
            }}
            aria-label={COLOR_NAMES[i]}
          />
        ))}
      </div>
      {phase === 'result' && (
        <button onClick={handleNext} className="btn-primary text-sm mt-2">
          {failed ? <><RotateCcw size={14} />Recomeçar</> : <><ChevronRight size={14} />Próximo nível</>}
        </button>
      )}
    </div>
  );
}

// ─── Word Match ─────────────────────────────────────────────────────────────
const WORD_PAIRS = [
  ['Fotossíntese', 'Produção de energia nas plantas com luz solar'],
  ['Mitose', 'Divisão celular que gera células idênticas'],
  ['Osmose', 'Movimento de água por membrana semipermeável'],
  ['DNA', 'Molécula que carrega informação genética'],
  ['Neurônio', 'Célula do sistema nervoso'],
  ['Enzima', 'Proteína que acelera reações químicas'],
];

function WordMatchGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [pairs] = useState(() => {
    const shuffled = [...WORD_PAIRS].sort(() => Math.random() - 0.5).slice(0, 4);
    return shuffled;
  });
  const [selected, setSelected] = useState<{ type: 'word' | 'def'; idx: number } | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const words = pairs.map(p => p[0]);
  const defs = useState(() => [...pairs.map(p => p[1])].sort(() => Math.random() - 0.5))[0];

  const handleSelect = (type: 'word' | 'def', idx: number) => {
    if (!selected) {
      setSelected({ type, idx });
      return;
    }
    if (selected.type === type) {
      setSelected({ type, idx });
      return;
    }
    const wordIdx = type === 'word' ? idx : selected.idx;
    const defIdx = type === 'def' ? idx : selected.idx;
    const word = words[wordIdx];
    const def = defs[defIdx];
    const correctPair = pairs.find(p => p[0] === word && p[1] === def);
    if (correctPair) {
      const newMatched = [...matched, wordIdx];
      setMatched(newMatched);
      if (newMatched.length === pairs.length) {
        setTimeout(() => onFinish(Math.max(0, pairs.length - errors) * 25), 600);
      }
    } else {
      setErrors(e => e + 1);
    }
    setSelected(null);
  };

  const isMatchedWord = (i: number) => matched.includes(i);
  const isMatchedDef = (i: number) => {
    const def = defs[i];
    const pair = pairs.find(p => p[1] === def);
    return pair ? matched.includes(pairs.indexOf(pair)) : false;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{matched.length}/{pairs.length} pares encontrados</span>
        <span className="text-red-500">{errors} erros</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Termos</p>
          {words.map((word, i) => (
            <button
              key={i}
              onClick={() => !isMatchedWord(i) && handleSelect('word', i)}
              disabled={isMatchedWord(i)}
              className={`w-full p-3 rounded-xl text-sm text-left font-medium border transition-all ${
                isMatchedWord(i) ? 'bg-green-50 border-green-300 text-green-700 cursor-default' :
                selected?.type === 'word' && selected.idx === i ? 'border-primary-500 bg-primary-50 text-primary-700' :
                'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {word}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Definições</p>
          {defs.map((def, i) => (
            <button
              key={i}
              onClick={() => !isMatchedDef(i) && handleSelect('def', i)}
              disabled={isMatchedDef(i)}
              className={`w-full p-3 rounded-xl text-xs text-left border transition-all ${
                isMatchedDef(i) ? 'bg-green-50 border-green-300 text-green-700 cursor-default' :
                selected?.type === 'def' && selected.idx === i ? 'border-primary-500 bg-primary-50 text-primary-700' :
                'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {def}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Breathing Exercise ──────────────────────────────────────────────────────
const PHASES = [
  { label: 'Inspire', duration: 4000, scale: 1.4 },
  { label: 'Segure', duration: 4000, scale: 1.4 },
  { label: 'Expire', duration: 6000, scale: 1 },
];

function BreathingGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cyclesRef = useRef(0);

  const runPhase = useCallback((idx: number) => {
    const p = PHASES[idx];
    setPhaseIdx(idx);
    setScale(p.scale);
    timerRef.current = setTimeout(() => {
      const next = (idx + 1) % PHASES.length;
      if (next === 0) {
        cyclesRef.current++;
        setCycles(cyclesRef.current);
        if (cyclesRef.current >= 3) {
          setActive(false);
          onFinish(100);
          return;
        }
      }
      runPhase(next);
    }, p.duration);
  }, [onFinish]);

  const start = () => {
    setActive(true);
    cyclesRef.current = 0;
    setCycles(0);
    runPhase(0);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Exercício de respiração 4-4-6. Complete 3 ciclos completos para pontuar.
      </p>
      <div className="relative flex items-center justify-center">
        <div
          className="w-36 h-36 rounded-full bg-primary-100 border-4 border-primary-300 flex items-center justify-center transition-all"
          style={{
            transform: `scale(${active ? scale : 1})`,
            transition: active ? `transform ${PHASES[phaseIdx].duration}ms ease-in-out` : 'none',
          }}
          aria-hidden="true"
        >
          <Wind size={32} className="text-primary-500" />
        </div>
      </div>
      {active ? (
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-700 font-manrope">{PHASES[phaseIdx].label}</div>
          <div className="text-sm text-gray-400 mt-1">Ciclo {cycles + 1} de 3</div>
        </div>
      ) : cycles >= 3 ? (
        <div className="text-center">
          <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
          <div className="font-bold text-gray-900">Exercício concluído!</div>
        </div>
      ) : (
        <button onClick={start} className="btn-primary text-sm">
          Iniciar exercício de respiração
        </button>
      )}
    </div>
  );
}

// ─── Main FocusGames component ───────────────────────────────────────────────
const GAMES = [
  { id: 'sequence' as GameId, label: 'Memória Sequencial', desc: 'Repita a sequência de cores. Testa memória de trabalho.', icon: '🟦' },
  { id: 'wordmatch' as GameId, label: 'Associação de Conceitos', desc: 'Conecte termos às definições. Reforça vocabulário.', icon: '🔗' },
  { id: 'breathing' as GameId, label: 'Respiração Guiada', desc: 'Técnica 4-4-6 para reduzir ansiedade e melhorar foco.', icon: '🌬' },
];

export default function FocusGames() {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [recentScore, setRecentScore] = useState<number | null>(null);

  const handleFinish = async (gameId: GameId, score: number) => {
    setRecentScore(score);
    const entry: GameScore = { gameId, score, date: new Date().toISOString() };
    setScores(prev => [entry, ...prev].slice(0, 10));

    if (user) {
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        game_type: gameId,
        score,
        completed_at: new Date().toISOString(),
      });
    }
  };

  const resetGame = () => {
    setActiveGame(null);
    setRecentScore(null);
  };

  if (activeGame) {
    const game = GAMES.find(g => g.id === activeGame)!;
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">{game.label}</h2>
            <p className="section-subtitle">{game.desc}</p>
          </div>
          <button onClick={resetGame} className="btn-ghost text-sm flex-shrink-0" aria-label="Voltar aos jogos">
            <RotateCcw size={14} />
            Voltar
          </button>
        </div>

        <div className="card p-6">
          {recentScore !== null ? (
            <div className="text-center py-4">
              <Trophy size={40} className="text-amber-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900 font-manrope">{recentScore} pts</h3>
              <p className="text-sm text-gray-500 mb-5">Pontuação registrada!</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setRecentScore(null); }} className="btn-secondary text-sm">Jogar novamente</button>
                <button onClick={resetGame} className="btn-primary text-sm">Outros jogos</button>
              </div>
            </div>
          ) : (
            <>
              {activeGame === 'sequence' && <SequenceGame onFinish={s => handleFinish('sequence', s * 10)} />}
              {activeGame === 'wordmatch' && <WordMatchGame onFinish={s => handleFinish('wordmatch', s)} />}
              {activeGame === 'breathing' && <BreathingGame onFinish={s => handleFinish('breathing', s)} />}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="section-title">Jogos de Foco</h2>
        <p className="section-subtitle">Mini-jogos para treinar atenção, memória e concentração</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4" role="list">
        {GAMES.map(game => {
          const best = scores.filter(s => s.gameId === game.id).reduce((m, s) => Math.max(m, s.score), 0);
          return (
            <button
              key={game.id}
              role="listitem"
              onClick={() => { setActiveGame(game.id); setRecentScore(null); }}
              className="card-hover p-5 text-left group focus-visible:outline-2 focus-visible:outline-primary-500"
              aria-label={`Jogar ${game.label}`}
            >
              <span className="text-3xl mb-3 block" role="img" aria-hidden="true">{game.icon}</span>
              <h3 className="font-semibold text-gray-900 font-jakarta mb-1 group-hover:text-primary-700 transition-colors">{game.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{game.desc}</p>
              {best > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Trophy size={11} />
                  Melhor: {best} pts
                </div>
              )}
            </button>
          );
        })}
      </div>

      {scores.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 font-jakarta mb-3">Histórico recente</h3>
          <div className="space-y-2" role="list">
            {scores.slice(0, 5).map((s, i) => {
              const g = GAMES.find(g => g.id === s.gameId);
              return (
                <div key={i} role="listitem" className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg" role="img" aria-hidden="true">{g?.icon}</span>
                    <span className="text-sm text-gray-700">{g?.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary-700">{s.score} pts</span>
                    {s.score > 0 ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
