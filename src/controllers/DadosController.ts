/**
 * ============================================================================
 * SGH — CAMADA CONTROLLER (MVC): Controlador de Operações CRUD e Regras de Negócio
 * ============================================================================
 * Responsável por:
 * 1. Coordenar todas as operações de leitura (listar), criação (criar),
 *    actualização (editar) e eliminação (eliminar) entre as Views e o DatabaseModel.
 * 2. Garantir a integridade relacional antes da eliminação de registos
 *    (verificarRestricaoEliminacao).
 * 3. Registar automaticamente cada operação na tabela de auditoria.
 */

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { backend, type DadosColaborador } from '@/models/DatabaseModel';
import { verificarRestricaoEliminacao } from '@/models/ValidadoresModel';
import { useAuth } from '@/controllers/AuthController';
import type { Hospital, NomeTabela, Perfil, Tabelas } from '@/models';

export type Dados = { [K in NomeTabela]: Tabelas[K][] };
export type NovoRegisto<T extends NomeTabela> = Omit<Tabelas[T], 'id' | 'criado_em'>;

const TABELAS: NomeTabela[] = [
  'especialidades',
  'medicos',
  'pacientes',
  'consultas',
  'atendimentos',
  'prescricao_itens',
  'medicamentos',
  'requisicoes',
  'pagamentos',
  'auditoria',
  'perfis',
  'convites',
];

const VAZIO = Object.fromEntries(TABELAS.map((t) => [t, []])) as unknown as Dados;

export interface DadosContexto {
  dados: Dados;
  aCarregar: boolean;
  recarregar: () => Promise<void>;
  recarregarDados: () => Promise<void>;
  criar: <T extends NomeTabela>(tabela: T, registo: NovoRegisto<T>, descricao?: string) => Promise<Tabelas[T]>;
  adicionar: <T extends NomeTabela>(tabela: T, registo: NovoRegisto<T>, descricao?: string) => Promise<Tabelas[T]>;
  editar: <T extends NomeTabela>(tabela: T, id: string, alteracoes: Partial<Tabelas[T]>, descricao?: string) => Promise<Tabelas[T]>;
  eliminar: <T extends NomeTabela>(tabela: T, id: string, descricao?: string) => Promise<void>;
  criarColaborador: (dados: Omit<DadosColaborador, 'hospital_id'>) => Promise<Perfil>;
  proximoNumero: (tipo: 'processo' | 'recibo' | 'requisicao') => string;
  hospital: Hospital;
  atualizarHospital: (alteracoes: Partial<Hospital>) => Promise<Hospital>;
  // Acessores directos para as Views
  pacientes: Tabelas['pacientes'][];
  consultas: Tabelas['consultas'][];
  medicos: Tabelas['medicos'][];
  medicamentos: Tabelas['medicamentos'][];
  requisicoes: Tabelas['requisicoes'][];
  pagamentos: Tabelas['pagamentos'][];
  atendimentos: Tabelas['atendimentos'][];
  prescricao_itens: Tabelas['prescricao_itens'][];
  especialidades: Tabelas['especialidades'][];
  perfis: Tabelas['perfis'][];
  auditoria: Tabelas['auditoria'][];
  convites: Tabelas['convites'][];
}

const Ctx = createContext<DadosContexto | null>(null);

const ACCOES: Record<string, string> = {
  criar: 'CRIAR',
  editar: 'EDITAR',
  eliminar: 'ELIMINAR',
};

const HOSPITAL_PADRAO: Hospital = {
  id: 'hosp_padrao',
  nome: 'Hospital Privado de Maputo',
  nuit: '400987654',
  endereco: 'Av. Julius Nyerere, N.º 1240, Maputo, Moçambique',
  telefone: '+258 21 490 000',
  email: 'contacto@hospitalprivado.co.mz',
  criado_em: new Date().toISOString(),
};

export function DadosProvider({ children }: { children: ReactNode }) {
  const { sessao } = useAuth();
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [aCarregar, setACarregar] = useState(true);
  const [hospitalActual, setHospitalActual] = useState<Hospital>(sessao?.hospital || HOSPITAL_PADRAO);

  useEffect(() => {
    if (sessao?.hospital) {
      setHospitalActual(sessao.hospital);
    }
  }, [sessao?.hospital]);

  const recarregar = useCallback(async () => {
    setACarregar(true);
    const resultados = await Promise.all(
      TABELAS.map((t) =>
        backend.listar(t).catch(() => [] as unknown[]),
      ),
    );
    setDados(Object.fromEntries(TABELAS.map((t, i) => [t, resultados[i]])) as unknown as Dados);
    setACarregar(false);
  }, []);

  useEffect(() => {
    if (sessao) recarregar();
    else setDados(VAZIO);
  }, [sessao?.perfil.id, recarregar]);

  const registarAuditoria = useCallback(
    async (accao: string, entidade: string, detalhes?: string) => {
      if (!sessao) return;
      try {
        const log = await backend.inserir('auditoria', {
          utilizador: sessao.perfil.nome,
          accao,
          entidade,
          detalhes: detalhes ?? null,
        });
        setDados((d) => ({ ...d, auditoria: [log, ...d.auditoria] }));
      } catch {
        /* a auditoria nunca deve bloquear a operação principal */
      }
    },
    [sessao],
  );

  const criar = useCallback(
    async <T extends NomeTabela>(tabela: T, registo: NovoRegisto<T>, descricao?: string) => {
      const novo = await backend.inserir(tabela, registo as never);
      setDados((d) => ({ ...d, [tabela]: [novo, ...d[tabela]] }));
      if (tabela !== 'auditoria') registarAuditoria(ACCOES.criar, tabela, descricao);
      return novo as Tabelas[T];
    },
    [registarAuditoria],
  );

  const editar = useCallback(
    async <T extends NomeTabela>(tabela: T, id: string, alteracoes: Partial<Tabelas[T]>, descricao?: string) => {
      const actual = await backend.actualizar(tabela, id, alteracoes);
      setDados((d) => ({ ...d, [tabela]: (d[tabela] as Tabelas[T][]).map((l) => (l.id === id ? actual : l)) }));
      registarAuditoria(ACCOES.editar, tabela, descricao);
      return actual as Tabelas[T];
    },
    [registarAuditoria],
  );

  const eliminar = useCallback(
    async <T extends NomeTabela>(tabela: T, id: string, descricao?: string) => {
      // 1. Verificar integridade relacional antes de eliminar
      if (
        tabela === 'pacientes' ||
        tabela === 'medicos' ||
        tabela === 'medicamentos' ||
        tabela === 'consultas' ||
        tabela === 'especialidades'
      ) {
        const restricao = verificarRestricaoEliminacao(tabela, id, {
          consultas: dados.consultas,
          atendimentos: dados.atendimentos,
          pagamentos: dados.pagamentos,
          prescricao_itens: dados.prescricao_itens,
          requisicoes: dados.requisicoes,
          medicos: dados.medicos,
        });
        if (!restricao.valido) {
          throw new Error(restricao.erro || 'Não é possível eliminar este registo devido a dependências associadas.');
        }
      }

      // 2. Eliminar no Model (Base de Dados Supabase / Persistência)
      await backend.eliminar(tabela, id);

      // 3. Actualizar estado reactivo imediato
      setDados((d) => ({
        ...d,
        [tabela]: (d[tabela] as Tabelas[T][]).filter((l) => l.id !== id),
      }));

      // 4. Registar operação na auditoria
      if (tabela !== 'auditoria') {
        registarAuditoria(ACCOES.eliminar, tabela, descricao ?? `Eliminação de registo (${id}) em ${tabela}`);
      }
    },
    [dados, registarAuditoria],
  );

  const criarColaborador = useCallback(
    async (info: Omit<DadosColaborador, 'hospital_id'>) => {
      const novoPerfil = await backend.criarColaborador({
        ...info,
        hospital_id: hospitalActual.id,
      });
      setDados((d) => ({
        ...d,
        perfis: [novoPerfil, ...d.perfis.filter((p) => p.id !== novoPerfil.id)],
      }));
      registarAuditoria('CRIAR', 'perfis', `Credenciamento de funcionário: ${novoPerfil.nome} (${novoPerfil.papel})`);
      return novoPerfil;
    },
    [hospitalActual.id, registarAuditoria],
  );

  const proximoNumero = useCallback(
    (tipo: 'processo' | 'recibo' | 'requisicao') => {
      const ano = new Date().getFullYear();
      const prefixo = tipo === 'processo' ? `P${ano}-` : tipo === 'recibo' ? `R${ano}-` : `REQ-${ano}-`;
      const existentes =
        tipo === 'processo'
          ? dados.pacientes.map((p) => p.numero_processo)
          : tipo === 'recibo'
            ? dados.pagamentos.map((p) => p.numero_recibo)
            : dados.requisicoes.map((r) => r.codigo);
      const max = existentes
        .filter((n) => n.startsWith(prefixo))
        .map((n) => parseInt(n.slice(prefixo.length), 10) || 0)
        .reduce((a, b) => Math.max(a, b), 0);
      return prefixo + String(max + 1).padStart(4, '0');
    },
    [dados.pacientes, dados.pagamentos, dados.requisicoes],
  );

  const atualizarHospital = useCallback(
    async (alteracoes: Partial<Hospital>) => {
      const act = await backend.actualizarHospital(alteracoes);
      setHospitalActual(act);
      registarAuditoria('EDITAR', 'hospitais', `Atualização das definições da instituição ${act.nome}`);
      return act;
    },
    [registarAuditoria],
  );

  const valor = useMemo(
    () => ({
      dados,
      aCarregar,
      recarregar,
      recarregarDados: recarregar,
      criar,
      adicionar: criar,
      editar,
      eliminar,
      criarColaborador,
      proximoNumero,
      hospital: hospitalActual,
      atualizarHospital,
      pacientes: dados.pacientes,
      consultas: dados.consultas,
      medicos: dados.medicos,
      medicamentos: dados.medicamentos,
      requisicoes: dados.requisicoes,
      pagamentos: dados.pagamentos,
      atendimentos: dados.atendimentos,
      prescricao_itens: dados.prescricao_itens,
      especialidades: dados.especialidades,
      perfis: dados.perfis,
      auditoria: dados.auditoria,
      convites: dados.convites,
    }),
    [
      dados,
      aCarregar,
      recarregar,
      criar,
      editar,
      eliminar,
      criarColaborador,
      proximoNumero,
      hospitalActual,
      atualizarHospital,
    ],
  );

  return createElement(Ctx.Provider, { value: valor }, children);
}

export function useDados() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDados fora de DadosProvider');
  return c;
}

/** Índices por id para consultas rápidas nas tabelas */
export function useIndices() {
  const { dados } = useDados();
  return useMemo(
    () => ({
      paciente: new Map(dados.pacientes.map((p) => [p.id, p])),
      medico: new Map(dados.medicos.map((m) => [m.id, m])),
      especialidade: new Map(dados.especialidades.map((e) => [e.id, e])),
      medicamento: new Map(dados.medicamentos.map((m) => [m.id, m])),
      consulta: new Map(dados.consultas.map((c) => [c.id, c])),
    }),
    [dados],
  );
}
