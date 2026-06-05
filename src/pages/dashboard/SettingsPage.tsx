import { useState, useEffect } from 'react';
import { Settings, User, Save, Check, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [form, setForm] = useState({ full_name: '', grade: '', course: '', age: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        grade: profile.grade || '',
        course: profile.course || '',
        age: profile.age?.toString() || '',
      });
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: form.full_name || null,
      grade: form.grade || null,
      course: form.course || null,
      age: form.age ? parseInt(form.age) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const changePassword = async () => {
    setPasswordError('');
    if (passwordForm.next.length < 6) { setPasswordError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (passwordForm.next !== passwordForm.confirm) { setPasswordError('As senhas não coincidem.'); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 id="logout-title" className="font-bold text-gray-900 font-manrope mb-2">Sair da conta?</h3>
            <p className="text-sm text-gray-500 mb-5">Você precisará fazer login novamente para acessar sua conta.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={signOut} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Sair</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="section-title">Configurações</h2>
        <p className="section-subtitle">Gerencie seu perfil e preferências da conta</p>
      </div>

      {/* Profile */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 font-jakarta flex items-center gap-2 mb-4">
          <User size={16} className="text-gray-500" aria-hidden="true" />
          Perfil
        </h3>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="settings-email">Email</label>
            <input id="settings-email" type="email" value={user?.email || ''} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" aria-describedby="email-note" />
            <p id="email-note" className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
          </div>
          <div>
            <label className="label" htmlFor="settings-name">Nome completo</label>
            <input id="settings-name" type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Seu nome" className="input-field" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="settings-age">Idade</label>
              <input id="settings-age" type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="Sua idade" min="5" max="80" className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="settings-course">Curso / Disciplina</label>
              <input id="settings-course" type="text" value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))} placeholder="Ex: Medicina" className="input-field" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="settings-grade">Série / Nível</label>
            <input id="settings-grade" type="text" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} placeholder="Ex: 3º ano do Ensino Médio" className="input-field" />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm mt-5 w-full justify-center py-2.5">
          {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : saved ? <Check size={14} aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
          {saved ? 'Perfil atualizado' : 'Salvar perfil'}
        </button>
      </div>

      {/* Password change */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 font-jakarta flex items-center gap-2 mb-4">
          <Settings size={16} className="text-gray-500" aria-hidden="true" />
          Alterar senha
        </h3>
        {passwordError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4" role="alert">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{passwordError}</span>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="pw-new">Nova senha</label>
            <div className="relative">
              <input
                id="pw-new"
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.next}
                onChange={e => { setPasswordForm(p => ({ ...p, next: e.target.value })); setPasswordError(''); }}
                placeholder="Mínimo 6 caracteres"
                className="input-field pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}>
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="pw-confirm">Confirmar nova senha</label>
            <input
              id="pw-confirm"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirm}
              onChange={e => { setPasswordForm(p => ({ ...p, confirm: e.target.value })); setPasswordError(''); }}
              placeholder="Repita a senha"
              className="input-field"
              autoComplete="new-password"
            />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={passwordSaving || !passwordForm.next || !passwordForm.confirm}
          className="btn-primary text-sm mt-4 w-full justify-center py-2.5"
        >
          {passwordSaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : passwordSaved ? <Check size={14} aria-hidden="true" /> : null}
          {passwordSaved ? 'Senha alterada' : 'Alterar senha'}
        </button>
      </div>

      {/* Account info */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 font-jakarta flex items-center gap-2 mb-4">
          <Settings size={16} className="text-gray-500" aria-hidden="true" />
          Conta
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-900">Perfil de acesso</div>
              <div className="text-xs text-gray-400 mt-0.5">{profile?.role === 'student' ? 'Estudante' : (profile?.role || '—')}</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-900">Membro desde</div>
              <div className="text-xs text-gray-400 mt-0.5">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—'}</div>
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-sm text-red-600 font-medium hover:text-red-700 transition-colors"
              aria-label="Sair da conta"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
