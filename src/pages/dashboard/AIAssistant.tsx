import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Plus, MessageSquare, Brain, BookOpen, FileText, Zap, Target, CreditCard, GitBranch } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatMessage } from '../../lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const SESSION_KEY = (userId: string) => `ns_chat_session_${userId}`;

const QUICK_PROMPTS = [
  { icon: BookOpen, label: 'Explicar conceito', prompt: 'Me explique de forma simples o conceito de fotossíntese' },
  { icon: FileText, label: 'Resumir texto', prompt: 'Preciso resumir um texto longo. Vou colar o conteúdo a seguir:' },
  { icon: Brain, label: 'Simplificar', prompt: 'Simplifique este texto para facilitar a leitura:' },
  { icon: Zap, label: 'Criar exercícios', prompt: 'Crie 5 exercícios sobre Revolução Francesa com gabarito' },
  { icon: Target, label: 'Preparar prova', prompt: 'Tenho prova de Biologia em 3 dias. Me ajude a montar um plano de estudos' },
  { icon: CreditCard, label: 'Gerar flashcards', prompt: 'Crie 10 flashcards sobre as principais fórmulas de Física' },
  { icon: GitBranch, label: 'Mapa mental', prompt: 'Crie um mapa mental sobre a Segunda Guerra Mundial' },
  { icon: MessageSquare, label: 'Tirar dúvidas', prompt: 'Tenho uma dúvida sobre este exercício de Matemática:' },
];

function formatMessage(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === 'ul') {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-4 space-y-0.5 my-1">{listItems.map((li, i) => <li key={i} className="text-sm">{li}</li>)}</ul>);
    } else {
      elements.push(<ol key={`ol-${elements.length}`} className="list-decimal pl-4 space-y-0.5 my-1">{listItems.map((li, i) => <li key={i} className="text-sm">{li}</li>)}</ol>);
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line, i) => {
    if (line.match(/^- |^• /)) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(line.replace(/^- |^• /, ''));
    } else if (line.match(/^\d+\. /)) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(line.replace(/^\d+\. /, ''));
    } else {
      flushList();
      if (line === '') {
        elements.push(<br key={`br-${i}`} />);
      } else {
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <p key={`p-${i}`} className="text-sm leading-relaxed">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      }
    }
  });
  flushList();
  return elements;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>(() => {
    if (!user) return crypto.randomUUID();
    const stored = localStorage.getItem(SESSION_KEY(user.id));
    return stored || (() => { const id = crypto.randomUUID(); localStorage.setItem(SESSION_KEY(user.id), id); return id; })();
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async (sid: string) => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', sid)
      .order('created_at');
    setMessages(data || []);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { loadHistory(sessionId); }, [sessionId, loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newConversation = () => {
    const id = crypto.randomUUID();
    if (user) localStorage.setItem(SESSION_KEY(user.id), id);
    setSessionId(id);
    setMessages([]);
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading || !user) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      session_id: sessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      session_id: sessionId,
      role: 'user',
      content,
    });

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, sessionId, history: messages.slice(-10) }),
      });

      const data = await response.json();
      const assistantContent = data.response || 'Não foi possível gerar uma resposta. Tente novamente.';

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        session_id: sessionId,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (liveRegionRef.current) liveRegionRef.current.textContent = 'Nova resposta do assistente disponível.';

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: sessionId,
        role: 'assistant',
        content: assistantContent,
      });
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        session_id: sessionId,
        role: 'assistant',
        content: 'Houve um problema ao conectar com o assistente. Verifique sua conexão e tente novamente.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Screen reader live region */}
      <div ref={liveRegionRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-semibold text-gray-900 font-jakarta">Assistente IA</h2>
          <p className="text-xs text-gray-500">Tutor especializado em educação inclusiva</p>
        </div>
        <button
          onClick={newConversation}
          className="btn-ghost text-xs"
          aria-label="Iniciar nova conversa"
        >
          <Plus size={13} aria-hidden="true" />
          Nova conversa
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6"
        role="log"
        aria-label="Conversa com o assistente"
        aria-live="polite"
      >
        {loadingHistory ? (
          <div className="flex justify-center py-8" aria-label="Carregando conversa">
            <Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" />
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <Brain size={28} className="text-primary-700" />
              </div>
              <h3 className="font-bold text-gray-900 font-manrope text-lg mb-2">Como posso ajudar?</h3>
              <p className="text-sm text-gray-500">Sou um tutor especializado em educação inclusiva. Posso explicar conceitos, simplificar textos, criar exercícios e muito mais.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="list" aria-label="Sugestões de perguntas">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  role="listitem"
                  onClick={() => sendMessage(prompt.prompt)}
                  className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-left transition-all group"
                  aria-label={`Iniciar com: ${prompt.label}`}
                >
                  <prompt.icon size={16} className="text-gray-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                role="article"
                aria-label={msg.role === 'user' ? 'Sua mensagem' : 'Resposta do assistente'}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-600' : 'bg-primary-100'}`}
                  aria-hidden="true"
                >
                  {msg.role === 'user' ? (
                    <span className="text-white text-xs font-semibold">V</span>
                  ) : (
                    <Brain size={14} className="text-primary-700" />
                  )}
                </div>
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm text-sm leading-relaxed'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                  </div>
                  <time
                    className="text-[10px] text-gray-400 px-1"
                    dateTime={msg.created_at}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3" aria-label="Assistente digitando">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center" aria-hidden="true">
                  <Brain size={14} className="text-primary-700" />
                </div>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1 items-center h-4" aria-hidden="true">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
            <label htmlFor="chat-input" className="sr-only">Mensagem para o assistente</label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo, peça um resumo, exercícios..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none py-2 px-2 max-h-32 overflow-y-auto"
              style={{ minHeight: '36px' }}
              aria-label="Escreva sua mensagem"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Enviar mensagem"
            >
              {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center" aria-hidden="true">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
