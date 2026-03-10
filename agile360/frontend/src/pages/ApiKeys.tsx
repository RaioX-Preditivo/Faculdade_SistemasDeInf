import { useState, useEffect, useRef } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  ApiKeyResponse,
  CreateApiKeyResponse,
} from '../api/apiKeys';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function isExpired(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

// ── Componente: Modal de criação ───────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (name: string, expiresAt: string | null) => void;
  loading: boolean;
}

function CreateModal({ onClose, onCreate, loading }: CreateModalProps) {
  const [name, setName] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const expiresAt = hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null;
    onCreate(name.trim(), expiresAt);
  }

  // Min date = amanhã
  const minDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-[var(--color-text)]">Nova API Key</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              Nome da chave <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: n8n Principal, WhatsApp Bot"
              maxLength={80}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition"
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Use um nome que identifique onde a chave será usada.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasExpiry(v => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 ${
                hasExpiry ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={hasExpiry}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  hasExpiry ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-[var(--color-text)]">Definir data de expiração</span>
          </div>

          {hasExpiry && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Expira em
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                min={minDate}
                required={hasExpiry}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition"
              />
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                O valor da chave será exibido <strong>uma única vez</strong>. Copie e guarde em
                local seguro — não é possível recuperá-la depois.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando...' : 'Gerar chave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente: Exibição única da chave criada ─────────────────────────────────

interface KeyRevealProps {
  created: CreateApiKeyResponse;
  onClose: () => void;
}

function KeyReveal({ created, onClose }: KeyRevealProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(created.raw_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-500" />
            <h3 className="font-semibold text-[var(--color-text)]">
              Chave criada: <span className="text-[var(--color-primary)]">{created.name}</span>
            </h3>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Alerta de cópia única */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
            <div className="flex gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-xs text-red-700 dark:text-red-400">
                <strong>Copie agora.</strong> Após fechar esta janela, a chave não poderá ser
                visualizada novamente. Apenas o prefixo <code className="font-mono">{created.key_prefix}</code>{' '}
                ficará visível na lista.
              </p>
            </div>
          </div>

          {/* Chave */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
              Sua API Key
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
              <code className="flex-1 truncate font-mono text-sm text-[var(--color-text)]">
                {visible ? created.raw_key : '•'.repeat(Math.min(created.raw_key.length, 48))}
              </code>
              <button
                onClick={() => setVisible(v => !v)}
                className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                title={visible ? 'Ocultar' : 'Revelar'}
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Uso no n8n */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
              Header para usar no n8n / HTTP Request
            </label>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 font-mono text-xs text-[var(--color-text)]">
              <span className="text-[var(--color-text-muted)]">X-Api-Key: </span>
              {visible ? created.raw_key : `${created.key_prefix}${'•'.repeat(16)}`}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Entendi, já copiei a chave
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente: Linha de uma chave na lista ───────────────────────────────────

interface KeyRowProps {
  apiKey: ApiKeyResponse;
  onRevoke: (id: string, name: string) => void;
  revoking: boolean;
}

function KeyRow({ apiKey, onRevoke, revoking }: KeyRowProps) {
  const expired = isExpired(apiKey.expires_at);

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
      expired
        ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
        : 'border-[var(--color-border)] bg-[var(--color-surface)]'
    }`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={`mt-0.5 rounded-lg p-2 ${
          expired ? 'bg-red-100 dark:bg-red-900/40' : 'bg-[var(--color-primary)]/10'
        }`}>
          <Key size={14} className={expired ? 'text-red-500' : 'text-[var(--color-primary)]'} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-[var(--color-text)] truncate">
              {apiKey.name}
            </span>
            {expired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                Expirada
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
            {apiKey.key_prefix}{'•'.repeat(8)}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Criada: {formatDate(apiKey.created_at)}
            </span>
            {apiKey.last_used_at && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Último uso: {formatDate(apiKey.last_used_at)}
              </span>
            )}
            {apiKey.expires_at && (
              <span className={`flex items-center gap-1 ${expired ? 'text-red-500' : ''}`}>
                <Clock size={11} />
                Expira: {formatDate(apiKey.expires_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onRevoke(apiKey.id, apiKey.name)}
        disabled={revoking}
        title="Revogar chave"
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 size={13} />
        Revogar
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function ApiKeys() {
  const { state } = useAuth();
  const token = state.token ?? '';

  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);

  const [revoking, setRevoking] = useState<string | null>(null); // id da chave em revogação

  // ── Carregar lista ──────────────────────────────────────────────────────────
  async function loadKeys() {
    setLoading(true);
    setError(null);
    const res = await listApiKeys(token);
    if (res.success && res.data) {
      setKeys(res.data);
    } else {
      setError(res.error?.message ?? 'Erro ao carregar chaves.');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Criar chave ─────────────────────────────────────────────────────────────
  async function handleCreate(name: string, expiresAt: string | null) {
    setCreating(true);
    const res = await createApiKey(name, expiresAt, token);
    setCreating(false);
    if (res.success && res.data) {
      setShowCreate(false);
      setCreatedKey(res.data);
      // Adiciona a nova chave sem o raw_key à lista imediatamente
      setKeys(prev => [
        {
          id: res.data!.id,
          name: res.data!.name,
          key_prefix: res.data!.key_prefix,
          created_at: res.data!.created_at,
          last_used_at: null,
          expires_at: res.data!.expires_at,
        },
        ...prev,
      ]);
    } else {
      setError(res.error?.message ?? 'Erro ao criar chave.');
    }
  }

  // ── Revogar chave ───────────────────────────────────────────────────────────
  async function handleRevoke(id: string, name: string) {
    if (!window.confirm(`Revogar a chave "${name}"?\n\nQualquer integração usando esta chave deixará de funcionar imediatamente.`))
      return;

    setRevoking(id);
    const res = await revokeApiKey(id, token);
    setRevoking(null);
    if (res.success || res.error?.statusCode === 204) {
      setKeys(prev => prev.filter(k => k.id !== id));
    } else {
      setError(res.error?.message ?? 'Erro ao revogar chave.');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Integrações — API Keys
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Chaves de acesso para integrações M2M (n8n, WhatsApp bot, automações).
            Cada chave concede acesso apenas de <strong>escrita nas filas de staging</strong> —
            nunca diretamente nas tabelas de produção.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <Plus size={15} />
          Nova chave
        </button>
      </div>

      {/* Aviso de segurança */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex gap-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <div className="text-sm text-[var(--color-text-muted)] space-y-1">
            <p>
              <strong className="text-[var(--color-text)]">Política de segurança:</strong> As API
              Keys só podem escrever nas tabelas de staging. Todos os dados aguardam aprovação
              manual no Dashboard antes de serem promovidos para as tabelas principais.
            </p>
            <p>
              Use o header{' '}
              <code className="rounded bg-[var(--color-border)] px-1 font-mono text-xs">
                X-Api-Key: &lt;sua-chave&gt;
              </code>{' '}
              nas requisições HTTP do n8n.
            </p>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Lista de chaves */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-border)]" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center">
          <Key size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Nenhuma chave criada</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Crie uma chave para começar a integração com o n8n.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Plus size={14} />
            Criar primeira chave
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <KeyRow
              key={k.id}
              apiKey={k}
              onRevoke={handleRevoke}
              revoking={revoking === k.id}
            />
          ))}
        </div>
      )}

      {/* Modal: criar */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          loading={creating}
        />
      )}

      {/* Modal: exibição única da chave */}
      {createdKey && (
        <KeyReveal
          created={createdKey}
          onClose={() => setCreatedKey(null)}
        />
      )}
    </div>
  );
}
