/**
 * ============================================================================
 * SGH — CAMADA CONTROLLER (MVC): Controlador de Autenticação e Permissões (RBAC)
 * ============================================================================
 * Responsável por:
 * 1. Mediar a autenticação entre as Views (Login, AppShell) e o Model (DatabaseModel).
 * 2. Gerir a sessão activa e persistência de token.
 * 3. Aplicar o Controlo de Acesso Baseado em Perfis (RBAC):
 *    ADMINISTRADOR, MEDICO, FARMACEUTICO, RECEPCIONISTA.
 */

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { backend, type DadosRegisto, type ResultadoRegisto, type Sessao } from '@/models/DatabaseModel';
import { podeAceder, podeEditar as podeEditarPermissao, type Area, type PODE_EDITAR } from '@/lib/permissoes';
import type { Hospital, Papel } from '@/models';

export interface AuthContexto {
  sessao: Sessao | null;
  papelOriginal: Papel | null;
  mudarVistaPapel: (papel: Papel) => void;
  aCarregar: boolean;
  modo: 'supabase' | 'local';
  entrar: (email: string, senha: string) => Promise<void>;
  registar: (dados: DadosRegisto) => Promise<ResultadoRegisto>;
  sair: () => Promise<void>;
  actualizarHospital: (h: Partial<Hospital>) => Promise<void>;
  temAcesso: (modulo: Area) => boolean;
  podeEditar: (modulo: keyof typeof PODE_EDITAR) => boolean;
}

const Ctx = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessaoBase, setSessaoBase] = useState<Sessao | null>(null);
  const [papelVista, setPapelVista] = useState<Papel | null>(null);
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    backend
      .obterSessao()
      .then((s) => {
        setSessaoBase(s);
        setPapelVista(s?.perfil.papel ?? null);
      })
      .catch(() => {
        setSessaoBase(null);
        setPapelVista(null);
      })
      .finally(() => setACarregar(false));
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const s = await backend.entrar(email, senha);
    setSessaoBase(s);
    setPapelVista(s.perfil.papel);
  }, []);

  const registar = useCallback(async (dados: DadosRegisto) => {
    const r = await backend.registar(dados);
    if (r.tipo === 'sessao') {
      setSessaoBase(r.sessao);
      setPapelVista(r.sessao.perfil.papel);
    }
    return r;
  }, []);

  const sair = useCallback(async () => {
    await backend.sair();
    setSessaoBase(null);
    setPapelVista(null);
  }, []);

  const actualizarHospital = useCallback(async (h: Partial<Hospital>) => {
    const hospital = await backend.actualizarHospital(h);
    setSessaoBase((s) => (s ? { ...s, hospital } : s));
  }, []);

  const mudarVistaPapel = useCallback((novoPapel: Papel) => {
    setPapelVista(novoPapel);
  }, []);

  const papelActivo: Papel | undefined = sessaoBase ? (papelVista || sessaoBase.perfil.papel) : undefined;

  const temAcesso = useCallback(
    (modulo: Area) => podeAceder(papelActivo, modulo),
    [papelActivo],
  );

  const podeEditar = useCallback(
    (modulo: keyof typeof PODE_EDITAR) => podeEditarPermissao(papelActivo, modulo),
    [papelActivo],
  );

  const sessao: Sessao | null = sessaoBase
    ? {
        ...sessaoBase,
        perfil: {
          ...sessaoBase.perfil,
          papel: papelVista || sessaoBase.perfil.papel,
        },
      }
    : null;

  return createElement(
    Ctx.Provider,
    {
      value: {
        sessao,
        papelOriginal: sessaoBase?.perfil.papel ?? null,
        mudarVistaPapel,
        aCarregar,
        modo: backend.modo,
        entrar,
        registar,
        sair,
        actualizarHospital,
        temAcesso,
        podeEditar,
      },
    },
    children,
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora de AuthProvider');
  return c;
}
