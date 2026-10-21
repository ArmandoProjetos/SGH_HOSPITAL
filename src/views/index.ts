/**
 * ============================================================================
 * SGH — CAMADA VIEW (MVC): Vistas e Interfaces Visuais do Sistema Hospitalar
 * ============================================================================
 * A camada View é responsável pela apresentação visual e recolha de eventos
 * do utilizador, delegando toda a lógica de negócio e persistência aos
 * Controladores (src/controllers/) e Modelos (src/models/).
 */

export { LandingPage as LandingView } from '@/pages/LandingPage';
export { AppShell as WorkspaceShellView } from '@/components/layout/AppShell';
export { Painel as PainelView } from '@/pages/workspace/Painel';
export { Pacientes as PacientesView } from '@/pages/workspace/Pacientes';
export { Consultas as ConsultasView } from '@/pages/workspace/Consultas';
export { Atendimento as AtendimentoView } from '@/pages/workspace/Atendimento';
export { Medicos as MedicosView } from '@/pages/workspace/Medicos';
export { Medicamentos as MedicamentosView } from '@/pages/workspace/Medicamentos';
export { default as RequisicoesView } from '@/pages/workspace/Requisicoes';
export { default as PagamentosView } from '@/pages/workspace/Pagamentos';
export { default as RelatoriosView } from '@/pages/workspace/Relatorios';
export { default as UtilizadoresView } from '@/pages/workspace/Utilizadores';
export { default as AuditoriaView } from '@/pages/workspace/Auditoria';
export { default as DefinicoesView } from '@/pages/workspace/Definicoes';
