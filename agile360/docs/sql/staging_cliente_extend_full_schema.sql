-- ============================================================
-- Agile360 – Patch de schema para staging_cliente
--
-- Objetivo: alinhar staging_cliente com todos os campos relevantes
-- da tabela cliente (endereço completo, estado civil, dados financeiros).
--
-- IMPORTANTE:
-- - Execute no banco Supabase **onde já existe** a tabela staging_cliente.
-- - Todas as colunas novas são opcionais (NULLable).
-- - Apenas colunas ausentes serão criadas (IF NOT EXISTS).
-- ============================================================

ALTER TABLE public.staging_cliente
    ADD COLUMN IF NOT EXISTS cep             varchar(9),
    ADD COLUMN IF NOT EXISTS estado          varchar(2),
    ADD COLUMN IF NOT EXISTS cidade          varchar(100),
    ADD COLUMN IF NOT EXISTS numero          varchar(20),
    ADD COLUMN IF NOT EXISTS bairro          varchar(100),
    ADD COLUMN IF NOT EXISTS complemento     varchar(100),
    ADD COLUMN IF NOT EXISTS estado_civil    varchar(20),
    ADD COLUMN IF NOT EXISTS numero_conta    varchar(50),
    ADD COLUMN IF NOT EXISTS pix             varchar(100);

COMMENT ON COLUMN public.staging_cliente.cep          IS 'CEP informado pelo bot n8n (texto livre).';
COMMENT ON COLUMN public.staging_cliente.estado       IS 'UF (ex: SP, RJ).';
COMMENT ON COLUMN public.staging_cliente.cidade       IS 'Cidade informada pelo bot.';
COMMENT ON COLUMN public.staging_cliente.numero       IS 'Número do endereço.';
COMMENT ON COLUMN public.staging_cliente.bairro       IS 'Bairro do endereço.';
COMMENT ON COLUMN public.staging_cliente.complemento  IS 'Complemento do endereço.';
COMMENT ON COLUMN public.staging_cliente.estado_civil IS 'Estado civil textual (Solteiro, Casado, etc.).';
COMMENT ON COLUMN public.staging_cliente.numero_conta IS 'Número de conta bancária informado pelo cliente.';
COMMENT ON COLUMN public.staging_cliente.pix          IS 'Chave PIX informada pelo cliente.';

