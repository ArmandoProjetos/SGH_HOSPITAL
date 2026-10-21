import React, { useState } from 'react';
import { useDados, useIndices } from '@/controllers/DadosController';
import { useAuth } from '@/controllers/AuthController';
import { podeEditar } from '@/lib/permissoes';
import { formatarMoeda, formatarDataHora } from '@/lib/utils';
import type { Consulta, EstadoConsulta, Prioridade } from '@/models';
import { ESTADO_LABEL } from '@/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Trash2, AlertCircle } from 'lucide-react';

export function Consultas() {
  const { dados, criar, editar, eliminar } = useDados();
  const indices = useIndices();
  const { sessao } = useAuth();
  const podeModificar = podeEditar(sessao?.perfil.papel, 'consultas');

  const [busca, setBusca] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [modalNovo, setModalNovo] = useState(false);
  const [consultaRemarcar, setConsultaRemarcar] = useState<Consulta | null>(null);
  const [novaDataHora, setNovaDataHora] = useState('');
  const [consultaCancelar, setConsultaCancelar] = useState<Consulta | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [consultaEliminando, setConsultaEliminando] = useState<Consulta | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  // Form State Nova Consulta
  const pacientesActivos = dados.pacientes.filter((p) => p.activo);
  const medicosActivos = dados.medicos.filter((m) => m.activo);

  const [pacienteId, setPacienteId] = useState(pacientesActivos[0]?.id || '');
  const [medicoId, setMedicoId] = useState(medicosActivos[0]?.id || '');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));
  const [prioridade, setPrioridade] = useState<Prioridade>('NORMAL');
  const [motivo, setMotivo] = useState('');

  const medSel = indices.medico.get(medicoId);
  const espSel = medSel?.especialidade_id ? indices.especialidade.get(medSel.especialidade_id) : null;
  const precoPadrao = espSel?.preco_consulta || 1500;

  const handleSalvarNova = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');

    if (!pacienteId || !medicoId || !dataHora) {
      const msg = 'Seleccione o paciente, o médico e a data/hora para agendar a consulta.';
      setErroForm(msg);
      toast.error(msg);
      return;
    }

    const isoAlvo = new Date(dataHora).toISOString().slice(0, 16);
    const conflitoMedico = dados.consultas.find(
      (c) =>
        c.estado !== 'CANCELADA' &&
        c.medico_id === medicoId &&
        new Date(c.data_hora).toISOString().slice(0, 16) === isoAlvo,
    );
    if (conflitoMedico) {
      const msg = 'Este médico já possui uma consulta agendada para este exacto horário.';
      setErroForm(msg);
      toast.error(msg);
      return;
    }

    const pac = indices.paciente.get(pacienteId);
    const med = indices.medico.get(medicoId);

    setAProcessar(true);
    try {
      await criar(
        'consultas',
        {
          paciente_id: pacienteId,
          medico_id: medicoId,
          especialidade_id: med?.especialidade_id || null,
          data_hora: new Date(dataHora).toISOString(),
          estado: 'AGENDADA',
          prioridade,
          motivo: motivo.trim() || 'Consulta médica',
          motivo_cancelamento: null,
          valor: precoPadrao,
        },
        `Marcou consulta para ${pac?.nome} com ${med?.nome}`,
      );

      toast.success(`Consulta agendada para ${pac?.nome}.`);
      setMotivo('');
      setModalNovo(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar consulta.');
    } finally {
      setAProcessar(false);
    }
  };

  const handleConfirmarRemarcar = async () => {
    if (!consultaRemarcar || !novaDataHora) return;
    setAProcessar(true);
    try {
      await editar(
        'consultas',
        consultaRemarcar.id,
        {
          data_hora: new Date(novaDataHora).toISOString(),
          estado: 'AGENDADA',
        },
        `Remarcou consulta para ${new Date(novaDataHora).toLocaleString('pt-PT')}`,
      );
      toast.success('Consulta remarcada com sucesso.');
      setConsultaRemarcar(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remarcar consulta.');
    } finally {
      setAProcessar(false);
    }
  };

  const handleConfirmarCancelar = async () => {
    if (!consultaCancelar || !motivoCancelamento.trim()) {
      toast.error('Informe a justificação do cancelamento.');
      return;
    }
    setAProcessar(true);
    try {
      await editar(
        'consultas',
        consultaCancelar.id,
        {
          estado: 'CANCELADA',
          motivo_cancelamento: motivoCancelamento.trim(),
        },
        `Cancelou a consulta. Motivo: ${motivoCancelamento.trim()}`,
      );
      toast.success('Consulta cancelada.');
      setConsultaCancelar(null);
      setMotivoCancelamento('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar consulta.');
    } finally {
      setAProcessar(false);
    }
  };

  const confirmarEliminacao = async () => {
    if (!consultaEliminando) return;
    setAProcessar(true);
    try {
      const pac = indices.paciente.get(consultaEliminando.paciente_id);
      await eliminar(
        'consultas',
        consultaEliminando.id,
        `Eliminou registo de consulta de ${pac?.nome || 'Utente'} (${formatarDataHora(consultaEliminando.data_hora)})`,
      );
      toast.success('Registo de consulta eliminado da base de dados.');
      setConsultaEliminando(null);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível eliminar a consulta.');
    } finally {
      setAProcessar(false);
    }
  };

  const consultasFiltradas = dados.consultas.filter((c) => {
    if (filtroEstado !== 'TODAS' && c.estado !== filtroEstado) return false;
    const q = busca.toLowerCase().trim();
    if (!q) return true;
    const pac = indices.paciente.get(c.paciente_id);
    const med = indices.medico.get(c.medico_id);
    const esp = c.especialidade_id ? indices.especialidade.get(c.especialidade_id) : null;
    return (
      !!pac?.nome.toLowerCase().includes(q) ||
      !!pac?.numero_processo.toLowerCase().includes(q) ||
      !!med?.nome.toLowerCase().includes(q) ||
      !!esp?.nome.toLowerCase().includes(q) ||
      !!(c.motivo && c.motivo.toLowerCase().includes(q))
    );
  });

  const getBadgeEstado = (estado: EstadoConsulta) => {
    switch (estado) {
      case 'AGENDADA':
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200">
            {ESTADO_LABEL[estado]}
          </span>
        );
      case 'SALA_ESPERA':
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {ESTADO_LABEL[estado]}
          </span>
        );
      case 'EM_ATENDIMENTO':
        return (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
            {ESTADO_LABEL[estado]}
          </span>
        );
      case 'CONCLUIDA':
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {ESTADO_LABEL[estado]}
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {ESTADO_LABEL[estado]}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda & Consultas Médicas</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200 tabular-nums">
              {consultasFiltradas.length} registos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Agendamentos, check-in na recepção para sala de espera, remarcações e cancelamentos.
          </p>
        </div>
        {podeModificar && (
          <Button
            size="sm"
            onClick={() => {
              setErroForm('');
              setModalNovo(true);
            }}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Marcar Nova Consulta
          </Button>
        )}
      </div>

      {/* Pesquisa e Filtros por Estado */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" aria-hidden="true" />
          <Input
            aria-label="Pesquisar consultas"
            placeholder="Pesquisar por paciente, nº de processo, médico, especialidade ou motivo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border-0 focus-visible:ring-0 text-xs shadow-none placeholder:text-slate-400"
          />
          {busca && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBusca('')}
              className="text-xs h-7 text-slate-500 hover:text-slate-800"
            >
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['TODAS', 'SALA_ESPERA', 'AGENDADA', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border cursor-pointer ${
                filtroEstado === st
                  ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-[#F0F9FF] hover:text-[#0284C7]'
              }`}
            >
              {st === 'TODAS' ? 'Todas' : ESTADO_LABEL[st as EstadoConsulta] || st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Consultas */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Data / Horário</th>
                <th className="py-3 px-4">Paciente (Utente)</th>
                <th className="py-3 px-4">Médico / Especialidade</th>
                <th className="py-3 px-4">Motivo Clínico</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Valor & Pagamento</th>
                <th className="py-3 px-4 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {consultasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Nenhuma consulta encontrada para o critério seleccionado.
                  </td>
                </tr>
              ) : (
                consultasFiltradas.map((c) => {
                  const pac = indices.paciente.get(c.paciente_id);
                  const med = indices.medico.get(c.medico_id);
                  const esp = c.especialidade_id ? indices.especialidade.get(c.especialidade_id) : null;
                  const temPagamento = dados.pagamentos.some((p) => p.consulta_id === c.id);

                  return (
                    <tr key={c.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-slate-900 text-xs tabular-nums">
                        {formatarDataHora(c.data_hora)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{pac?.nome || 'Utente'}</div>
                        <div className="text-xs text-[#0284C7] font-mono font-medium tabular-nums">
                          {pac?.numero_processo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 text-xs">{med?.nome || 'Médico'}</div>
                        <div className="text-xs text-slate-500">{esp?.nome || 'Clínica Geral'}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 text-xs" title={c.motivo || ''}>
                        {c.motivo || '—'}
                      </td>
                      <td className="py-3.5 px-4">{getBadgeEstado(c.estado)}</td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <div className="font-mono font-semibold text-slate-900 text-xs">
                          {formatarMoeda(c.valor)}
                        </div>
                        {temPagamento ? (
                          <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Liquidado
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        {podeModificar && c.estado === 'AGENDADA' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs font-medium bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-xs"
                            onClick={async () => {
                              await editar(
                                'consultas',
                                c.id,
                                { estado: 'SALA_ESPERA' },
                                `Check-in do paciente ${pac?.nome}`,
                              );
                              toast.success(`${pac?.nome || 'Paciente'} encaminhado para a Sala de Espera.`);
                            }}
                            title="Entrada do Paciente (Sala de Espera)"
                          >
                            Check-in
                          </Button>
                        )}

                        {podeModificar && c.estado !== 'CONCLUIDA' && c.estado !== 'CANCELADA' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-medium border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF]"
                              onClick={() => {
                                setConsultaRemarcar(c);
                                setNovaDataHora(c.data_hora.slice(0, 16));
                              }}
                              title="Remarcar Consulta"
                            >
                              Remarcar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                              onClick={() => setConsultaCancelar(c)}
                              title="Cancelar Consulta"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}

                        {podeModificar && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setConsultaEliminando(c)}
                            title="Eliminar Registo de Consulta"
                            aria-label="Eliminar consulta"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Marcar Consulta */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Marcar Nova Consulta</DialogTitle>
            <DialogDescription className="text-xs">
              Associe o paciente ao médico e seleccione a data e horário pretendidos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarNova} className="space-y-3.5 mt-2">
            {erroForm && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{erroForm}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Paciente *</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Seleccione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientesActivos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} ({p.numero_processo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Médico Especialista *</Label>
              <Select value={medicoId} onValueChange={setMedicoId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Seleccione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicosActivos.map((m) => {
                    const esp = m.especialidade_id ? indices.especialidade.get(m.especialidade_id) : null;
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome} — {esp?.nome || 'Geral'} ({m.sala || 'Consultório'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cons-data" className="text-xs">
                  Data e Hora *
                </Label>
                <Input
                  id="cons-data"
                  type="datetime-local"
                  required
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prioridade</Label>
                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Prioridade)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="PRIORITARIO">Prioritário</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cons-motivo" className="text-xs">
                Motivo da Consulta / Queixa
              </Label>
              <Textarea
                id="cons-motivo"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Breve descrição do motivo do agendamento…"
                className="text-xs"
              />
            </div>

            <div className="p-2.5 bg-[#F8FAFC] rounded border border-slate-200 text-xs flex justify-between items-center tabular-nums">
              <span className="text-slate-600">Valor Previsto da Consulta:</span>
              <strong className="font-mono text-[#0284C7]">{formatarMoeda(precoPadrao)}</strong>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNovo(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={aProcessar}
                className="font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white"
              >
                {aProcessar ? 'A agendar…' : 'Confirmar Agendamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Remarcar Consulta */}
      <Dialog open={!!consultaRemarcar} onOpenChange={(open) => !open && setConsultaRemarcar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Remarcar Consulta</DialogTitle>
            <DialogDescription className="text-xs">
              Seleccione a nova data e hora para o atendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="remarcar-data" className="text-xs">
                Nova Data e Hora *
              </Label>
              <Input
                id="remarcar-data"
                type="datetime-local"
                value={novaDataHora}
                onChange={(e) => setNovaDataHora(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setConsultaRemarcar(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={aProcessar}
              onClick={handleConfirmarRemarcar}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold"
            >
              Guardar Reagendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar Consulta */}
      <Dialog open={!!consultaCancelar} onOpenChange={(open) => !open && setConsultaCancelar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">Cancelar Consulta</DialogTitle>
            <DialogDescription className="text-xs">
              O cancelamento exige o registo do motivo para efeitos de histórico e auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="cancelar-motivo" className="text-xs">
                Justificação do Cancelamento *
              </Label>
              <Textarea
                id="cancelar-motivo"
                rows={3}
                required
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Desistência do paciente, reagendamento médico…"
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setConsultaCancelar(null)}>
              Voltar
            </Button>
            <Button
              size="sm"
              disabled={aProcessar}
              onClick={handleConfirmarCancelar}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Eliminação de Consulta */}
      <Dialog open={!!consultaEliminando} onOpenChange={(open) => !open && setConsultaEliminando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Eliminação de Consulta
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Tem a certeza que deseja eliminar permanentemente este registo de consulta agendado para{' '}
              <strong>{consultaEliminando ? formatarDataHora(consultaEliminando.data_hora) : ''}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Nota de integridade: Consultas com atendimento clínico ou recibo emitido não podem ser eliminadas para protecção fiscal e clínica.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConsultaEliminando(null)}
              disabled={aProcessar}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmarEliminacao}
              disabled={aProcessar}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {aProcessar ? 'A eliminar…' : 'Confirmar Eliminação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
