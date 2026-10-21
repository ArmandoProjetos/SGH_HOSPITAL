-- ========================================================
-- SISTEMA INTEGRADO DE GESTÃO HOSPITALAR & CLÍNICA (SGH)
-- Base de Dados Oficial em PostgreSQL / Supabase (Arquitetura MVC)
-- ========================================================

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE HOSPITAIS (MULTI-TENANT WORKSPACE)
CREATE TABLE IF NOT EXISTS hospitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    nuit VARCHAR(30),
    endereco TEXT,
    telefone VARCHAR(50),
    email VARCHAR(150),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE PERFIS DE UTILIZADORES (RBAC: 4 PERFIS)
CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    papel VARCHAR(30) NOT NULL DEFAULT 'RECEPCIONISTA' CHECK (papel IN ('ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'FARMACEUTICO')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. CONVITES PARA EQUIPA HOSPITALAR
CREATE TABLE IF NOT EXISTS convites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    papel VARCHAR(30) NOT NULL DEFAULT 'RECEPCIONISTA' CHECK (papel IN ('ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'FARMACEUTICO')),
    aceite BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE ESPECIALIDADES MÉDICAS
CREATE TABLE IF NOT EXISTS especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    preco_consulta DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE MÉDICOS (CORPO CLÍNICO)
CREATE TABLE IF NOT EXISTS medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
    especialidade_id UUID REFERENCES especialidades(id) ON DELETE SET NULL,
    nome VARCHAR(150) NOT NULL,
    numero_ordem VARCHAR(50) NOT NULL UNIQUE,
    telefone VARCHAR(50),
    email VARCHAR(150),
    sala VARCHAR(50) DEFAULT 'Consultório 101',
    horario VARCHAR(100) DEFAULT 'Segunda a Sexta, 08h - 16h',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_processo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(180) NOT NULL,
    documento VARCHAR(50),
    nuit VARCHAR(30),
    data_nascimento DATE NOT NULL,
    genero VARCHAR(10) NOT NULL CHECK (genero IN ('M', 'F')),
    grupo_sanguineo VARCHAR(10) DEFAULT 'O+',
    telefone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    endereco VARCHAR(255),
    alergias TEXT DEFAULT 'Nenhuma alergia relatada',
    observacoes TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABELA DE CONSULTAS / AGENDAMENTOS
CREATE TABLE IF NOT EXISTS consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    especialidade_id UUID REFERENCES especialidades(id) ON DELETE SET NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'AGENDADA' CHECK (estado IN ('AGENDADA', 'SALA_ESPERA', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA')),
    prioridade VARCHAR(30) NOT NULL DEFAULT 'NORMAL' CHECK (prioridade IN ('NORMAL', 'PRIORITARIO', 'URGENTE')),
    motivo TEXT,
    motivo_cancelamento TEXT,
    valor DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TABELA DE ATENDIMENTOS CLÍNICOS / PRONTUÁRIO ELETRÓNICO
CREATE TABLE IF NOT EXISTS atendimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    pressao_arterial VARCHAR(30),
    temperatura DECIMAL(4,1),
    peso DECIMAL(5,2),
    frequencia_cardiaca INTEGER,
    sintomas TEXT NOT NULL,
    diagnostico TEXT NOT NULL,
    conduta TEXT,
    orientacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. TABELA DE MEDICAMENTOS (FARMÁCIA & STOCK)
CREATE TABLE IF NOT EXISTS medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    principio_activo VARCHAR(150) NOT NULL,
    dosagem VARCHAR(50) NOT NULL,
    forma VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 100,
    stock_minimo INTEGER NOT NULL DEFAULT 20,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. ITENS DE PRESCRIÇÃO MÉDICA (RECEITUÁRIO)
CREATE TABLE IF NOT EXISTS prescricao_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL,
    medicamento_nome VARCHAR(150) NOT NULL,
    posologia VARCHAR(255) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    duracao VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. TABELA DE PAGAMENTOS / CAIXA & FATURAÇÃO
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_recibo VARCHAR(50) NOT NULL UNIQUE,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(30) NOT NULL DEFAULT 'DINHEIRO' CHECK (metodo IN ('DINHEIRO', 'CARTAO', 'MPESA', 'EMOLA', 'TRANSFERENCIA')),
    referencia VARCHAR(100),
    recebido_por VARCHAR(150),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. TABELA DE AUDITORIA & SEGURANÇA
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilizador VARCHAR(150) NOT NULL,
    accao VARCHAR(50) NOT NULL,
    entidade VARCHAR(80) NOT NULL,
    detalhes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. TABELA DE REQUISIÇÕES & AQUISIÇÕES HOSPITALARES
CREATE TABLE IF NOT EXISTS requisicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    solicitante_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
    solicitante_nome VARCHAR(150) NOT NULL,
    solicitante_papel VARCHAR(30) NOT NULL,
    tipo VARCHAR(40) NOT NULL DEFAULT 'AQUISICAO_MEDICAMENTO' CHECK (tipo IN ('AQUISICAO_MEDICAMENTO', 'MATERIAL_CLINICO', 'EQUIPAMENTO', 'EXPEDIENTE')),
    titulo VARCHAR(200) NOT NULL,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    unidade VARCHAR(40) NOT NULL DEFAULT 'Unidades',
    valor_estimado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    prioridade VARCHAR(30) NOT NULL DEFAULT 'NORMAL' CHECK (prioridade IN ('NORMAL', 'PRIORITARIO', 'URGENTE')),
    justificativa TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (estado IN ('PENDENTE', 'APROVADA', 'REJEITADA', 'RECEBIDA_STOCK')),
    aprovado_por VARCHAR(150),
    despacho_direcao TEXT,
    data_decisao TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Garantir suporte aos 4 perfis em bases já existentes
ALTER TABLE perfis DROP CONSTRAINT IF EXISTS perfis_papel_check;
ALTER TABLE perfis ADD CONSTRAINT perfis_papel_check CHECK (papel IN ('ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'FARMACEUTICO'));

ALTER TABLE convites DROP CONSTRAINT IF EXISTS convites_papel_check;
ALTER TABLE convites ADD CONSTRAINT convites_papel_check CHECK (papel IN ('ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'FARMACEUTICO'));

-- ========================================================
-- POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- ========================================================
ALTER TABLE hospitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescricao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas caso o script seja re-executado
DROP POLICY IF EXISTS "Permitir leitura de hospitais para autenticados" ON hospitais;
DROP POLICY IF EXISTS "Permitir perfis para autenticados" ON perfis;
DROP POLICY IF EXISTS "Permitir convites para autenticados" ON convites;
DROP POLICY IF EXISTS "Permitir especialidades para autenticados" ON especialidades;
DROP POLICY IF EXISTS "Permitir medicos para autenticados" ON medicos;
DROP POLICY IF EXISTS "Permitir pacientes para autenticados" ON pacientes;
DROP POLICY IF EXISTS "Permitir consultas para autenticados" ON consultas;
DROP POLICY IF EXISTS "Permitir atendimentos para autenticados" ON atendimentos;
DROP POLICY IF EXISTS "Permitir medicamentos para autenticados" ON medicamentos;
DROP POLICY IF EXISTS "Permitir prescricao_itens para autenticados" ON prescricao_itens;
DROP POLICY IF EXISTS "Permitir pagamentos para autenticados" ON pagamentos;
DROP POLICY IF EXISTS "Permitir auditoria para autenticados" ON auditoria;
DROP POLICY IF EXISTS "Permitir requisicoes para autenticados" ON requisicoes;

-- Criar políticas completas (SELECT, INSERT, UPDATE, DELETE) para utilizadores autenticados
CREATE POLICY "Permitir leitura de hospitais para autenticados" ON hospitais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir perfis para autenticados" ON perfis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir convites para autenticados" ON convites FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir especialidades para autenticados" ON especialidades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir medicos para autenticados" ON medicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir pacientes para autenticados" ON pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir consultas para autenticados" ON consultas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir atendimentos para autenticados" ON atendimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir medicamentos para autenticados" ON medicamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir prescricao_itens para autenticados" ON prescricao_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir pagamentos para autenticados" ON pagamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir auditoria para autenticados" ON auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir requisicoes para autenticados" ON requisicoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================================
-- TRIGGER AUTOMÁTICO DE REGISTO DE UTILIZADORES / HOSPITAIS
-- ========================================================
CREATE OR REPLACE FUNCTION public.lidar_com_novo_utilizador()
RETURNS TRIGGER AS $$
DECLARE
    novo_hospital_id UUID;
    hospital_existente_id UUID;
BEGIN
    -- Verificar se existe convite pendente para este email
    SELECT hospital_id INTO hospital_existente_id FROM public.convites WHERE email = NEW.email AND NOT aceite LIMIT 1;

    IF hospital_existente_id IS NOT NULL THEN
        -- Associar ao hospital do convite
        INSERT INTO public.perfis (id, hospital_id, nome, email, papel, activo)
        VALUES (
            NEW.id,
            hospital_existente_id,
            COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
            NEW.email,
            (SELECT papel FROM public.convites WHERE email = NEW.email LIMIT 1),
            true
        );
        UPDATE public.convites SET aceite = true WHERE email = NEW.email;
    ELSE
        -- Criar nova organização hospitalar
        INSERT INTO public.hospitais (nome, nuit, endereco, telefone, email)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'hospital_nome', 'Hospital Geral & Centro Clínico'),
            NEW.raw_user_meta_data->>'hospital_nuit',
            NEW.raw_user_meta_data->>'hospital_endereco',
            NEW.raw_user_meta_data->>'hospital_telefone',
            NEW.email
        )
        RETURNING id INTO novo_hospital_id;

        -- Criar perfil do administrador
        INSERT INTO public.perfis (id, hospital_id, nome, email, papel, activo)
        VALUES (
            NEW.id,
            novo_hospital_id,
            COALESCE(NEW.raw_user_meta_data->>'nome', 'Administrador'),
            NEW.email,
            'ADMINISTRADOR',
            true
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado após criação de novo utilizador no Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.lidar_com_novo_utilizador();

-- ========================================================
-- DADOS INICIAIS DE DEMONSTRAÇÃO (SEEDS)
-- ========================================================

-- Hospital de demonstração padrão
INSERT INTO hospitais (id, nome, nuit, endereco, telefone, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Hospital Geral & Centro Clínico',
    '400928172',
    'Av. Eduardo Mondlane, Nº 1420, Maputo, Moçambique',
    '+258 21 490 800',
    'contacto@hospitalgeral.co.mz'
) ON CONFLICT (id) DO NOTHING;

-- Especialidades
INSERT INTO especialidades (id, nome, preco_consulta, activo) VALUES
('b0000000-0000-0000-0000-000000000001', 'Clínica Geral', 1500.00, true),
('b0000000-0000-0000-0000-000000000002', 'Cardiologia', 2800.00, true),
('b0000000-0000-0000-0000-000000000003', 'Pediatria', 1800.00, true),
('b0000000-0000-0000-0000-000000000004', 'Neurologia', 3000.00, true),
('b0000000-0000-0000-0000-000000000005', 'Ortopedia', 2500.00, true)
ON CONFLICT (id) DO NOTHING;

-- Médicos
INSERT INTO medicos (id, especialidade_id, nome, numero_ordem, telefone, email, sala, horario, activo) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Dr. Lucas Silveira', 'OMM-4820/CG', '+258 84 100 2030', 'lucas.silveira@hospitalgeral.co.mz', 'Consultório 101', 'Segunda a Sexta, 08h - 16h', true),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Dra. Sarah Mitchell', 'OMM-5120/CAR', '+258 84 310 1122', 'sarah.mitchell@hospitalgeral.co.mz', 'Consultório 201', 'Terça e Quinta, 09h - 17h', true),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Dra. Emily Johnson', 'OMM-6210/PED', '+258 84 310 3344', 'emily.johnson@hospitalgeral.co.mz', 'Ala Pediátrica 102', 'Segunda a Sexta, 08h - 14h', true)
ON CONFLICT (id) DO NOTHING;

-- Medicamentos
INSERT INTO medicamentos (id, nome, principio_activo, dosagem, forma, stock, stock_minimo, activo) VALUES
('d0000000-0000-0000-0000-000000000001', 'Amoxicilina + Clavulanato', 'Amoxicilina', '875mg + 125mg', 'Comprimido', 120, 30, true),
('d0000000-0000-0000-0000-000000000002', 'Paracetamol', 'Paracetamol', '500mg', 'Comprimido', 250, 50, true),
('d0000000-0000-0000-0000-000000000003', 'Ibuprofeno', 'Ibuprofeno', '400mg', 'Comprimido', 85, 25, true),
('d0000000-0000-0000-0000-000000000004', 'Losartana Potássica', 'Losartana', '50mg', 'Comprimido', 14, 20, true),
('d0000000-0000-0000-0000-000000000005', 'Omeprazol', 'Omeprazol', '20mg', 'Cápsula', 90, 20, true)
ON CONFLICT (id) DO NOTHING;

-- Paciente Exemplo
INSERT INTO pacientes (id, numero_processo, nome, documento, nuit, data_nascimento, genero, grupo_sanguineo, telefone, email, endereco, alergias, observacoes, activo)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'P2026-00001',
    'Fernando Manuel Macamo',
    '110298374019B',
    '109283741',
    '1988-06-14',
    'M',
    'O+',
    '+258 84 892 1092',
    'f.macamo@gmail.com',
    'Bairro da Polana Cimento, Rua de Kasuende, Nº 45, Maputo',
    'Penicilina e Dipirona',
    'Paciente hipertenso sob controlo ambulatório regular.',
    true
) ON CONFLICT (id) DO NOTHING;

-- Consulta Exemplo
INSERT INTO consultas (id, paciente_id, medico_id, especialidade_id, data_hora, estado, prioridade, motivo, valor)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    timezone('utc'::text, now()),
    'SALA_ESPERA',
    'NORMAL',
    'Cefaleia e dores musculares',
    1500.00
) ON CONFLICT (id) DO NOTHING;

-- Pagamento Exemplo
INSERT INTO pagamentos (id, numero_recibo, paciente_id, consulta_id, descricao, valor, metodo, referencia, recebido_por)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'R2026-00001',
    'e0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'Consulta de Clínica Geral',
    1500.00,
    'MPESA',
    'MP260225.8812',
    'Administrador Hospitalar'
) ON CONFLICT (id) DO NOTHING;

-- Requisição de Aquisição Exemplo
INSERT INTO requisicoes (id, codigo, solicitante_nome, solicitante_papel, tipo, titulo, medicamento_id, quantidade, unidade, valor_estimado, prioridade, justificativa, estado)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'REQ-2026-00001',
    'Dr. Tomás Sitoe (Farmacêutico Chefe)',
    'FARMACEUTICO',
    'AQUISICAO_MEDICAMENTO',
    'Reposição de Stock: Losartana Potássica 50mg',
    'd0000000-0000-0000-0000-000000000004',
    150,
    'Caixas',
    22500.00,
    'URGENTE',
    'Stock actual (14 unidades) abaixo do mínimo de segurança (20 unidades).',
    'PENDENTE'
) ON CONFLICT (id) DO NOTHING;

-- Auditoria Inicial
INSERT INTO auditoria (utilizador, accao, entidade, detalhes)
VALUES (
    'Sistema',
    'INICIALIZACAO',
    'PLATAFORMA',
    'Base hospitalar configurada com sucesso.'
);
