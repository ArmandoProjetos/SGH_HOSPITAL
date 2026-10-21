/**
 * ============================================================================
 * SGH — Sistema Integrado de Gestão Hospitalar (Padrão Arquitectural MVC)
 * ============================================================================
 * - Models:      src/models/      (Entidades, Validações e Persistência SQL/Supabase)
 * - Views:       src/views/       (Interfaces Visuais e Componentes de Apresentação)
 * - Controllers: src/controllers/ (Controlo de Sessão, Permissões RBAC e Operações CRUD)
 */

import { useState } from 'react';
import { AuthProvider, useAuth, DadosProvider } from '@/controllers';
import {
  LandingView,
  WorkspaceShellView,
  PainelView,
  PacientesView,
  ConsultasView,
  AtendimentoView,
  MedicosView,
  MedicamentosView,
  RequisicoesView,
  PagamentosView,
  RelatoriosView,
  UtilizadoresView,
  AuditoriaView,
  DefinicoesView,
} from '@/views';
import { Area } from '@/lib/permissoes';
import { Toaster } from '@/components/ui/sonner';

function WorkspaceConteudo() {
  const [abaAtiva, setAbaAtiva] = useState<Area>('painel');

  return (
    <WorkspaceShellView abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}>
      {abaAtiva === 'painel' && <PainelView setAbaAtiva={setAbaAtiva} />}
      {abaAtiva === 'pacientes' && <PacientesView />}
      {abaAtiva === 'consultas' && <ConsultasView />}
      {abaAtiva === 'atendimento' && <AtendimentoView />}
      {abaAtiva === 'medicos' && <MedicosView />}
      {abaAtiva === 'medicamentos' && <MedicamentosView />}
      {abaAtiva === 'requisicoes' && <RequisicoesView />}
      {abaAtiva === 'pagamentos' && <PagamentosView />}
      {abaAtiva === 'relatorios' && <RelatoriosView />}
      {abaAtiva === 'utilizadores' && <UtilizadoresView />}
      {abaAtiva === 'auditoria' && <AuditoriaView />}
      {abaAtiva === 'definicoes' && <DefinicoesView />}
    </WorkspaceShellView>
  );
}

function AppPrincipal() {
  const { sessao } = useAuth();

  if (!sessao) {
    return <LandingView />;
  }

  return (
    <DadosProvider>
      <WorkspaceConteudo />
    </DadosProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppPrincipal />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
