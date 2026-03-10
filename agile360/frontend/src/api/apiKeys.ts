import { api, ApiResponse } from './client';

// ── Tipos (snake_case espelha JsonNamingPolicy.SnakeCaseLower do backend) ──────

export interface ApiKeyResponse {
  id: string;
  name: string;
  /** Primeiros 12 chars da chave original — identificação segura */
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

/**
 * Retornado APENAS na criação.
 * `raw_key` é a chave real — exibida UMA ÚNICA VEZ.
 * O backend armazena apenas o hash SHA-256.
 */
export interface CreateApiKeyResponse extends ApiKeyResponse {
  raw_key: string;
}

// ── Chamadas de API ───────────────────────────────────────────────────────────

/** Lista todas as chaves ativas do advogado logado. */
export async function listApiKeys(
  token: string
): Promise<ApiResponse<ApiKeyResponse[]>> {
  return api.get<ApiKeyResponse[]>('/api/api-keys', token);
}

/**
 * Cria uma nova API Key.
 * @param name       Nome amigável (ex: "n8n Principal")
 * @param expiresAt  ISO-8601 opcional — null = sem expiração
 *
 * ⚠️  O `raw_key` da resposta deve ser copiado imediatamente.
 *    Não é possível recuperá-lo depois.
 */
export async function createApiKey(
  name: string,
  expiresAt: string | null,
  token: string
): Promise<ApiResponse<CreateApiKeyResponse>> {
  return api.post<CreateApiKeyResponse>(
    '/api/api-keys',
    { name, expires_at: expiresAt },
    token
  );
}

/** Revoga (soft-delete) uma chave pelo ID. */
export async function revokeApiKey(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  return api.delete<void>(`/api/api-keys/${id}`, token);
}
