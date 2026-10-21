/**
 * ============================================================================
 * CAMADA MODEL (MVC) — Definição das Entidades e Estrutura de Dados do SGH
 * ============================================================================
 * Representa o modelo de dados relacional do Sistema de Gestão Hospitalar,
 * mapeado directamente para as tabelas do PostgreSQL / Supabase.
 */

export type Papel = 'ADMINISTRADOR' | 'MEDICO' | 'RECEPCIONISTA' | 'FARMACEUTICO';
export type EstadoConsulta = 'AGENDADA' | 'SALA_ESPERA' | 'EM_ATENDIMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type MetodoPagamento = 'DINHEIRO' | 'CARTAO' | 'MPESA' | 'EMOLA' | 'TRANSFERENCIA';
export type Prioridade = 'NORMAL' | 'PRIORITARIO' | 'URGENTE';
export type TipoRequisicao = 'AQUISICAO_MEDICAMENTO' | 'MATERIAL_CLINICO' | 'EQUIPAMENTO' | 'EXPEDIENTE';
export type EstadoRequisicao = 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'RECEBIDA_STOCK';

export interface Hospital {
  id: string;
  nome: string;
  nuit: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  criado_em: string;
}

export interface Perfil {
  id: string;
  hospital_id: string;
  nome: string;
  email: string;
  papel: Papel;
  activo: boolean;
  criado_em: string;
}

export interface Convite {
  id: string;
  hospital_id: string;
  email: string;
  nome: string;
  papel: Papel;
  aceite: boolean;
  criado_em: string;
}

export interface Especialidade {
  id: string;
  nome: string;
  preco_consulta: number;
  activo: boolean;
  criado_em: string;
}

export interface Medico {
  id: string;
  perfil_id: string | null;
  especialidade_id: string | null;
  nome: string;
  numero_ordem: string;
  telefone: string | null;
  email: string | null;
  sala: string | null;
  horario: string | null;
  activo: boolean;
  criado_em: string;
}

export interface Paciente {
  id: string;
  numero_processo: string;
  nome: string;
  documento: string | null;
  nuit: string | null;
  data_nascimento: string;
  genero: 'M' | 'F';
  grupo_sanguineo: string | null;
  telefone: string;
  email: string | null;
  endereco: string | null;
  alergias: string | null;
  observacoes: string | null;
  activo: boolean;
  criado_em: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  medico_id: string;
  especialidade_id: string | null;
  data_hora: string;
  estado: EstadoConsulta;
  prioridade: Prioridade;
  motivo: string | null;
  motivo_cancelamento: string | null;
  valor: number;
  criado_em: string;
}

export interface Atendimento {
  id: string;
  consulta_id: string | null;
  paciente_id: string;
  medico_id: string;
  pressao_arterial: string | null;
  temperatura: number | null;
  peso: number | null;
  frequencia_cardiaca: number | null;
  sintomas: string;
  diagnostico: string;
  conduta: string | null;
  orientacoes: string | null;
  criado_em: string;
}

export interface PrescricaoItem {
  id: string;
  atendimento_id: string;
  medicamento_id: string | null;
  medicamento_nome: string;
  posologia: string;
  quantidade: number;
  duracao: string;
  criado_em: string;
}

export interface Medicamento {
  id: string;
  nome: string;
  principio_activo: string;
  dosagem: string;
  forma: string;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  criado_em: string;
}

export interface Requisicao {
  id: string;
  codigo: string;
  solicitante_id: string;
  solicitante_nome: string;
  solicitante_papel: Papel;
  tipo: TipoRequisicao;
  titulo: string;
  medicamento_id: string | null;
  quantidade: number;
  unidade: string;
  valor_estimado: number;
  prioridade: Prioridade;
  justificativa: string;
  estado: EstadoRequisicao;
  aprovado_por: string | null;
  despacho_direcao: string | null;
  data_decisao: string | null;
  criado_em: string;
}

export interface Pagamento {
  id: string;
  numero_recibo: string;
  paciente_id: string;
  consulta_id: string | null;
  descricao: string;
  valor: number;
  metodo: MetodoPagamento;
  referencia: string | null;
  recebido_por: string | null;
  criado_em: string;
}

export interface Auditoria {
  id: string;
  utilizador: string;
  accao: string;
  entidade: string;
  detalhes: string | null;
  criado_em: string;
}

export interface Tabelas {
  especialidades: Especialidade;
  medicos: Medico;
  pacientes: Paciente;
  consultas: Consulta;
  atendimentos: Atendimento;
  prescricao_itens: PrescricaoItem;
  medicamentos: Medicamento;
  requisicoes: Requisicao;
  pagamentos: Pagamento;
  auditoria: Auditoria;
  perfis: Perfil;
  convites: Convite;
}

export type NomeTabela = keyof Tabelas;

export const PAPEL_LABEL: Record<Papel, string> = {
  ADMINISTRADOR: 'Diretor / Administrador',
  MEDICO: 'Médico / Corpo Clínico',
  RECEPCIONISTA: 'Recepcionista & Caixa',
  FARMACEUTICO: 'Farmacêutico / Stock',
};

export const ESTADO_LABEL: Record<EstadoConsulta, string> = {
  AGENDADA: 'Agendada',
  SALA_ESPERA: 'Em espera',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const METODO_LABEL: Record<MetodoPagamento, string> = {
  DINHEIRO: 'Numerário',
  CARTAO: 'Cartão / POS',
  MPESA: 'M-Pesa',
  EMOLA: 'e-Mola',
  TRANSFERENCIA: 'Transferência',
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  NORMAL: 'Normal',
  PRIORITARIO: 'Prioritário',
  URGENTE: 'Urgente',
};

export const TIPO_REQUISICAO_LABEL: Record<TipoRequisicao, string> = {
  AQUISICAO_MEDICAMENTO: 'Aquisição / Reposição de Medicamento',
  MATERIAL_CLINICO: 'Material Clínico & Consumíveis',
  EQUIPAMENTO: 'Equipamento Médico / Hospitalar',
  EXPEDIENTE: 'Material de Expediente / Manutenção',
};

export const ESTADO_REQUISICAO_LABEL: Record<EstadoRequisicao, string> = {
  PENDENTE: 'Aguardando Diretor',
  APROVADA: 'Autorizada pelo Diretor',
  REJEITADA: 'Recusada pela Direção',
  RECEBIDA_STOCK: 'Concluída / Entrada no Stock',
};
