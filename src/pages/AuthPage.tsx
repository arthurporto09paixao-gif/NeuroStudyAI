import { useState } from 'react';
import { Brain, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthPageProps {
  mode: 'login' | 'register' | 'reset';
  onNavigate: (page: string) => void;
}

export default function AuthPage({ mode, onNavigate }: AuthPageProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Preencha todos os campos.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message);
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('Preencha todos os campos.'); return; }
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (form.password !== form.confirmPassword) { setError('As senhas nao coincidem.'); return; }
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes('already registered')) setError('Este email ja esta cadastrado.');
      else setError(error.message);
    } else if (data.user) {
      // Profile created via trigger; user is signed in automatically
    }
  };

  const handleReset = async () => {
    if (!form.email) { setError('Informe seu email.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess('Enviamos um link de recuperacao para seu email.');
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else if (mode === 'register') handleRegister();
    else handleReset();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary-800 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 border border-white rounded-full" />
          <div className="absolute top-40 left-20 w-48 h-48 border border-white rounded-full" />
          <div className="absolute bottom-20 right-10 w-64 h-64 border border-white rounded-full" />
        </div>
        <div className="relative">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            Voltar ao site
          </button>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl font-manrope">NeuroStudy AI</span>
          </div>
          <h2 className="text-3xl font-bold text-white font-manrope leading-tight mb-3">
            Educação adaptada para cada forma de aprender.
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed">
            Plataforma inteligente que transforma conteúdos complexos em experiências acessíveis para estudantes neurodivergentes.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          {[
            { value: 'Dislexia', desc: 'Fonte adaptada e régua de leitura' },
            { value: 'TDAH', desc: 'Pomodoro e blocos de foco' },
            { value: 'TEA', desc: 'Interface previsível e estruturada' },
            { value: 'Discalculia', desc: 'Apoio visual para matemática' },
          ].map((item, i) => (
            <div key={i} className="bg-white/8 rounded-xl p-3.5 border border-white/10">
              <div className="text-white text-sm font-semibold font-jakarta mb-1">{item.value}</div>
              <div className="text-primary-300 text-xs leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-4">
              <ArrowLeft size={15} />
              Voltar
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-800 rounded-lg flex items-center justify-center">
                <Brain size={15} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 font-manrope">NeuroStudy AI</span>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 font-manrope">
              {mode === 'login' ? 'Entrar na conta' : mode === 'register' ? 'Criar conta' : 'Recuperar senha'}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {mode === 'login' ? 'Acesse sua plataforma de aprendizagem.' : mode === 'register' ? 'Comece sua jornada de aprendizagem inclusiva.' : 'Enviaremos um link para seu email.'}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 animate-fade-in">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-xl mb-4 animate-fade-in">
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Nome completo</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className="input-field"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Senha</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => onNavigate('reset')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder={mode === 'register' ? 'Minimo 6 caracteres' : '••••••••'}
                    className="input-field pr-10"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar link de recuperacao'}
            </button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">ou continue com</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar com Google
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>Nao tem uma conta?{' '}<button onClick={() => onNavigate('register')} className="text-primary-600 font-semibold hover:text-primary-700">Criar conta</button></>
            ) : mode === 'register' ? (
              <>Ja tem uma conta?{' '}<button onClick={() => onNavigate('login')} className="text-primary-600 font-semibold hover:text-primary-700">Entrar</button></>
            ) : (
              <button onClick={() => onNavigate('login')} className="text-primary-600 font-semibold hover:text-primary-700">Voltar ao login</button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
