-- ============================================================
-- Script: apply_recovery_codes_table.sql
-- Gerado em: 2026-03-10 14:51:16 UTC
-- Origem: Migration 20260309194614_AddRecoveryCodesTable
--
-- INSTRUÃ‡Ã•ES PARA O @data-engineer:
--   1. Abra o Supabase Dashboard > SQL Editor
--   2. Cole este script e execute
--   3. Verifique que a tabela foi criada em Database > Tables
--
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS em todos os DDLs
-- ============================================================

-- Cria a tabela de cÃ³digos de recuperaÃ§Ã£o MFA
CREATE TABLE IF NOT EXISTS "advogado_recovery_codes" (
    "Id"           uuid                        NOT NULL,
    "advogado_id"  uuid                        NOT NULL,
    "code_hash"    character varying(100)      NOT NULL,
    "is_used"      boolean                     NOT NULL DEFAULT false,
    "used_at"      timestamp with time zone    NULL,
    "created_at"   timestamp with time zone    NOT NULL,
    CONSTRAINT "PK_advogado_recovery_codes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_advogado_recovery_codes_advogado_advogado_id"
        FOREIGN KEY ("advogado_id")
        REFERENCES "advogado" ("Id")
        ON DELETE CASCADE
);

-- Ãndice composto para busca rÃ¡pida: cÃ³digos ativos de um advogado
CREATE INDEX IF NOT EXISTS "ix_recovery_codes_advogado_active"
    ON "advogado_recovery_codes" ("advogado_id", "is_used");

-- Registra a migration no histÃ³rico do EF Core
-- (evita que dotnet ef database update tente re-aplicÃ¡-la no futuro)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260309194614_AddRecoveryCodesTable', '9.0.1')
ON CONFLICT ("MigrationId") DO NOTHING;

-- VerificaÃ§Ã£o: exibe estrutura da tabela criada
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'advogado_recovery_codes'
ORDER BY ordinal_position;
