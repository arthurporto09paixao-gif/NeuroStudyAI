import { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, Clock, Loader2, X, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LinkedStudent {
  id: string;
  guardian_id: string;
  student_id: string;
  approved: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    grade: string | null;
    neurodivergences: string[];
  };
}

interface PendingInvite {
  id: string;
  guardian_id: string;
  invite_code: string;
  created_at: string;
  used: boolean;
}

export default function GuardianPanel() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkedStudent[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    const [linksRes, invitesRes] = await Promise.all([
      supabase.from('guardian_links').select('*').eq('guardian_id', user.id),
      supabase.from('pending_invites').select('*').eq('guardian_id', user.id).eq('used', false),
    ]);

    const linksData = linksRes.data || [];
    const withProfiles = await Promise.all(
      linksData.map(async (link) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, grade, neurodivergences')
          .eq('id', link.student_id)
          .maybeSingle();
        return { ...link, profile: profileData || undefined };
      })
    );

    setLinks(withProfiles);
    setPendingInvites(invitesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const generateInvite = async () => {
    if (!user) return;
    setGenerating(true);
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data, error } = await supabase.from('pending_invites').insert({
      guardian_id: user.id,
      invite_code: code,
      used: false,
    }).select().single();
    if (!error && data) {
      setPendingInvites(prev => [...prev, data]);
    }
    setGenerating(false);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const revokeInvite = async (id: string) => {
    await supabase.from('pending_invites').delete().eq('id', id);
    setPendingInvites(prev => prev.filter(i => i.id !== id));
  };

  const removeLink = async (id: string) => {
    await supabase.from('guardian_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
    setRemoveConfirm(null);
  };

  if (loading) return (
    <div className="p-6 flex justify-center" aria-label="Carregando painel">
      <Loader2 size={20} className="animate-spin text-gray-400" aria-hidden="true" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="section-title">Painel de Responsáveis</h2>
        <p className="section-subtitle">Acompanhe o progresso dos estudantes vinculados</p>
      </div>

      {/* Generate invite */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 font-jakarta mb-1">Vincular estudante</h3>
        <p className="text-xs text-gray-500 mb-4">
          Gere um código de convite e compartilhe com o estudante. Ele insere o código na conta dele para conceder acesso ao progresso.
        </p>
        <button
          onClick={generateInvite}
          disabled={generating}
          className="btn-primary text-sm"
          aria-label="Gerar código de convite"
        >
          {generating ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <UserPlus size={14} aria-hidden="true" />}
          Gerar código de convite
        </button>

        {pendingInvites.length > 0 && (
          <div className="mt-4 space-y-2" role="list" aria-label="Códigos de convite pendentes">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Códigos ativos</p>
            {pendingInvites.map(invite => (
              <div
                key={invite.id}
                role="listitem"
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div>
                  <code className="font-mono text-sm font-bold text-primary-700 tracking-widest">{invite.invite_code}</code>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Criado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyCode(invite.invite_code)}
                    className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    aria-label={`Copiar código ${invite.invite_code}`}
                  >
                    {copied === invite.invite_code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label={`Revogar código ${invite.invite_code}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked students */}
      <div>
        <h3 className="font-semibold text-gray-900 font-jakarta mb-3">Estudantes vinculados</h3>
        {links.length === 0 ? (
          <div className="card p-10 text-center">
            <Users size={36} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <h4 className="font-semibold text-gray-700 font-manrope mb-2">Nenhum estudante vinculado</h4>
            <p className="text-sm text-gray-400">Gere um código de convite e compartilhe com o estudante</p>
          </div>
        ) : (
          <div className="space-y-3" role="list">
            {links.map(link => (
              <div key={link.id} className="card p-5" role="listitem">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center" aria-hidden="true">
                      <span className="text-primary-700 font-semibold text-sm">
                        {link.profile?.full_name?.[0] || 'E'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{link.profile?.full_name || 'Estudante'}</div>
                      <div className="text-xs text-gray-400">{link.profile?.grade || 'Série não informada'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {link.approved ? (
                      <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1">
                        <CheckCircle size={11} aria-hidden="true" />Aprovado
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700 text-xs flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" />Pendente
                      </span>
                    )}
                    {removeConfirm === link.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeLink(link.id)}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          aria-label="Confirmar remoção"
                        >
                          Remover
                        </button>
                        <button
                          onClick={() => setRemoveConfirm(null)}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          aria-label="Cancelar remoção"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRemoveConfirm(link.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label={`Remover ${link.profile?.full_name || 'estudante'}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {link.profile?.neurodivergences && link.profile.neurodivergences.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {link.profile.neurodivergences.filter(n => n !== 'prefer_not').map(nd => (
                      <span key={nd} className="badge bg-primary-50 text-primary-700 text-[10px]">{nd}</span>
                    ))}
                  </div>
                )}
                {!link.approved && (
                  <p className="text-xs text-gray-400 mt-2">Aguardando aprovação do estudante para visualizar o progresso</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
