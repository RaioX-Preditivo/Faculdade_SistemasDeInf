-- ============================================================
-- Script: apply_recovery_codes_table.sql
-- Origem: Migration 20260309194614_AddRecoveryCodesTable
--
-- CONVENÇÃO CRÍTICA DO PROJETO:
--   O banco Supabase usa estritamente LOWERCASE para todos os
--   identificadores (colunas, tabelas, constraints, índices).
--   Nunca use PascalCase ou camelCase entre aspas em scripts SQL.
--
-- INSTRUÇÕES:
--   Supabase Dashboard → SQL Editor → cole e execute
--   SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS
-- ============================================================

-- Cria a tabela de códigos de recuperação MFA
-- Todas as colunas em lowercase (snake_case), alinhado com
-- UseSnakeCaseNamingConvention() do EF Core em runtime.
CREATE TABLE IF NOT EXISTS "advogado_recovery_codes" (
    "id"          uuid                     NOT NULL,
    "advogado_id" uuid                     NOT NULL,
    "code_hash"   character varying(100)   NOT NULL,
    "is_used"     boolean                  NOT NULL DEFAULT false,
    "used_at"     timestamp with time zone          DEFAULT NULL,
    "created_at"  timestamp with time zone NOT NULL,
    CONSTRAINT "pk_advogado_recovery_codes"
        PRIMARY KEY ("id"),
    CONSTRAINT "fk_advogado_recovery_codes_advogado_advogado_id"
        FOREIGN KEY ("advogado_id")
        REFERENCES "advogado" ("id")
        ON DELETE CASCADE
);

-- Índice composto para busca rápida de códigos ativos
CREATE INDEX IF NOT EXISTS "ix_recovery_codes_advogado_active"
    ON "advogado_recovery_codes" ("advogado_id", "is_used");

-- Registra a migration no histórico do EF Core
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260309194614_AddRecoveryCodesTable', '9.0.1')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verificação
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'advogado_recovery_codes'
ORDER BY ordinal_position;
