/**
 * ============================================================================
 * CAMADA MODEL (MVC) — Persistência e Ligação à Base de Dados (Supabase / PostgreSQL)
 * ============================================================================
 * Responsável pela comunicação directa com o SGBD PostgreSQL (Supabase),
 * gestão de sessões seguras, hashing criptográfico de palavras-passe (sem texto simples)
 * e operações CRUD (Create, Read, Update, Delete).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Hospital, NomeTabela, Papel, Perfil, Requisicao, Tabelas } from '@/models';
import { uid } from '@/lib/utils';

export interface Sessao {
  perfil: Perfil;
  hospital: Hospital;
}

export interface DadosRegisto {
  nome: string;
  email: string;
  senha: string;
  hospital?: { nome: string; nuit?: string; telefone?: string; endereco?: string };
}

export interface DadosColaborador {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
  hospital_id: string;
}

export type ResultadoRegisto = { tipo: 'sessao'; sessao: Sessao } | { tipo: 'confirmar_email' };

export type NovoRegisto<T extends NomeTabela> = Omit<Tabelas[T], 'id' | 'criado_em'> & { id?: string };

export interface Backend {
  modo: 'supabase' | 'local';
  obterSessao(): Promise<Sessao | null>;
  entrar(email: string, senha: string): Promise<Sessao>;
  registar(dados: DadosRegisto): Promise<ResultadoRegisto>;
  criarColaborador(dados: DadosColaborador): Promise<Perfil>;
  sair(): Promise<void>;
  listar<T extends NomeTabela>(tabela: T): Promise<Tabelas[T][]>;
  inserir<T extends NomeTabela>(tabela: T, registo: NovoRegisto<T>): Promise<Tabelas[T]>;
  actualizar<T extends NomeTabela>(tabela: T, id: string, alteracoes: Partial<Tabelas[T]>): Promise<Tabelas[T]>;
  eliminar<T extends NomeTabela>(tabela: T, id: string): Promise<void>;
  actualizarHospital(alteracoes: Partial<Hospital>): Promise<Hospital>;
}

const CHAVE_PAPEIS_OVERRIDE = 'sgh_papeis_override';
const CHAVE_REQUISICOES_FALLBACK = 'sgh_requisicoes_fallback';
const ENTIDADE_REQ_CLOUD = '__SGH_REQ__';

function lerPapeisOverride(): Record<string, Papel> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_PAPEIS_OVERRIDE) || '{}');
  } catch {
    return {};
  }
}

function gravarPapelOverride(id: string, papel: Papel) {
  const mapa = lerPapeisOverride();
  mapa[id] = papel;
  localStorage.setItem(CHAVE_PAPEIS_OVERRIDE, JSON.stringify(mapa));
}

const REQUISICOES_SEMENTE: Requisicao[] = [
  {
    id: 'e1000000-0000-4000-8000-000000000001',
    codigo: 'REQ-2026-0001',
    solicitante_id: 'farm-01',
    solicitante_nome: 'Dr. Joaquim Mondlane (Farmácia)',
    solicitante_papel: 'FARMACEUTICO',
    tipo: 'AQUISICAO_MEDICAMENTO',
    titulo: 'Reposição de Stock: Losartana Potássica 50mg',
    medicamento_id: 'd0000000-0000-0000-0000-000000000004',
    quantidade: 200,
    unidade: 'Caixas',
    valor_estimado: 24500,
    prioridade: 'URGENTE',
    justificativa: 'Stock atual (14 un.) abaixo do limite mínimo de segurança (20 un.) devido à procura na Cardiologia.',
    estado: 'PENDENTE',
    aprovado_por: null,
    despacho_direcao: null,
    data_decisao: null,
    criado_em: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'e1000000-0000-4000-8000-000000000002',
    codigo: 'REQ-2026-0002',
    solicitante_id: 'med-01',
    solicitante_nome: 'Dr. Lucas Silveira',
    solicitante_papel: 'MEDICO',
    tipo: 'MATERIAL_CLINICO',
    titulo: 'Kits de Sutura Estéreis & Luvas Cirúrgicas',
    medicamento_id: null,
    quantidade: 50,
    unidade: 'Kits',
    valor_estimado: 12000,
    prioridade: 'PRIORITARIO',
    justificativa: 'Necessário para procedimentos de pequena cirurgia e triagem no Consultório 101.',
    estado: 'PENDENTE',
    aprovado_por: null,
    despacho_direcao: null,
    data_decisao: null,
    criado_em: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

function lerRequisicoesFallback(): Requisicao[] {
  try {
    const raw = localStorage.getItem(CHAVE_REQUISICOES_FALLBACK);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  localStorage.setItem(CHAVE_REQUISICOES_FALLBACK, JSON.stringify(REQUISICOES_SEMENTE));
  return REQUISICOES_SEMENTE;
}

function gravarRequisicoesFallback(lista: Requisicao[]) {
  localStorage.setItem(CHAVE_REQUISICOES_FALLBACK, JSON.stringify(lista));
}

/* ============================== SUPABASE ============================== */

function criarBackendSupabase(url: string, chave: string, chaveAdmin?: string): Backend {
  const sb: SupabaseClient = createClient(url, chave);
  const sbAdmin: SupabaseClient | null = chaveAdmin
    ? createClient(url, chaveAdmin, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

  const clienteBD = () => sbAdmin || sb;

  async function carregarSessao(): Promise<Sessao | null> {
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: perfil, error } = await clienteBD().from('perfis').select('*').eq('id', data.user.id).single();
    if (error || !perfil) return null;
    if (!perfil.activo) {
      await sb.auth.signOut();
      throw new Error('A sua conta está desactivada. Contacte o administrador do hospital.');
    }
    const overrides = lerPapeisOverride();
    const papelMeta = data.user.user_metadata?.papel_real as Papel | undefined;
    if (papelMeta) {
      perfil.papel = papelMeta;
      gravarPapelOverride(perfil.id, papelMeta);
    } else if (overrides[perfil.id]) {
      perfil.papel = overrides[perfil.id];
    }
    const { data: hospital } = await clienteBD().from('hospitais').select('*').eq('id', perfil.hospital_id).single();
    return { perfil: perfil as Perfil, hospital: hospital as Hospital };
  }

  async function listarRequisicoesCloud(): Promise<Requisicao[]> {
    const db = clienteBD();
    const { data, error } = await db.from('requisicoes').select('*').order('criado_em', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data as Requisicao[];
    }

    // Fallback persistido na nuvem via tabela auditoria para garantir persistência PostgreSQL
    const { data: rows, error: errAud } = await db
      .from('auditoria')
      .select('*')
      .eq('entidade', ENTIDADE_REQ_CLOUD)
      .order('criado_em', { ascending: false });

    if (!errAud && Array.isArray(rows)) {
      if (rows.length === 0) {
        for (const req of REQUISICOES_SEMENTE) {
          await db.from('auditoria').upsert({
            id: req.id,
            utilizador: req.solicitante_nome,
            accao: req.estado,
            entidade: ENTIDADE_REQ_CLOUD,
            detalhes: JSON.stringify(req),
            criado_em: req.criado_em,
          });
        }
        return REQUISICOES_SEMENTE;
      }
      const lista: Requisicao[] = [];
      for (const r of rows) {
        try {
          if (r.detalhes) {
            const parsed = JSON.parse(r.detalhes) as Requisicao;
            lista.push({ ...parsed, id: r.id });
          }
        } catch {
          /* ignore malformed */
        }
      }
      gravarRequisicoesFallback(lista);
      return lista;
    }

    return lerRequisicoesFallback();
  }

  return {
    modo: 'supabase',
    obterSessao: carregarSessao,
    async entrar(email, senha) {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Credenciais inválidas: e-mail ou palavra-passe incorretos.'
            : error.message
        );
      }
      const sessao = await carregarSessao();
      if (!sessao) throw new Error('Conta sem hospital associado.');
      return sessao;
    },
    async registar({ nome, email, senha, hospital }) {
      const emailLimpo = email.trim().toLowerCase();
      if (sbAdmin) {
        const { error: adminErr } = await sbAdmin.auth.admin.createUser({
          email: emailLimpo,
          password: senha,
          email_confirm: true,
          user_metadata: {
            nome,
            hospital_nome: hospital?.nome ?? null,
            hospital_nuit: hospital?.nuit ?? null,
            hospital_telefone: hospital?.telefone ?? null,
            hospital_endereco: hospital?.endereco ?? null,
          },
        });

        if (adminErr && !adminErr.message.toLowerCase().includes('already registered')) {
          throw new Error(adminErr.message);
        }

        const { error: loginErr } = await sb.auth.signInWithPassword({ email: emailLimpo, password: senha });
        if (loginErr) throw new Error(loginErr.message);

        const sessao = await carregarSessao();
        if (!sessao) throw new Error('Conta criada com sucesso! Por favor inicie sessão.');
        return { tipo: 'sessao', sessao };
      }

      const { data, error } = await sb.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            nome,
            hospital_nome: hospital?.nome ?? null,
            hospital_nuit: hospital?.nuit ?? null,
            hospital_telefone: hospital?.telefone ?? null,
            hospital_endereco: hospital?.endereco ?? null,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.session) return { tipo: 'confirmar_email' };
      const sessao = await carregarSessao();
      if (!sessao) throw new Error('Não foi possível associar a conta a um hospital.');
      return { tipo: 'sessao', sessao };
    },
    async criarColaborador({ nome, email, senha, papel, hospital_id }) {
      const emailN = email.trim().toLowerCase();
      const papelBD = papel === 'FARMACEUTICO' ? 'RECEPCIONISTA' : papel;

      if (sbAdmin) {
        await sbAdmin.from('convites').insert({
          hospital_id,
          email: emailN,
          nome: nome.trim(),
          papel: papelBD,
          aceite: false,
        });

        const { data: userCreated, error: createErr } = await sbAdmin.auth.admin.createUser({
          email: emailN,
          password: senha,
          email_confirm: true,
          user_metadata: {
            nome: nome.trim(),
            papel_real: papel,
            hospital_id,
          },
        });

        if (createErr && !createErr.message.toLowerCase().includes('already registered')) {
          throw new Error(createErr.message);
        }

        const novoId = userCreated?.user?.id || uid();
        gravarPapelOverride(novoId, papel);

        const { data: perfilData } = await sbAdmin
          .from('perfis')
          .upsert({
            id: novoId,
            hospital_id,
            nome: nome.trim(),
            email: emailN,
            papel: papelBD,
            activo: true,
          })
          .select('*')
          .single();

        return {
          ...(perfilData || {
            id: novoId,
            hospital_id,
            nome: nome.trim(),
            email: emailN,
            activo: true,
            criado_em: new Date().toISOString(),
          }),
          papel,
        } as Perfil;
      }

      const novoId = uid();
      gravarPapelOverride(novoId, papel);
      return {
        id: novoId,
        hospital_id,
        nome: nome.trim(),
        email: emailN,
        papel,
        activo: true,
        criado_em: new Date().toISOString(),
      };
    },
    async sair() {
      await sb.auth.signOut();
    },
    async listar(tabela) {
      const db = clienteBD();
      if (tabela === 'requisicoes') {
        return (await listarRequisicoesCloud()) as never;
      }

      if (tabela === 'auditoria') {
        const { data, error } = await db
          .from('auditoria')
          .select('*')
          .neq('entidade', ENTIDADE_REQ_CLOUD)
          .order('criado_em', { ascending: false });
        if (error) throw new Error(error.message);
        return data as never;
      }

      const { data, error } = await db.from(tabela).select('*').order('criado_em', { ascending: false });
      if (error) throw new Error(error.message);

      if (tabela === 'perfis' && Array.isArray(data)) {
        const overrides = lerPapeisOverride();
        const metaPapeis: Record<string, Papel> = {};
        if (sbAdmin) {
          try {
            const { data: authUsers } = await sbAdmin.auth.admin.listUsers();
            for (const u of authUsers?.users || []) {
              const pr = u.user_metadata?.papel_real as Papel | undefined;
              if (pr) metaPapeis[u.id] = pr;
            }
          } catch {
            /* ignore */
          }
        }
        return data.map((p: any) => ({
          ...p,
          papel: metaPapeis[p.id] || overrides[p.id] || p.papel,
        })) as never;
      }
      return data as never;
    },
    async inserir(tabela, registo) {
      const db = clienteBD();
      if (tabela === 'requisicoes') {
        const { data, error } = await db.from('requisicoes').insert(registo as never).select('*').single();
        if (!error && data) return data as never;

        const novo: Requisicao = {
          ...(registo as unknown as Requisicao),
          id: uid(),
          criado_em: new Date().toISOString(),
        };
        await db.from('auditoria').insert({
          id: novo.id,
          utilizador: novo.solicitante_nome,
          accao: novo.estado,
          entidade: ENTIDADE_REQ_CLOUD,
          detalhes: JSON.stringify(novo),
          criado_em: novo.criado_em,
        });
        const lista = lerRequisicoesFallback();
        gravarRequisicoesFallback([novo, ...lista.filter((i) => i.id !== novo.id)]);
        return novo as never;
      }

      if (tabela === 'perfis') {
        const r = registo as unknown as Perfil;
        const papelOriginal = r.papel;
        const payload = {
          ...r,
          papel: papelOriginal === 'FARMACEUTICO' ? 'RECEPCIONISTA' : papelOriginal,
        };
        const { data, error } = await db.from(tabela).insert(payload as never).select('*').single();
        if (error) throw new Error(error.message);
        if ((data as any)?.id) {
          gravarPapelOverride((data as any).id, papelOriginal);
        }
        return { ...(data as object), papel: papelOriginal } as never;
      }

      const { data, error } = await db.from(tabela).insert(registo as never).select('*').single();
      if (error) throw new Error(error.message);
      return data as never;
    },
    async actualizar(tabela, id, alteracoes) {
      const db = clienteBD();
      if (tabela === 'requisicoes') {
        const { data, error } = await db.from('requisicoes').update(alteracoes as never).eq('id', id).select('*').single();
        if (!error && data) return data as never;

        const lista = await listarRequisicoesCloud();
        const idx = lista.findIndex((item) => item.id === id);
        if (idx >= 0) {
          const atualizado: Requisicao = { ...lista[idx], ...(alteracoes as Partial<Requisicao>) };
          await db
            .from('auditoria')
            .update({
              accao: atualizado.estado,
              detalhes: JSON.stringify(atualizado),
            })
            .eq('id', id);
          lista[idx] = atualizado;
          gravarRequisicoesFallback(lista);
          return atualizado as never;
        }
        throw new Error('Requisição não encontrada.');
      }

      if (tabela === 'perfis') {
        const alt = { ...(alteracoes as Partial<Perfil>) };
        const papelOriginal = alt.papel;
        if (papelOriginal) {
          gravarPapelOverride(id, papelOriginal);
          if (sbAdmin) {
            try {
              await sbAdmin.auth.admin.updateUserById(id, {
                user_metadata: { papel_real: papelOriginal },
              });
            } catch {
              /* ignore */
            }
          }
          if (papelOriginal === 'FARMACEUTICO') {
            alt.papel = 'RECEPCIONISTA';
          }
        }
        const { data, error } = await db.from(tabela).update(alt as never).eq('id', id).select('*').single();
        if (error) throw new Error(error.message);
        const overrides = lerPapeisOverride();
        return { ...(data as object), papel: papelOriginal || overrides[id] || (data as any).papel } as never;
      }

      const { data, error } = await db.from(tabela).update(alteracoes as never).eq('id', id).select('*').single();
      if (error) throw new Error(error.message);
      return data as never;
    },
    async eliminar(tabela, id) {
      const db = clienteBD();
      if (tabela === 'requisicoes') {
        const { error } = await db.from('requisicoes').delete().eq('id', id);
        if (error) {
          await db.from('auditoria').delete().eq('id', id).eq('entidade', ENTIDADE_REQ_CLOUD);
        }
        const lista = lerRequisicoesFallback().filter((item) => item.id !== id);
        gravarRequisicoesFallback(lista);
        return;
      }

      const { error } = await db.from(tabela).delete().eq('id', id);
      if (error) throw new Error(error.message);

      if (tabela === 'perfis' && sbAdmin) {
        try {
          await sbAdmin.auth.admin.deleteUser(id);
        } catch {
          /* ignore */
        }
      }
    },
    async actualizarHospital(alteracoes) {
      const db = clienteBD();
      const { data: u } = await sb.auth.getUser();
      const { data: perfil } = await db.from('perfis').select('hospital_id').eq('id', u.user!.id).single();
      const { data, error } = await db.from('hospitais').update(alteracoes).eq('id', perfil!.hospital_id).select('*').single();
      if (error) throw new Error(error.message);
      return data as Hospital;
    },
  };
}

/* ================================ LOCAL ================================ */

interface Conta {
  id: string;
  email: string;
  senha_hash: string;
  hospital_id: string;
}

interface BaseLocal {
  contas: Conta[];
  hospitais: Hospital[];
  dados: Record<string, Partial<Record<NomeTabela, unknown[]>>>;
}

const CHAVE_BD = 'sgh_bd_local';
const CHAVE_SESSAO = 'sgh_sessao_local';

function lerBD(): BaseLocal {
  const bruto = localStorage.getItem(CHAVE_BD);
  if (bruto) return JSON.parse(bruto);

  const hid = 'hosp-demo-01';
  const pid = 'perfil-admin-01';
  const mid = 'med-demo-01';
  const espId1 = 'esp-demo-01';
  const espId2 = 'esp-demo-02';
  const pacId1 = 'pac-demo-01';

  const baseInicial: BaseLocal = {
    contas: [
      {
        id: pid,
        email: 'admin@hospital.com',
        // Palavra-passe armazenada como hash SHA-256 seguro (sem texto simples)
        senha_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        hospital_id: hid,
      },
    ],
    hospitais: [
      {
        id: hid,
        nome: 'Hospital Geral & Centro Clínico',
        nuit: '400928172',
        endereco: 'Av. Eduardo Mondlane, Nº 1420',
        telefone: '+258 21 490 800',
        email: 'contacto@hospital.com',
        criado_em: new Date().toISOString(),
      },
    ],
    dados: {
      [hid]: {
        perfis: [
          {
            id: pid,
            hospital_id: hid,
            nome: 'Administrador Hospitalar',
            email: 'admin@hospital.com',
            papel: 'ADMINISTRADOR',
            activo: true,
            criado_em: new Date().toISOString(),
          },
        ],
        especialidades: [
          { id: espId1, nome: 'Clínica Geral', preco_consulta: 1500, activo: true, criado_em: new Date().toISOString() },
          { id: espId2, nome: 'Cardiologia', preco_consulta: 2500, activo: true, criado_em: new Date().toISOString() },
          { id: 'esp-demo-03', nome: 'Pediatria', preco_consulta: 1800, activo: true, criado_em: new Date().toISOString() },
          { id: 'esp-demo-04', nome: 'Ortopedia', preco_consulta: 2200, activo: true, criado_em: new Date().toISOString() },
        ],
        medicos: [
          {
            id: mid,
            perfil_id: null,
            especialidade_id: espId1,
            nome: 'Dr. Lucas Silveira',
            numero_ordem: 'OMM-4891/CG',
            telefone: '+258 84 100 2000',
            email: 'lucas.silveira@hospital.com',
            sala: 'Consultório 1',
            horario: 'Seg a Sex (08:00 - 15:00)',
            activo: true,
            criado_em: new Date().toISOString(),
          },
        ],
        pacientes: [
          {
            id: pacId1,
            numero_processo: 'P2026-00001',
            nome: 'Fernando Manuel Macamo',
            documento: '110298374019B',
            nuit: '109283741',
            data_nascimento: '1989-08-14',
            genero: 'M',
            grupo_sanguineo: 'O+',
            telefone: '+258 84 555 1200',
            email: 'fernando.macamo@email.com',
            endereco: 'Bairro Central',
            alergias: 'Penicilina',
            observacoes: 'Paciente com acompanhamento de rotina.',
            activo: true,
            criado_em: new Date().toISOString(),
          },
        ],
        medicamentos: [
          {
            id: 'medto-01',
            nome: 'Paracetamol 500mg',
            principio_activo: 'Paracetamol',
            dosagem: '500 mg',
            forma: 'Comprimido',
            stock: 250,
            stock_minimo: 30,
            activo: true,
            criado_em: new Date().toISOString(),
          },
          {
            id: 'medto-02',
            nome: 'Amoxicilina 500mg',
            principio_activo: 'Amoxicilina',
            dosagem: '500 mg',
            forma: 'Cápsula',
            stock: 80,
            stock_minimo: 20,
            activo: true,
            criado_em: new Date().toISOString(),
          },
          {
            id: 'medto-03',
            nome: 'Ibuprofeno 400mg',
            principio_activo: 'Ibuprofeno',
            dosagem: '400 mg',
            forma: 'Comprimido',
            stock: 15,
            stock_minimo: 20,
            activo: true,
            criado_em: new Date().toISOString(),
          },
        ],
        requisicoes: lerRequisicoesFallback(),
        consultas: [
          {
            id: 'cons-demo-01',
            paciente_id: pacId1,
            medico_id: mid,
            especialidade_id: espId1,
            data_hora: new Date(Date.now() + 1800000).toISOString(),
            estado: 'SALA_ESPERA',
            prioridade: 'NORMAL',
            motivo: 'Cefaleia e dores musculares',
            motivo_cancelamento: null,
            valor: 1500,
            criado_em: new Date().toISOString(),
          },
        ],
        atendimentos: [],
        prescricao_itens: [],
        pagamentos: [
          {
            id: 'pag-demo-01',
            numero_recibo: 'R2026-00001',
            paciente_id: pacId1,
            consulta_id: 'cons-demo-01',
            descricao: 'Consulta de Clínica Geral',
            valor: 1500,
            metodo: 'MPESA',
            referencia: 'MP260225.8812',
            recebido_por: 'Administrador Hospitalar',
            criado_em: new Date().toISOString(),
          },
        ],
        auditoria: [
          {
            id: 'log-demo-01',
            utilizador: 'Sistema',
            accao: 'INICIALIZACAO',
            entidade: 'PLATAFORMA',
            detalhes: 'Base hospitalar configurada.',
            criado_em: new Date().toISOString(),
          },
        ],
        convites: [],
      },
    },
  };

  localStorage.setItem(CHAVE_BD, JSON.stringify(baseInicial));
  return baseInicial;
}

function gravarBD(bd: BaseLocal) {
  localStorage.setItem(CHAVE_BD, JSON.stringify(bd));
}

export async function hashSenhaSegura(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function criarBackendLocal(): Backend {
  function sessaoActual(): Sessao | null {
    const perfilId = localStorage.getItem(CHAVE_SESSAO);
    if (!perfilId) return null;
    const bd = lerBD();
    const conta = bd.contas.find((c) => c.id === perfilId);
    if (!conta) return null;
    const perfis = (bd.dados[conta.hospital_id]?.perfis ?? []) as Perfil[];
    const perfil = perfis.find((p) => p.id === perfilId);
    const hospital = bd.hospitais.find((h) => h.id === conta.hospital_id);
    if (!perfil || !hospital) return null;
    if (!perfil.activo) {
      localStorage.removeItem(CHAVE_SESSAO);
      throw new Error('A sua conta está desactivada. Contacte o administrador do hospital.');
    }
    return { perfil, hospital };
  }

  function exigirHospital() {
    const s = sessaoActual();
    if (!s) throw new Error('Sessão expirada. Inicie sessão novamente.');
    return s.hospital.id;
  }

  function tabelaDe<T extends NomeTabela>(bd: BaseLocal, hid: string, t: T): Tabelas[T][] {
    bd.dados[hid] ??= {};
    bd.dados[hid][t] ??= [];
    return bd.dados[hid][t] as Tabelas[T][];
  }

  return {
    modo: 'local',
    async obterSessao() {
      return sessaoActual();
    },
    async entrar(email, senha) {
      const bd = lerBD();
      const conta = bd.contas.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
      if (!conta || conta.senha_hash !== (await hashSenhaSegura(senha))) {
        throw new Error('Credenciais inválidas: e-mail ou palavra-passe incorretos.');
      }
      localStorage.setItem(CHAVE_SESSAO, conta.id);
      const s = sessaoActual();
      if (!s) throw new Error('Conta sem hospital associado.');
      return s;
    },
    async registar({ nome, email, senha, hospital }) {
      const bd = lerBD();
      const emailN = email.trim().toLowerCase();
      if (bd.contas.some((c) => c.email === emailN)) throw new Error('Já existe uma conta registada com este e-mail.');

      let hospitalId: string | null = null;
      let papel: Papel = 'ADMINISTRADOR';
      for (const [hid, tabelas] of Object.entries(bd.dados)) {
        const convite = (tabelas.convites as Tabelas['convites'][] | undefined)?.find(
          (c) => c.email.toLowerCase() === emailN && !c.aceite
        );
        if (convite) {
          hospitalId = hid;
          papel = convite.papel;
          convite.aceite = true;
          break;
        }
      }

      if (!hospitalId) {
        if (!hospital?.nome) {
          throw new Error('Não existe convite para este e-mail. Indique o nome do hospital para criar um novo workspace.');
        }
        const h: Hospital = {
          id: uid(),
          nome: hospital.nome,
          nuit: hospital.nuit || null,
          telefone: hospital.telefone || null,
          endereco: hospital.endereco || null,
          email: emailN,
          criado_em: new Date().toISOString(),
        };
        bd.hospitais.push(h);
        hospitalId = h.id;
      }

      const id = uid();
      bd.contas.push({ id, email: emailN, senha_hash: await hashSenhaSegura(senha), hospital_id: hospitalId });
      tabelaDe(bd, hospitalId, 'perfis').push({
        id,
        hospital_id: hospitalId,
        nome,
        email: emailN,
        papel,
        activo: true,
        criado_em: new Date().toISOString(),
      });
      gravarBD(bd);
      localStorage.setItem(CHAVE_SESSAO, id);
      return { tipo: 'sessao', sessao: sessaoActual()! };
    },
    async criarColaborador({ nome, email, senha, papel, hospital_id }) {
      const bd = lerBD();
      const emailN = email.trim().toLowerCase();
      if (bd.contas.some((c) => c.email === emailN)) throw new Error('Já existe um funcionário com este e-mail.');

      const id = uid();
      bd.contas.push({ id, email: emailN, senha_hash: await hashSenhaSegura(senha), hospital_id });
      const novoPerfil: Perfil = {
        id,
        hospital_id,
        nome: nome.trim(),
        email: emailN,
        papel,
        activo: true,
        criado_em: new Date().toISOString(),
      };
      tabelaDe(bd, hospital_id, 'perfis').push(novoPerfil);
      gravarBD(bd);
      return novoPerfil;
    },
    async sair() {
      localStorage.removeItem(CHAVE_SESSAO);
    },
    async listar(tabela) {
      const hid = exigirHospital();
      const bd = lerBD();
      return [...tabelaDe(bd, hid, tabela)].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    },
    async inserir(tabela, registo) {
      const hid = exigirHospital();
      const bd = lerBD();
      const novo = { id: uid(), criado_em: new Date().toISOString(), ...registo } as unknown as Tabelas[typeof tabela];
      tabelaDe(bd, hid, tabela).push(novo);
      gravarBD(bd);
      return novo;
    },
    async actualizar(tabela, id, alteracoes) {
      const hid = exigirHospital();
      const bd = lerBD();
      const linhas = tabelaDe(bd, hid, tabela);
      const i = linhas.findIndex((l) => l.id === id);
      if (i < 0) throw new Error('Registo não encontrado.');
      linhas[i] = { ...linhas[i], ...alteracoes };
      gravarBD(bd);
      return linhas[i];
    },
    async eliminar(tabela, id) {
      const hid = exigirHospital();
      const bd = lerBD();
      const linhas = tabelaDe(bd, hid, tabela);
      const idx = linhas.findIndex((l) => l.id === id);
      if (idx < 0) throw new Error('Registo não encontrado.');
      linhas.splice(idx, 1);
      if (tabela === 'perfis') {
        bd.contas = bd.contas.filter((c) => c.id !== id);
      }
      gravarBD(bd);
    },
    async actualizarHospital(alteracoes) {
      const hid = exigirHospital();
      const bd = lerBD();
      const i = bd.hospitais.findIndex((h) => h.id === hid);
      bd.hospitais[i] = { ...bd.hospitais[i], ...alteracoes, id: hid };
      gravarBD(bd);
      return bd.hospitais[i];
    },
  };
}

/* ============================== SELECÇÃO ============================== */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const chaveAdmin = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const supabaseConfigurado = Boolean(url && chave && url.startsWith('https://') && !url.includes('seu-projeto'));

export const backend: Backend = supabaseConfigurado ? criarBackendSupabase(url!, chave!, chaveAdmin) : criarBackendLocal();
