import { useState, useEffect } from 'react';
import { Brain, Menu, X, ChevronRight, ChevronDown, Check, ArrowRight, BookOpen, Zap, Target, BarChart3, Shield, Users, Star, MessageSquare, Phone, Mail, MapPin, Loader2 } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const NAV_LINKS = [
  { label: 'Sobre', href: '#sobre' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contato', href: '#contato' },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'Assistente IA Inclusivo',
    description: 'Tutor inteligente especializado em educação inclusiva. Explica, resume, simplifica e gera exercícios adaptados ao perfil de cada estudante.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Zap,
    title: 'NeuroScanner',
    description: 'Envie qualquer conteúdo — texto, imagem ou PDF — e receba um resumo simplificado, exercícios práticos, flashcards e mapa mental em segundos.',
    color: 'bg-slate-50 text-slate-700',
  },
  {
    icon: BookOpen,
    title: 'Flashcards com Repetição Espaçada',
    description: 'Sistema científico de memorização que se adapta ao desempenho do aluno, priorizando o que precisa ser revisado.',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Target,
    title: 'Mapas Mentais Automáticos',
    description: 'Transforma qualquer conteúdo em diagramas visuais hierárquicos, facilitando a compreensão e a retenção de informações.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: BarChart3,
    title: 'Relatórios de Desempenho',
    description: 'Acompanhamento detalhado do progresso com visualizações claras, identificando pontos fortes e áreas de atenção.',
    color: 'bg-rose-50 text-rose-700',
  },
  {
    icon: Shield,
    title: 'Modos de Acessibilidade',
    description: 'Modo Dislexia, Modo TDAH e Modo TEA com configurações granulares de fonte, espaçamento, contraste e redução de estímulos.',
    color: 'bg-violet-50 text-violet-700',
  },
];

const STATS = [
  { value: '3.1M', label: 'Estudantes neurodivergentes no Brasil' },
  { value: '68%', label: 'Sem suporte educacional adequado' },
  { value: '2.3x', label: 'Melhora na retenção com métodos adaptativos' },
  { value: '87%', label: 'Estudantes relatam maior confiança acadêmica' },
];

const TESTIMONIALS = [
  {
    name: 'Mariana Costa',
    role: 'Estudante com Dislexia — Ensino Médio',
    content: 'Pela primeira vez consegui ler um capítulo inteiro sem perder o fio. A régua de leitura e a fonte adaptada mudaram completamente minha experiência de estudo.',
    rating: 5,
  },
  {
    name: 'Rafael Mendes',
    role: 'Estudante com TDAH — Graduação',
    content: 'O temporizador Pomodoro integrado e os blocos de conteúdo curtos me ajudaram a manter o foco. Nunca consegui estudar mais de 10 minutos seguidos antes disso.',
    rating: 5,
  },
  {
    name: 'Dra. Patricia Alves',
    role: 'Psicopedagoga — CRP 06/98734',
    content: 'A abordagem da plataforma é fundamentada em evidências. Os modos de acessibilidade refletem práticas clínicas recomendadas para cada perfil neurodivergente.',
    rating: 5,
  },
];

const FAQS = [
  {
    question: 'Como a plataforma identifica o perfil do estudante?',
    answer: 'Através de um onboarding estruturado onde o estudante informa sua série, objetivos e neurodivergências. Com base nessas informações, a plataforma configura automaticamente a interface, os modos de acessibilidade e as estratégias de ensino mais adequadas.',
  },
  {
    question: 'A plataforma funciona para todos os tipos de neurodivergência?',
    answer: 'A plataforma oferece suporte específico para Dislexia, TDAH, TEA e Discalculia, além de configurações personalizáveis para outras condições. Cada modo foi desenvolvido com base em protocolos clínicos e pedagógicos validados.',
  },
  {
    question: 'Como funciona a integração com a inteligência artificial?',
    answer: 'A IA atua como tutor personalizado, adaptando o nível de linguagem, o formato das explicações e as atividades ao perfil de cada estudante. Pode simplificar textos, gerar exercícios, criar mapas mentais e auxiliar na preparação para provas.',
  },
  {
    question: 'Responsáveis e educadores podem acompanhar o progresso?',
    answer: 'Sim. A plataforma possui um painel dedicado para responsáveis, onde é possível visualizar o progresso, tempo de estudo, metas e relatórios de desempenho do estudante, com autorização prévia.',
  },
  {
    question: 'A plataforma está disponível para dispositivos móveis?',
    answer: 'Sim. A plataforma é desenvolvida com design Mobile First e funciona como Progressive Web App (PWA), podendo ser instalada no smartphone e utilizada mesmo sem conexão à internet.',
  },
];

interface ContactForm {
  name: string;
  role: string;
  email: string;
  institution: string;
  message: string;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contact, setContact] = useState<ContactForm>({ name: '', role: '', email: '', institution: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) {
      setContactError('Por favor, preencha os campos obrigatórios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      setContactError('Informe um email válido.');
      return;
    }
    setContactSending(true);
    setContactError('');
    await new Promise(r => setTimeout(r, 900));
    setContactSending(false);
    setContactSent(true);
    setContact({ name: '', role: '', email: '', institution: '', message: '' });
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900 text-[17px] tracking-tight font-manrope">NeuroStudy AI</span>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <a key={link.href} href={link.href} className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                Entrar
              </button>
              <button onClick={() => onNavigate('register')} className="btn-primary text-sm">
                Começar gratuitamente
              </button>
            </div>

            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <button onClick={() => onNavigate('login')} className="btn-ghost w-full justify-center text-sm font-semibold">Entrar</button>
              <button onClick={() => onNavigate('register')} className="btn-primary w-full text-sm">Começar gratuitamente</button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-6">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Plataforma de Educação Inclusiva com IA
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight font-manrope mb-6">
              Educação adaptada para{' '}
              <span className="text-primary-600">cada forma</span>
              {' '}de aprender.
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-2xl mx-auto">
              Uma plataforma inteligente que transforma conteúdos complexos em experiências acessíveis para estudantes com dislexia, TDAH, TEA e outras neurodivergências.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => onNavigate('register')} className="btn-primary px-6 py-3 text-base">
                Conhecer Plataforma
                <ChevronRight size={18} />
              </button>
              <a href="#contato" className="btn-secondary px-6 py-3 text-base">
                Solicitar Demonstração
              </a>
            </div>

            <p className="mt-4 text-xs text-gray-400">Sem cartão de crédito · Acesso imediato</p>
          </div>

          {/* Device mockups */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-primary-800 to-primary-600 rounded-3xl p-1 max-w-4xl mx-auto shadow-2xl">
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-md mx-4 h-5 flex items-center px-3">
                    <span className="text-gray-400 text-[10px]">app.neurostudy.ai/dashboard</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 min-h-[280px] sm:min-h-[360px]">
                  <div className="flex gap-3 h-full">
                    {/* Sidebar mockup */}
                    <div className="hidden sm:flex w-44 bg-white rounded-xl border border-gray-200 p-3 flex-col gap-1 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-primary-800 rounded-md" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                      </div>
                      {['Inicio', 'Materias', 'Assistente IA', 'Flashcards', 'Mapas Mentais', 'Cronograma'].map((_item, i) => (
                        <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${i === 0 ? 'bg-primary-50' : ''}`}>
                          <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-primary-500' : 'bg-gray-200'}`} />
                          <div className={`h-2 rounded ${i === 0 ? 'bg-primary-300 w-12' : 'bg-gray-200 w-16'}`} />
                        </div>
                      ))}
                    </div>
                    {/* Main content mockup */}
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Tempo Estudado', 'Flashcards', 'Mapas Mentais', 'Progresso'].map((_label, i) => (
                          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
                            <div className="h-2 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className={`h-5 rounded w-1/2 ${['bg-primary-100', 'bg-emerald-100', 'bg-amber-100', 'bg-blue-100'][i]}`} />
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="h-2.5 bg-gray-200 rounded w-1/3 mb-3" />
                        <div className="space-y-2">
                          {[60, 80, 45, 90].map((w, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="h-2 bg-gray-100 rounded w-16" />
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${w}%` }} />
                              </div>
                              <div className="h-2 bg-gray-100 rounded w-8" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-14 bg-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white font-manrope mb-1">{stat.value}</div>
                <div className="text-sm text-primary-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="sobre" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-4">
                Sobre a Plataforma
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-manrope leading-tight mb-4">
                Tecnologia construída com base na neurociência da aprendizagem
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                O NeuroStudy AI foi desenvolvido em colaboração com psicopedagogos, neurologistas e educadores especializados em inclusão. Cada funcionalidade é embasada em evidências científicas sobre como diferentes perfis cognitivos processam e retêm informações.
              </p>
              <div className="space-y-3">
                {[
                  'Protocolos validados para Dislexia, TDAH, TEA e Discalculia',
                  'Inteligência artificial treinada para educação inclusiva',
                  'Interface desenvolvida com princípios de Design Universal',
                  'Conformidade com WCAG 2.1 AA e ABNT NBR 17225',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={11} className="text-primary-700" />
                    </div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brain, label: 'Neurociência', desc: 'Fundamentos cognitivos validados' },
                { icon: Shield, label: 'Acessibilidade', desc: 'Design Universal aplicado' },
                { icon: Users, label: 'Inclusao', desc: 'Para todos os perfis de aprendizagem' },
                { icon: BarChart3, label: 'Resultados', desc: 'Progresso mensuravel e rastreavel' },
              ].map((item, i) => (
                <div key={i} className="card p-5">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-3">
                    <item.icon size={20} className="text-primary-700" />
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">{item.label}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-4">
              Recursos
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-manrope leading-tight mb-4">
              Uma suite completa de ferramentas adaptativas
            </h2>
            <p className="text-gray-500">Cada recurso foi projetado para atender necessidades específicas de aprendizagem, com configurações granulares para cada perfil.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div key={i} className="card-hover p-6">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 font-jakarta">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-4">
              Beneficios
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-manrope leading-tight mb-4">
              O que muda na pratica
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Para estudantes',
                items: [
                  'Conteudo adaptado ao seu perfil cognitivo',
                  'Reducao da ansiedade academica',
                  'Maior autonomia nos estudos',
                  'Metodos de estudo baseados em evidencias',
                  'Interface acessivel e sem sobrecarga visual',
                ],
              },
              {
                title: 'Para responsaveis',
                items: [
                  'Acompanhamento em tempo real do progresso',
                  'Relatorios claros e objetivos',
                  'Comunicacao direta com o sistema',
                  'Visibilidade sobre as dificuldades especificas',
                  'Suporte para conversas com educadores',
                ],
              },
              {
                title: 'Para instituicoes',
                items: [
                  'Ferramenta alinhada com a PNEE e a LBI',
                  'Dados anonimizados para analise educacional',
                  'Reducao de custos com suporte individualizado',
                  'Complemento ao suporte psicopedagogico',
                  'Dashboard centralizado para educadores',
                ],
              },
            ].map((col, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-bold text-gray-900 font-manrope mb-4 text-lg">{col.title}</h3>
                <ul className="space-y-3">
                  {col.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={9} className="text-primary-700" />
                      </div>
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-4">
              Depoimentos
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-manrope leading-tight">
              O que dizem sobre a plataforma
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-4">
              Perguntas Frequentes
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-manrope">Duvidas comuns</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900 text-sm pr-4">{faq.question}</span>
                  <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-manrope mb-4">
            Pronto para transformar sua experiencia de aprendizagem?
          </h2>
          <p className="text-primary-200 mb-8 leading-relaxed">
            Junte-se a estudantes que ja descobriram uma forma mais acessivel e eficaz de aprender.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('register')} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-800 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-base">
              Criar conta gratuita
              <ArrowRight size={18} />
            </button>
            <a href="#contato" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary-600 text-primary-100 font-semibold rounded-xl hover:bg-primary-700 transition-colors text-base">
              Solicitar demonstracao
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-4">
                Contato
              </div>
              <h2 className="text-3xl font-bold text-gray-900 font-manrope mb-4">Entre em contato</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Tem duvidas sobre a plataforma ou deseja uma demonstracao para sua instituicao? Nossa equipe esta disponivel para atender.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'contato@neurostudy.ai' },
                  { icon: Phone, label: '+55 (11) 3000-0000' },
                  { icon: MapPin, label: 'Sao Paulo, Brasil' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                      <item.icon size={16} className="text-primary-700" />
                    </div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6 sm:p-8">
              <h3 className="font-semibold text-gray-900 mb-5 font-jakarta">Solicitar demonstração</h3>
              {contactSent ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 font-manrope mb-2">Mensagem enviada!</h4>
                  <p className="text-sm text-gray-500">Nossa equipe entrará em contato em até 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} noValidate className="space-y-4">
                  {contactError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      {contactError}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="contact-name">Nome *</label>
                      <input id="contact-name" type="text" value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome" className="input-field" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="contact-role">Cargo / Função</label>
                      <input id="contact-role" type="text" value={contact.role} onChange={e => setContact(p => ({ ...p, role: e.target.value }))} placeholder="Educador, Responsável..." className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-email">Email *</label>
                    <input id="contact-email" type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} placeholder="email@instituicao.edu.br" className="input-field" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-institution">Instituição</label>
                    <input id="contact-institution" type="text" value={contact.institution} onChange={e => setContact(p => ({ ...p, institution: e.target.value }))} placeholder="Nome da escola ou universidade" className="input-field" />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-message">Mensagem *</label>
                    <textarea id="contact-message" rows={4} value={contact.message} onChange={e => setContact(p => ({ ...p, message: e.target.value }))} placeholder="Descreva o contexto e suas necessidades..." className="input-field resize-none" required />
                  </div>
                  <button type="submit" disabled={contactSending} className="btn-primary w-full justify-center text-base py-3">
                    {contactSending ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                    {contactSending ? 'Enviando...' : 'Enviar solicitação'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <Brain size={15} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white font-manrope">NeuroStudy AI</span>
            </div>
            <div className="text-xs text-center">
              2024 NeuroStudy AI. Plataforma educacional inclusiva com inteligencia artificial.
            </div>
            <div className="flex gap-5 text-xs">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Acessibilidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
