import type { Papel } from '@/types';

/** Áreas do workspace e os papéis que lhes têm acesso (controlo de acesso por perfil). */
export const ACESSO = {
  painel: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'FARMACEUTICO'],
  pacientes: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA'],
  consultas: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA'],
  atendimento: ['ADMINISTRADOR', 'MEDICO'],
  historicoClinico: ['ADMINISTRADOR', 'MEDICO'],
  medicos: ['ADMINISTRADOR', 'RECEPCIONISTA'],
  medicamentos: ['ADMINISTRADOR', 'MEDICO', 'FARMACEUTICO'],
  requisicoes: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'FARMACEUTICO'],
  pagamentos: ['ADMINISTRADOR', 'RECEPCIONISTA'],
  relatorios: ['ADMINISTRADOR'],
  utilizadores: ['ADMINISTRADOR'],
  auditoria: ['ADMINISTRADOR'],
  definicoes: ['ADMINISTRADOR'],
} satisfies Record<string, Papel[]>;

export type Area = keyof typeof ACESSO;

export function podeAceder(papel: Papel | undefined, area: Area) {
  return !!papel && (ACESSO[area] as Papel[]).includes(papel);
}

/** Operações de escrita restritas */
export const PODE_EDITAR = {
  pacientes: ['ADMINISTRADOR', 'RECEPCIONISTA'],
  consultas: ['ADMINISTRADOR', 'RECEPCIONISTA'],
  medicos: ['ADMINISTRADOR'],
  medicamentos: ['ADMINISTRADOR', 'FARMACEUTICO'],
  aprovarRequisicoes: ['ADMINISTRADOR'],
} satisfies Record<string, Papel[]>;

export function podeEditar(papel: Papel | undefined, area: keyof typeof PODE_EDITAR) {
  return !!papel && (PODE_EDITAR[area] as Papel[]).includes(papel);
}
