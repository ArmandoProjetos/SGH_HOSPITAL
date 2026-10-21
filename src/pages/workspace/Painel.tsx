import React from 'react';
import { useDados, useIndices } from '@/context/DadosContext';
import { useAuth } from '@/context/AuthContext';
import { Area } from '@/lib/permissoes';
import { formatarMoeda } from '@/lib/utils';
import { PAPEL_LABEL } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Pill,
  Plus,
  ClipboardList,
  Shield,
  PackagePlus,
} from 'lucide-react';

interface PainelProps {
  setAbaAtiva: (aba: Area) => void;
}

export function Painel({ setAbaAtiva }: PainelProps) {
  const { sessao } = useAuth();
  const { dados, requisicoes, editar } = useDados();
  const indices = useIndices();

  const papel = sessao?.perfil.papel || 'ADMINISTRADOR';
  const totalReceita = dados.pagamentos.reduce((acc, p) => acc + p.valor, 0);

  const hojeStr = new Date().toISOString().slice(0, 10);
  const consultasHoje = dados.consultas.filter((c) => c.data_hora.startsWith(hojeStr));
  const emEspera = dados.consultas.filter((c) => c.estado === 'SALA_ESPERA');
  const agendadasHoje = consultasHoje.filter((c) => c.estado === 'AGENDADA');
  const concluidasHoje = consultasHoje.filter((c) => c.estado === 'CONCLUIDA');

  const medicamentosStockBaixo = dados.medicamentos.filter((m) => m.activo && m.stock <= m.stock_minimo);
  const requisicoesPendentes = requisicoes.filter((r) => r.estado === 'PENDENTE');
  const requisicoesAprovadas = requisicoes.filter((r) => r.estado === 'APROVADA');

  const configCabecalho = {
    ADMINISTRADOR: {
      titulo: 'Painel Executivo da Direção Hospitalar',
      subtitulo:
        'Visão centralizada de todo o hospital: indicadores clínicos, receitas, aprovações de aquisições e supervisão da equipa.',
    },
    MEDICO: {
      titulo: 'Painel Clínico do Consultório Médico',
      subtitulo:
        'Gestão da fila de pacientes para atendimento, prontuário eletrónico, prescrição de receitas e pedidos clínicos.',
    },
    FARMACEUTICO: {
      titulo: 'Painel de Farmácia & Gestão de Stock',
      subtitulo:
        'Controlo de lotes e quantidades de medicamentos, monitorização de ruturas e requisições de aquisição à Direção.',
    },
    RECEPCIONISTA: {
      titulo: 'Painel de Recepção, Triagem & Caixa',
      subtitulo:
        'Admissão de utentes, agendamento e check-in para sala de espera, faturação e emissão de recibos oficiais.',
    },
  }[papel];

  return (
    <div className="space-y-6">
      {/* Cabeçalho Adaptado ao Perfil do Utilizador */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">{configCabecalho.titulo}</h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">{configCabecalho.subtitulo}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(papel === 'ADMINISTRADOR' || papel === 'RECEPCIONISTA') && (
            <>
              <Button
                size="sm"
                onClick={() => setAbaAtiva('consultas')}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nova Consulta
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAbaAtiva('pacientes')}
                className="border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs"
              >
                <Users className="w-4 h-4 mr-1.5 text-[#0284C7]" />
                Novo Paciente
              </Button>
            </>
          )}

          {papel === 'MEDICO' && (
            <>
              <Button
                size="sm"
                onClick={() => setAbaAtiva('atendimento')}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs shadow-xs"
              >
                <Stethoscope className="w-4 h-4 mr-1.5" />
                Abrir Consultório
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAbaAtiva('requisicoes')}
                className="border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs"
              >
                <ClipboardList className="w-4 h-4 mr-1.5 text-[#0284C7]" />
                Requisitar Insumos
              </Button>
            </>
          )}

          {papel === 'FARMACEUTICO' && (
            <>
              <Button
                size="sm"
                onClick={() => setAbaAtiva('medicamentos')}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs shadow-xs"
              >
                <Pill className="w-4 h-4 mr-1.5" />
                Gerir Stock de Medicamentos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAbaAtiva('requisicoes')}
                className="border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs"
              >
                <PackagePlus className="w-4 h-4 mr-1.5 text-[#0284C7]" />
                Pedir Aquisição ao Diretor
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerta de Requisições Pendentes para o Diretor do Hospital (Azul e Branco Harmonioso) */}
      {papel === 'ADMINISTRADOR' && requisicoesPendentes.length > 0 && (
        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white border border-sky-200 text-[#0284C7] shadow-xs">
              <ClipboardList className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="font-bold text-slate-950 text-sm">
                Deliberação da Direção Necessária:
              </span>
              <p className="font-medium text-slate-700 mt-0.5">
                Existem <strong>{requisicoesPendentes.length} requisição(ões) de aquisição</strong> submetidas pelos funcionários aguardando a sua aprovação.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setAbaAtiva('requisicoes')}
            className="text-xs font-bold h-8 bg-[#0284C7] hover:bg-[#0369A1] text-white self-start sm:self-auto shrink-0 shadow-xs"
          >
            Analisar & Aprovar →
          </Button>
        </div>
      )}

      {/* Alerta de Medicamentos em Estoque Baixo */}
      {(papel === 'ADMINISTRADOR' || papel === 'FARMACEUTICO' || papel === 'MEDICO') &&
        medicamentosStockBaixo.length > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-800 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <span className="font-bold text-slate-900">Aviso de Farmácia:</span>{' '}
                <span className="font-medium text-slate-700">
                  <strong>{medicamentosStockBaixo.length} medicamento(s)</strong> atingiram o nível de stock mínimo de segurança.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAbaAtiva('medicamentos')}
                className="text-xs font-semibold h-7 bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
              >
                Ver Stock
              </Button>
              {papel === 'FARMACEUTICO' && (
                <Button
                  size="sm"
                  onClick={() => setAbaAtiva('requisicoes')}
                  className="text-xs font-semibold h-7 bg-[#0284C7] hover:bg-[#0369A1] text-white"
                >
                  Requisitar Compra
                </Button>
              )}
            </div>
          </div>
        )}

      {/* KPIs Dinâmicos Conforme o Cargo — Predominância Azul e Branco */}
      {papel === 'FARMACEUTICO' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Catálogo Ativo</span>
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{dados.medicamentos.length}</div>
              <p className="text-xs text-slate-600 mt-0.5">Fármacos registados na farmácia</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Alerta de Rutura</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{medicamentosStockBaixo.length}</div>
              <p className="text-xs font-medium text-slate-600 mt-0.5">Abaixo do stock mínimo</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Pedidos à Direção</span>
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{requisicoesPendentes.length}</div>
              <p className="text-xs text-slate-600 mt-0.5">
                {requisicoesAprovadas.length} aprovadas para dar entrada
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Itens Prescritos</span>
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{dados.prescricao_itens.length}</div>
              <p className="text-xs text-slate-600 mt-0.5">Dispensados mediante receita médica</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Prontuários</span>
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{dados.pacientes.length}</div>
              <p className="text-xs text-slate-600 mt-0.5">Pacientes registados ativos</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Agenda do Dia</span>
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{consultasHoje.length}</div>
              <p className="text-xs text-slate-600 mt-0.5">
                <strong className="text-slate-900">{concluidasHoje.length} concluídas</strong> •{' '}
                {agendadasHoje.length} agendadas
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Em Espera</span>
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-950">{emEspera.length}</div>
              <p className="text-xs font-medium text-slate-600 mt-0.5">Aguardando chamada do médico</p>
            </div>
          </div>

          {papel === 'MEDICO' ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Atendimentos</span>
                <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-950">{dados.atendimentos.length}</div>
                <p className="text-xs text-slate-600 mt-0.5">Consultas clínicas registadas</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Receita Liquidada</span>
                <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-950">{formatarMoeda(totalReceita)}</div>
                <p className="text-xs text-slate-600 mt-0.5">{dados.pagamentos.length} recibos processados</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Área Principal de Operações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {papel === 'FARMACEUTICO' ? (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Controlo de Stock & Medicamentos Críticos
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Fármacos que necessitam de reposição ou pedido de aquisição imediato.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => setAbaAtiva('medicamentos')}
              >
                Inventário Completo
              </Button>
            </div>

            <div className="space-y-2.5">
              {dados.medicamentos.slice(0, 6).map((m) => {
                const critico = m.stock <= m.stock_minimo;
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {m.nome} <span className="text-xs font-normal text-slate-600">({m.dosagem} • {m.forma})</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Princípio ativo: {m.principio_activo} • Mínimo exigido: {m.stock_minimo} un.
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          critico
                            ? 'bg-red-100 text-red-900 border-red-200 font-bold'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-200 font-bold'
                        }
                      >
                        Stock: {m.stock} un.
                      </Badge>
                      {critico && (
                        <Button
                          size="sm"
                          onClick={() => setAbaAtiva('requisicoes')}
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                          Pedir Compra
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Fila de Triagem & Espera ({emEspera.length})
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Utentes em sala de espera prontos para chamada médica.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                onClick={() => setAbaAtiva('consultas')}
              >
                Ver Agenda Completa
              </Button>
            </div>

            {emEspera.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CheckCircle2 className="w-7 h-7 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">Fila limpa!</p>
                <p className="text-slate-500 mt-0.5">Nenhum utente aguardando na recepção neste momento.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {emEspera.map((c) => {
                  const pac = indices.paciente.get(c.paciente_id);
                  const med = indices.medico.get(c.medico_id);
                  const esp = c.especialidade_id ? indices.especialidade.get(c.especialidade_id) : null;
                  const isUrgente = c.prioridade === 'URGENTE';
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-bold text-sm">{pac?.nome || 'Paciente'}</strong>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              isUrgente
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {c.prioridade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Médico: <strong className="text-slate-800">{med?.nome}</strong> ({esp?.nome || 'Clínica Geral'})
                        </p>
                        {c.motivo && <p className="text-xs text-slate-600 italic mt-0.5">"{c.motivo}"</p>}
                      </div>

                      {(papel === 'ADMINISTRADOR' || papel === 'MEDICO') && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            await editar('consultas', c.id, { estado: 'EM_ATENDIMENTO' });
                            setAbaAtiva('atendimento');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 shadow-xs whitespace-nowrap self-end sm:self-auto"
                        >
                          <Stethoscope className="w-3.5 h-3.5 mr-1.5" />
                          Chamar para Consultório
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Coluna Direita: Ferramentas do Cargo & Requisições */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Ferramentas do {PAPEL_LABEL[papel]}
            </h3>
            <div className="space-y-2">
              {(papel === 'ADMINISTRADOR' || papel === 'RECEPCIONISTA') && (
                <>
                  <button
                    onClick={() => setAbaAtiva('pacientes')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-semibold text-slate-800 transition-all text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      Admissão & Ficha de Paciente
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setAbaAtiva('pagamentos')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 text-xs font-semibold text-slate-800 transition-all text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      Caixa & Emissão de Recibo
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </>
              )}

              <button
                onClick={() => setAbaAtiva('requisicoes')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-xs font-semibold text-slate-800 transition-all text-left"
              >
                <span className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-sky-50 text-[#0284C7] border border-sky-100">
                    <ClipboardList className="w-3.5 h-3.5" />
                  </div>
                  {papel === 'ADMINISTRADOR'
                    ? `Aprovar Aquisições (${requisicoesPendentes.length})`
                    : 'Requisitar Medicamento / Material'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              {papel === 'ADMINISTRADOR' && (
                <>
                  <button
                    onClick={() => setAbaAtiva('utilizadores')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      Credenciar Médicos & Funcionários
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setAbaAtiva('relatorios')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      Relatórios Executivos da Direção
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Card Resumo de Requisições / Corpo Clínico */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <h4 className="font-bold text-slate-900 mb-1">
              {papel === 'ADMINISTRADOR' ? 'Controlo da Direção Hospitalar' : 'Equipa Clínica em Serviço'}
            </h4>
            <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
              Existem <strong>{dados.medicos.filter((m) => m.activo).length} médicos ativos</strong> e{' '}
              <strong>{dados.perfis.filter((p) => p.activo).length} funcionários credenciados</strong> neste workspace hospitalar.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAbaAtiva(papel === 'ADMINISTRADOR' ? 'utilizadores' : 'requisicoes')}
              className="mt-3 w-full text-xs font-semibold border-slate-300 text-slate-800 hover:bg-white"
            >
              {papel === 'ADMINISTRADOR' ? 'Gerir Equipa & Permissões' : 'Ver Minhas Requisições'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
