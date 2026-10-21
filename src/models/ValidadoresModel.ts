/**
 * ============================================================================
 * CAMADA MODEL (MVC) — Regras de Validação, Unicidade e Integridade Relacional
 * ============================================================================
 */

import type {
  Atendimento,
  Consulta,
  Medicamento,
  Medico,
  Paciente,
  Pagamento,
  Perfil,
  PrescricaoItem,
  Requisicao,
} from '@/models';

export interface ResultadoValidacao {
  valido: boolean;
  erro?: string;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_NUIT = /^\d{9}$/;
const REGEX_BI = /^[A-Za-z0-9\-\/]{6,18}$/;

export function validarEmail(email: string, obrigatorio = false): ResultadoValidacao {
  const limpo = (email || '').trim();
  if (!limpo) {
    return obrigatorio
      ? { valido: false, erro: 'O endereço de e-mail é obrigatório.' }
      : { valido: true };
  }
  if (!REGEX_EMAIL.test(limpo)) {
    return { valido: false, erro: 'Formato de e-mail inválido (ex: nome@dominio.com).' };
  }
  return { valido: true };
}

export function validarDocumentoBI(documento: string, obrigatorio = false): ResultadoValidacao {
  const limpo = (documento || '').trim();
  if (!limpo) {
    return obrigatorio
      ? { valido: false, erro: 'O documento de identificação é obrigatório.' }
      : { valido: true };
  }
  if (!REGEX_BI.test(limpo)) {
    return {
      valido: false,
      erro: 'O número de identificação (BI / Passaporte) deve conter entre 6 e 18 caracteres alfanuméricos.',
    };
  }
  return { valido: true };
}

export function validarNuit(nuit: string, obrigatorio = false): ResultadoValidacao {
  const limpo = (nuit || '').replace(/\s+/g, '');
  if (!limpo) {
    return obrigatorio
      ? { valido: false, erro: 'O NUIT é obrigatório.' }
      : { valido: true };
  }
  if (!REGEX_NUIT.test(limpo)) {
    return { valido: false, erro: 'O NUIT deve conter exactamente 9 dígitos numéricos.' };
  }
  return { valido: true };
}

export const validarNUIT = validarNuit;

export function validarTelefone(telefone: string, obrigatorio = true): ResultadoValidacao {
  const limpo = (telefone || '').trim();
  if (!limpo) {
    return obrigatorio
      ? { valido: false, erro: 'O número de telefone é obrigatório.' }
      : { valido: true };
  }
  const digitos = limpo.replace(/\D/g, '');
  if (digitos.length < 8 || digitos.length > 15) {
    return { valido: false, erro: 'Informe um número de telefone válido (mínimo de 8 dígitos).' };
  }
  return { valido: true };
}

export function validarPacienteInput(
  input: {
    nome: string;
    documento?: string | null;
    nuit?: string | null;
    data_nascimento: string;
    telefone: string;
    email?: string | null;
  },
  existentes: Paciente[],
  ignorarId?: string,
): ResultadoValidacao {
  if (!input.nome.trim() || input.nome.trim().length < 3) {
    return { valido: false, erro: 'O nome completo do paciente é obrigatório (mínimo 3 caracteres).' };
  }
  if (!input.telefone.trim()) {
    return { valido: false, erro: 'O número de telefone do paciente é obrigatório.' };
  }
  const rTel = validarTelefone(input.telefone, true);
  if (!rTel.valido) return rTel;

  if (!input.data_nascimento) {
    return { valido: false, erro: 'A data de nascimento é obrigatória.' };
  }
  if (new Date(input.data_nascimento) > new Date()) {
    return { valido: false, erro: 'A data de nascimento não pode ser uma data futura.' };
  }

  if (input.documento?.trim()) {
    const rBI = validarDocumentoBI(input.documento);
    if (!rBI.valido) return rBI;
    const docNorm = input.documento.trim().toLowerCase();
    const duplicadoBI = existentes.find(
      (p) => p.id !== ignorarId && p.documento && p.documento.trim().toLowerCase() === docNorm,
    );
    if (duplicadoBI) {
      return {
        valido: false,
        erro: `Já existe um paciente registado com este documento de identificação (${duplicadoBI.nome} — ${duplicadoBI.numero_processo}).`,
      };
    }
  }

  if (input.nuit?.trim()) {
    const rNuit = validarNuit(input.nuit);
    if (!rNuit.valido) return rNuit;
    const nuitNorm = input.nuit.replace(/\s+/g, '');
    const duplicadoNuit = existentes.find(
      (p) => p.id !== ignorarId && p.nuit && p.nuit.replace(/\s+/g, '') === nuitNorm,
    );
    if (duplicadoNuit) {
      return {
        valido: false,
        erro: `Já existe um paciente registado com este NUIT (${duplicadoNuit.nome} — ${duplicadoNuit.numero_processo}).`,
      };
    }
  }

  if (input.email?.trim()) {
    const rEmail = validarEmail(input.email);
    if (!rEmail.valido) return rEmail;
    const emailNorm = input.email.trim().toLowerCase();
    const duplicadoEmail = existentes.find(
      (p) => p.id !== ignorarId && p.email && p.email.trim().toLowerCase() === emailNorm,
    );
    if (duplicadoEmail) {
      return {
        valido: false,
        erro: `Já existe um paciente registado com este e-mail (${duplicadoEmail.nome}).`,
      };
    }
  }

  return { valido: true };
}

export function validarMedicoInput(
  input: {
    nome: string;
    numero_ordem: string;
    especialidade_id?: string | null;
    telefone?: string | null;
    email?: string | null;
  },
  existentes: Medico[],
  ignorarId?: string,
): ResultadoValidacao {
  if (!input.nome.trim() || input.nome.trim().length < 3) {
    return { valido: false, erro: 'O nome completo do médico é obrigatório.' };
  }
  const ordemLimpa = input.numero_ordem.trim();
  if (!ordemLimpa || ordemLimpa.length < 4 || ordemLimpa.toUpperCase() === 'OMM-') {
    return {
      valido: false,
      erro: 'Informe um número de inscrição na Ordem dos Médicos (OMM) válido (ex: OMM-4820/CG).',
    };
  }

  const duplicadoOrdem = existentes.find(
    (m) => m.id !== ignorarId && m.numero_ordem.trim().toLowerCase() === ordemLimpa.toLowerCase(),
  );
  if (duplicadoOrdem) {
    return {
      valido: false,
      erro: `Já existe um médico registado com o número de ordem ${ordemLimpa} (${duplicadoOrdem.nome}).`,
    };
  }

  if (input.telefone?.trim()) {
    const rTel = validarTelefone(input.telefone, false);
    if (!rTel.valido) return rTel;
  }

  if (input.email?.trim()) {
    const rEmail = validarEmail(input.email);
    if (!rEmail.valido) return rEmail;
    const emailNorm = input.email.trim().toLowerCase();
    const duplicadoEmail = existentes.find(
      (m) => m.id !== ignorarId && m.email && m.email.trim().toLowerCase() === emailNorm,
    );
    if (duplicadoEmail) {
      return {
        valido: false,
        erro: `Já existe um médico registado com este e-mail (${duplicadoEmail.nome}).`,
      };
    }
  }

  return { valido: true };
}

export function validarMedicamentoInput(
  input: {
    nome: string;
    principio_activo: string;
    dosagem: string;
    forma: string;
    stock: number;
    stock_minimo: number;
  },
  existentes: Medicamento[],
  ignorarId?: string,
): ResultadoValidacao {
  if (!input.nome.trim() || !input.principio_activo.trim() || !input.dosagem.trim()) {
    return {
      valido: false,
      erro: 'Nome comercial, princípio activo e dosagem são campos obrigatórios.',
    };
  }
  if (input.stock < 0 || input.stock_minimo < 1) {
    return {
      valido: false,
      erro: 'O stock inicial não pode ser negativo e o stock mínimo deve ser pelo menos 1.',
    };
  }

  const chaveNome = input.nome.trim().toLowerCase();
  const chaveDosagem = input.dosagem.trim().toLowerCase();
  const chaveForma = input.forma.trim().toLowerCase();

  const duplicado = existentes.find(
    (m) =>
      m.id !== ignorarId &&
      m.nome.trim().toLowerCase() === chaveNome &&
      m.dosagem.trim().toLowerCase() === chaveDosagem &&
      m.forma.trim().toLowerCase() === chaveForma,
  );
  if (duplicado) {
    return {
      valido: false,
      erro: `Este medicamento (${duplicado.nome} • ${duplicado.dosagem} • ${duplicado.forma}) já se encontra registado no catálogo.`,
    };
  }

  return { valido: true };
}

export function validarPerfilInput(
  input: {
    nome: string;
    email: string;
    senha?: string;
  },
  existentes: Perfil[],
  ignorarId?: string,
): ResultadoValidacao {
  if (!input.nome.trim() || input.nome.trim().length < 3) {
    return { valido: false, erro: 'O nome completo do colaborador é obrigatório.' };
  }
  const rEmail = validarEmail(input.email, true);
  if (!rEmail.valido) return rEmail;

  const emailNorm = input.email.trim().toLowerCase();
  const duplicado = existentes.find(
    (p) => p.id !== ignorarId && p.email.trim().toLowerCase() === emailNorm,
  );
  if (duplicado) {
    return {
      valido: false,
      erro: `Já existe um utilizador registado com o e-mail ${emailNorm} (${duplicado.nome}).`,
    };
  }

  if (input.senha !== undefined && input.senha.length < 6) {
    return { valido: false, erro: 'A palavra-passe deve conter no mínimo 6 caracteres.' };
  }

  return { valido: true };
}

/**
 * Verifica integridade referencial antes de eliminar um registo (Requisito e).
 */
export function verificarRestricaoEliminacao(
  tabela: string,
  id: string,
  contexto: {
    consultas: Consulta[];
    atendimentos: Atendimento[];
    pagamentos: Pagamento[];
    prescricao_itens: PrescricaoItem[];
    requisicoes: Requisicao[];
    medicos: Medico[];
    usuarioAtualId?: string;
  },
): ResultadoValidacao {
  if (tabela === 'pacientes') {
    const qtdConsultas = contexto.consultas.filter((c) => c.paciente_id === id).length;
    const qtdAtendimentos = contexto.atendimentos.filter((a) => a.paciente_id === id).length;
    const qtdPagamentos = contexto.pagamentos.filter((p) => p.paciente_id === id).length;
    if (qtdConsultas > 0 || qtdAtendimentos > 0 || qtdPagamentos > 0) {
      return {
        valido: false,
        erro: `Não é possível eliminar este paciente porque possui registos clínicos ou financeiros vinculados (${qtdConsultas} consulta(s), ${qtdAtendimentos} atendimento(s), ${qtdPagamentos} recibo(s)). Por integridade hospitalar, inative o paciente ou elimine primeiro os registos dependentes.`,
      };
    }
  }

  if (tabela === 'medicos') {
    const qtdConsultas = contexto.consultas.filter((c) => c.medico_id === id).length;
    const qtdAtendimentos = contexto.atendimentos.filter((a) => a.medico_id === id).length;
    if (qtdConsultas > 0 || qtdAtendimentos > 0) {
      return {
        valido: false,
        erro: `Não é possível eliminar este médico porque possui ${qtdConsultas} consulta(s) e ${qtdAtendimentos} atendimento(s) vinculados no histórico clínico. Inative o registo ou reatribua as consultas primeiro.`,
      };
    }
  }

  if (tabela === 'medicamentos') {
    const qtdPrescricoes = contexto.prescricao_itens.filter((i) => i.medicamento_id === id).length;
    const qtdRequisicoes = contexto.requisicoes.filter((r) => r.medicamento_id === id).length;
    if (qtdPrescricoes > 0 || qtdRequisicoes > 0) {
      return {
        valido: false,
        erro: `Não é possível eliminar este medicamento porque está associado a ${qtdPrescricoes} prescrição(ões) médica(s) e ${qtdRequisicoes} requisição(ões). Desactive o fármaco para preservar o histórico.`,
      };
    }
  }

  if (tabela === 'consultas') {
    const temAtendimento = contexto.atendimentos.some((a) => a.consulta_id === id);
    const temPagamento = contexto.pagamentos.some((p) => p.consulta_id === id);
    if (temAtendimento || temPagamento) {
      return {
        valido: false,
        erro: 'Não é possível eliminar uma consulta que já possui prontuário médico fechado ou recibo de pagamento emitido.',
      };
    }
  }

  if (tabela === 'perfis') {
    if (contexto.usuarioAtualId && id === contexto.usuarioAtualId) {
      return {
        valido: false,
        erro: 'Não é permitido eliminar a sua própria conta com sessão iniciada.',
      };
    }
    const temMedicoVinculado = contexto.medicos.some((m) => m.perfil_id === id);
    if (temMedicoVinculado) {
      return {
        valido: false,
        erro: 'Este colaborador possui um registo vinculado no Corpo Clínico. Remova ou desvincule o médico antes de eliminar a conta.',
      };
    }
  }

  return { valido: true };
}
