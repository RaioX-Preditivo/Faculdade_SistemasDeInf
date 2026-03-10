-- ============================================================
-- Script: rls_security_policy.sql
-- Propósito: Habilitar Row Level Security (RLS) nas tabelas
--            criadas durante a sincronização do EF Core.
--
-- CONTEXTO SUPABASE — como o RLS funciona aqui:
--
--   ┌─────────────────┬────────────────────┬─────────────────────┐
--   │ Role            │ Usa RLS?           │ Quem é              │
--   ├─────────────────┼────────────────────┼─────────────────────┤
--   │ anon            │ SIM — bloqueado    │ frontend sem login  │
--   │ authenticated   │ SIM — bloqueado    │ frontend com login  │
--   │ service_role    │ NÃO — bypass auto  │ backend / EF Core   │
--   │ postgres        │ NÃO — superuser    │ migrations / DBA    │
--   └─────────────────┴────────────────────┴─────────────────────┘
--
--   Habilitar RLS sem criar política para anon/authenticated
--   é equivalente a "deny all" para a API pública do Supabase.
--   O backend (EF Core via service_role) continua funcionando
--   sem nenhuma alteração — o bypass é automático.
--
-- INSTRUÇÕES:
--   Supabase Dashboard → SQL Editor → cole e execute
--   SEGURO PARA RE-EXECUTAR: usa DROP POLICY IF EXISTS antes de criar
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- TABELA 1: advogado_recovery_codes
-- ════════════════════════════════════════════════════════════
-- Contém BCrypt hashes dos códigos de recuperação MFA.
-- NUNCA deve ser acessível via API pública (PostgREST/anon).
-- Acesso exclusivo via backend (service_role).

-- 1a. Habilita RLS — a partir daqui, anon/authenticated = 0 linhas
ALTER TABLE "advogado_recovery_codes" ENABLE ROW LEVEL SECURITY;

-- 1b. Remove privilégios de tabela para roles públicas
--     (defesa em profundidade: bloqueia antes mesmo do RLS)
REVOKE ALL ON "advogado_recovery_codes" FROM anon;
REVOKE ALL ON "advogado_recovery_codes" FROM authenticated;

-- 1c. Garante que service_role mantém acesso total
--     (redundante — service_role bypassa RLS — mas documenta intenção)
GRANT ALL ON "advogado_recovery_codes" TO service_role;

-- 1d. Política explícita para service_role (aparece no Dashboard Supabase)
--     Facilita auditoria: fica visível em Authentication → Policies
DROP POLICY IF EXISTS "backend_only_service_role" ON "advogado_recovery_codes";
CREATE POLICY "backend_only_service_role"
    ON "advogado_recovery_codes"
    AS RESTRICTIVE            -- politica restritiva: AND com outras políticas
    FOR ALL                   -- SELECT, INSERT, UPDATE, DELETE
    TO service_role
    USING (true)              -- qualquer linha é visível para service_role
    WITH CHECK (true);        -- qualquer linha pode ser escrita por service_role

-- ════════════════════════════════════════════════════════════
-- TABELA 2: __EFMigrationsHistory
-- ════════════════════════════════════════════════════════════
-- Tabela interna do EF Core. Não deve ser exposta via API.
-- Não precisamos de políticas — RLS habilitado sem políticas
-- = "deny all" por padrão para anon/authenticated.
-- O EF Core (service_role/postgres) bypassa automaticamente.

-- 2a. Habilita RLS — nega todo acesso via API pública
ALTER TABLE "__EFMigrationsHistory" ENABLE ROW LEVEL SECURITY;

-- 2b. Remove privilégios de tabela para roles públicas
REVOKE ALL ON "__EFMigrationsHistory" FROM anon;
REVOKE ALL ON "__EFMigrationsHistory" FROM authenticated;

-- Nota: NÃO criamos política para service_role aqui.
-- Sem nenhuma política = RLS bloqueia tudo via API.
-- Acesso via dotnet ef database update (service_role/postgres) → bypass ✓

COMMIT;

-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (execute separadamente após o COMMIT)
-- ════════════════════════════════════════════════════════════

-- 1. Confirma que RLS está habilitado nas duas tabelas:
--    (rowsecurity = RLS ativo; relforcerowsecurity vem de pg_class)
SELECT
    t.schemaname,
    t.tablename,
    t.rowsecurity             AS rls_enabled,
    c.relforcerowsecurity     AS rls_forced
FROM pg_tables t
JOIN pg_class  c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('advogado_recovery_codes', '__EFMigrationsHistory')
ORDER BY t.tablename;
-- Resultado esperado:
--  public | __EFMigrationsHistory    | true | false
--  public | advogado_recovery_codes  | true | false

-- 2. Confirma a política criada em advogado_recovery_codes:
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'advogado_recovery_codes';
-- Resultado esperado (1 linha):
--  backend_only_service_role | RESTRICTIVE | {service_role} | ALL | true | true

-- 3. Confirma que __EFMigrationsHistory tem RLS mas SEM políticas:
SELECT count(*) AS total_policies
FROM pg_policies
WHERE tablename = '__EFMigrationsHistory';
-- Resultado esperado: 0 (zero políticas = deny all para anon/authenticated)
