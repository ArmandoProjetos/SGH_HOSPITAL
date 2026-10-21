import React, { useState } from 'react';
import { useAuth } from '@/controllers/AuthController';
import { useDados } from '@/controllers/DadosController';
import { Area, podeAceder } from '@/lib/permissoes';
import { Papel, PAPEL_LABEL } from '@/models';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  Users,
  Calendar,
  Stethoscope,
  Pill,
  ClipboardList,
  CreditCard,
  FileBarChart,
  UserCheck,
  ShieldAlert,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface AppShellProps {
  abaAtiva: Area;
  setAbaAtiva: (aba: Area) => void;
  onVerLanding?: () => void;
  children: React.ReactNode;
}

interface ItemMenuConfig {
  id: Area;
  label: string;
  icon: React.ElementType;
  grupo: 'clinico' | 'hospitalar' | 'gestao';
  contador?: number;
}

function getPapelBadgeClass(papel: Papel): string {
  switch (papel) {
    case 'ADMINISTRADOR':
      return 'bg-[#F0F9FF] text-[#0284C7] border-sky-200';
    case 'MEDICO':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'FARMACEUTICO':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'RECEPCIONISTA':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function AppShell({ abaAtiva, setAbaAtiva, children }: AppShellProps) {
  const { sessao, papelOriginal, mudarVistaPapel, sair } = useAuth();
  const { requisicoes } = useDados();
  const [menuMovelAberto, setMenuMovelAberto] = useState(false);

  if (!sessao) return null;

  const { perfil, hospital } = sessao;
  const reqPendentes = requisicoes.filter((r) => r.estado === 'PENDENTE').length;

  const handleTrocarVista = (novoPapel: Papel) => {
    mudarVistaPapel(novoPapel);
    if (!podeAceder(novoPapel, abaAtiva)) {
      setAbaAtiva('painel');
    }
  };

  const todosItens: ItemMenuConfig[] = [
    // Fluxo Clínico
    { id: 'painel', label: 'Painel de Trabalho', icon: Activity, grupo: 'clinico' },
    { id: 'pacientes', label: 'Pacientes & Processos', icon: Users, grupo: 'clinico' },
    { id: 'consultas', label: 'Consultas & Agenda', icon: Calendar, grupo: 'clinico' },
    { id: 'atendimento', label: 'Consultório / Prontuário', icon: Stethoscope, grupo: 'clinico' },

    // Recursos, Farmácia & Aquisições
    { id: 'medicos', label: 'Corpo Clínico', icon: UserCheck, grupo: 'hospitalar' },
    { id: 'medicamentos', label: 'Farmácia & Stock', icon: Pill, grupo: 'hospitalar' },
    {
      id: 'requisicoes',
      label: 'Requisições & Aquisições',
      icon: ClipboardList,
      grupo: 'hospitalar',
      contador: reqPendentes > 0 ? reqPendentes : undefined,
    },

    // Administração & Finanças
    { id: 'pagamentos', label: 'Caixa & Facturação', icon: CreditCard, grupo: 'gestao' },
    { id: 'relatorios', label: 'Relatórios Executivos', icon: FileBarChart, grupo: 'gestao' },
    { id: 'utilizadores', label: 'Equipa & Acessos', icon: Settings, grupo: 'gestao' },
    { id: 'auditoria', label: 'Trilha de Auditoria', icon: ShieldAlert, grupo: 'gestao' },
    { id: 'definicoes', label: 'Definições da Unidade', icon: Building2, grupo: 'gestao' },
  ];

  const itensPermitidos = todosItens.filter((i) => podeAceder(perfil.papel, i.id));

  const grupos = [
    { id: 'clinico', titulo: 'Atendimento Clínico' },
    { id: 'hospitalar', titulo: 'Farmácia & Corpo Clínico' },
    { id: 'gestao', titulo: 'Direcção & Finanças' },
  ];

  const navegarPara = (id: Area) => {
    setAbaAtiva(id);
    setMenuMovelAberto(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* Barra de Topo do Workspace */}
      <header className="border-b border-slate-200 bg-white h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 no-print">
        <div className="flex items-center space-x-3">
          {/* Botão Hamburger para Mobile/Tablet */}
          <button
            type="button"
            onClick={() => setMenuMovelAberto(!menuMovelAberto)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-[#F0F9FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
            aria-label="Abrir Menu"
          >
            {menuMovelAberto ? (
              <X className="h-5 w-5 text-slate-900" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5 text-slate-900" aria-hidden="true" />
            )}
          </button>

          <div className="h-9 w-9 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 line-clamp-1">
              {hospital.nome}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              SGH Hospitalar • Painel Operacional
            </span>
          </div>
        </div>

        {/* Seletor de Vista de Perfil (apenas para Administrador) + Utilizador + Sair */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {papelOriginal === 'ADMINISTRADOR' && (
            <div className="hidden lg:flex items-center gap-2 bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Vista:</span>
              <Select value={perfil.papel} onValueChange={(v) => handleTrocarVista(v as Papel)}>
                <SelectTrigger className="h-7 w-40 text-xs font-semibold bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMINISTRADOR">Direcção / Admin</SelectItem>
                  <SelectItem value="MEDICO">Médico</SelectItem>
                  <SelectItem value="FARMACEUTICO">Farmacêutico</SelectItem>
                  <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-right hidden sm:block border-l border-slate-200 pl-3">
            <p className="text-xs font-bold text-slate-900 leading-none">{perfil.nome}</p>
            <p className="text-[11px] text-[#0284C7] font-semibold mt-0.5">{PAPEL_LABEL[perfil.papel]}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={sair}
            className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-rose-600 gap-1"
            title="Terminar Sessão"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Menu Drawer Mobile / Overlay */}
      {menuMovelAberto && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuMovelAberto(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-xl flex flex-col justify-between p-4 z-10 border-r border-slate-200 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold">
                    <Activity className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs text-slate-900 leading-tight">{hospital.nome}</h2>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getPapelBadgeClass(
                        perfil.papel,
                      )}`}
                    >
                      {PAPEL_LABEL[perfil.papel]}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuMovelAberto(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="Fechar Menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {papelOriginal === 'ADMINISTRADOR' && (
                <div className="mb-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-600 block">
                    Alternar Vista de Perfil:
                  </span>
                  <Select value={perfil.papel} onValueChange={(v) => handleTrocarVista(v as Papel)}>
                    <SelectTrigger className="h-8 text-xs font-semibold bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMINISTRADOR">Direcção / Administrador</SelectItem>
                      <SelectItem value="MEDICO">Médico / Corpo Clínico</SelectItem>
                      <SelectItem value="FARMACEUTICO">Farmacêutico / Stock</SelectItem>
                      <SelectItem value="RECEPCIONISTA">Recepcionista & Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                {grupos.map((g) => {
                  const itensDoGrupo = itensPermitidos.filter((i) => i.grupo === g.id);
                  if (itensDoGrupo.length === 0) return null;
                  return (
                    <div key={g.id} className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {g.titulo}
                      </p>
                      {itensDoGrupo.map((item) => {
                        const Icon = item.icon;
                        const activo = abaAtiva === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navegarPara(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                              activo
                                ? 'bg-[#0284C7] text-white shadow-xs'
                                : 'text-slate-700 hover:bg-[#F0F9FF] hover:text-[#0284C7]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${activo ? 'text-white' : 'text-slate-500'}`}
                                aria-hidden="true"
                              />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.contador && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                                    activo ? 'bg-white text-[#0284C7]' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.contador}
                                </span>
                              )}
                              {activo && <ChevronRight className="w-4 h-4 text-white" aria-hidden="true" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                <p className="font-bold text-slate-800">{perfil.nome}</p>
                <p className="text-[10px] text-slate-500">{perfil.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={sair}
                className="w-full mt-2 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs justify-center font-medium"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Terminar Sessão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal com Sidebar no Desktop */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 gap-6">
        {/* Sidebar Desktop */}
        <aside className="w-64 border border-slate-200 bg-white rounded-xl shadow-xs p-3.5 flex flex-col justify-between shrink-0 no-print hidden md:flex sticky top-20 h-[calc(100vh-6rem)]">
          <div className="space-y-4 overflow-y-auto pr-1">
            {grupos.map((g) => {
              const itensDoGrupo = itensPermitidos.filter((i) => i.grupo === g.id);
              if (itensDoGrupo.length === 0) return null;
              return (
                <div key={g.id} className="space-y-1">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {g.titulo}
                  </p>
                  {itensDoGrupo.map((item) => {
                    const Icon = item.icon;
                    const activo = abaAtiva === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAbaAtiva(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activo
                            ? 'bg-[#0284C7] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-[#F0F9FF] hover:text-[#0284C7]'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${activo ? 'text-white' : 'text-slate-500'}`}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.contador && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                                activo
                                  ? 'bg-white text-[#0284C7]'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {item.contador}
                            </span>
                          )}
                          {activo && <ChevronRight className="w-3.5 h-3.5 text-white/90" aria-hidden="true" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 text-slate-700 text-xs mt-4">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
              <Building2 className="w-4 h-4 text-[#0284C7] shrink-0" aria-hidden="true" />
              <span className="truncate">{hospital.nome}</span>
            </div>
            {hospital.nuit && (
              <p className="font-mono text-xs text-slate-600 mt-1 tabular-nums">
                NUIT: <span className="font-semibold text-slate-800">{hospital.nuit}</span>
              </p>
            )}
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
              <span>{PAPEL_LABEL[perfil.papel]}</span>
              <span className="font-semibold text-[#0284C7]">Online</span>
            </div>
          </div>
        </aside>

        {/* Área do Módulo Ativo */}
        <main className="flex-1 bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-6 lg:p-7 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
