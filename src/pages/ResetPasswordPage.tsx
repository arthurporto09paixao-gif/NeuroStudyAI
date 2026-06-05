import { useState } from 'react';
import { Brain, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordPageProps {
  onDone: () => void;
}

export default function ResetPasswordPage({ onDone }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(onDone, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
            <Brain size={17} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 font-manrope">NeuroStudy AI</span>
        </div>

        <div className="card p-7">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900 font-manrope text-lg mb-2">Senha atualizada</h2>
              <p className="text-sm text-gray-500">Sua senha foi redefinida com sucesso. Você será redirecionado para o login.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 font-manrope mb-1">Criar nova senha</h2>
              <p className="text-sm text-gray-500 mb-5">Escolha uma senha segura com pelo menos 6 caracteres.</p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Mínimo 6 caracteres"
                      className="input-field pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirmar nova senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repita a senha"
                    className="input-field"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="btn-primary w-full justify-center py-3 text-sm"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                  Redefinir senha
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
