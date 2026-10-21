import React, { useState } from 'react';
import { useDados, useIndices } from '@/controllers/DadosController';
import { useAuth } from '@/controllers/AuthController';
import { validarMedicoInput } from '@/models/ValidadoresModel';
import { podeEditar } from '@/lib/permissoes';
import type { Medico } from '@/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, AlertCircle } from 'lucide-react';

export function Medicos() {
  const { dados, criar, editar, eliminar } = useDados();
  const indices = useIndices();
  const { sessao } = useAuth();
  const podeModificar = podeEditar(sessao?.perfil.papel, 'medicos');

  const [busca, setBusca] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [medicoEditando, setMedicoEditando] = useState<Medico | null>(null);
  const [medicoEliminando, setMedicoEliminando] = useState<Medico | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [especialidadeId, setEspecialidadeId] = useState(dados.especialidades[0]?.id || '');
  const [numeroOrdem, setNumeroOrdem] = useState('OMM-');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [sala, setSala] = useState('Consultório 1');
  const [horario, setHorario] = useState('Segunda a Sexta (08:00 - 15:00)');

  const limparForm = () => {
    setNome('');
    setEspecialidadeId(dados.especialidades[0]?.id || '');
    setNumeroOrdem('OMM-');
    setTelefone('');
    setEmail('');
    setSala('Consultório 1');
    setHorario('Segunda a Sexta (08:00 - 15:00)');
    setErroForm('');
    setMedicoEditando(null);
  };

  const abrirEdicao = (m: Medico) => {
    setMedicoEditando(m);
    setNome(m.nome);
    setEspecialidadeId(m.especialidade_id || dados.especialidades[0]?.id || '');
    setNumeroOrdem(m.numero_ordem);
    setTelefone(m.telefone || '');
    setEmail(m.email || '');
    setSala(m.sala || '');
    setHorario(m.horario || '');
    setErroForm('');
    setModalNovo(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');

    const validacao = validarMedicoInput(
      {
        nome,
        numero_ordem: numeroOrdem,
        especialidade_id: especialidadeId || null,
        telefone: telefone || null,
        email: email || null,
      },
      dados.medicos,
      medicoEditando?.id,
    );

    if (!validacao.valido) {
      setErroForm(validacao.erro || 'Dados inválidos.');
      toast.error(validacao.erro || 'Verifique os dados do médico.');
      return;
    }

    setAProcessar(true);
    try {
      if (medicoEditando) {
        await editar(
          'medicos',
          medicoEditando.id,
          {
            nome: nome.trim(),
            especialidade_id: especialidadeId || null,
            numero_ordem: numeroOrdem.trim(),
            telefone: telefone.trim() || null,
            email: email.trim() || null,
            sala: sala.trim() || null,
            horario: horario.trim() || null,
          },
          `Actualizou os dados do médico ${nome.trim()}`,
        );
        toast.success(`Dados do médico ${nome.trim()} actualizados com sucesso.`);
      } else {
        await criar(
          'medicos',
          {
            perfil_id: null,
            nome: nome.trim(),
            especialidade_id: especialidadeId || null,
            numero_ordem: numeroOrdem.trim(),
            telefone: telefone.trim() || null,
            email: email.trim() || null,
            sala: sala.trim() || null,
            horario: horario.trim() || null,
            activo: true,
          },
          `Cadastrou o médico ${nome.trim()} (${numeroOrdem.trim()})`,
        );
        toast.success(`Médico ${nome.trim()} registado com sucesso.`);
      }

      limparForm();
      setModalNovo(false);
    } catch (err: any) {
      const msg = err.message || 'Erro ao guardar registo do médico.';
      setErroForm(msg);
      toast.error(msg);
    } finally {
      setAProcessar(false);
    }
  };

  const alternarActivo = async (m: Medico) => {
    try {
      await editar(
        'medicos',
        m.id,
        { activo: !m.activo },
        `${m.activo ? 'Desactivou' : 'Activou'} o médico ${m.nome}`,
      );
      toast.success(`Médico ${m.nome} ${m.activo ? 'inactivado' : 'reactivado'}.`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar estado do médico.');
    }
  };

  const confirmarEliminacao = async () => {
    if (!medicoEliminando) return;
    setAProcessar(true);
    try {
      await eliminar(
        'medicos',
        medicoEliminando.id,
        `Eliminou o registo do médico ${medicoEliminando.nome} (${medicoEliminando.numero_ordem})`,
      );
      toast.success(`Registo do médico ${medicoEliminando.nome} eliminado da base de dados.`);
      setMedicoEliminando(null);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível eliminar o médico.');
    } finally {
      setAProcessar(false);
    }
  };

  const medicosFiltrados = dados.medicos.filter((m) => {
    const q = busca.toLowerCase().trim();
    if (!q) return true;
    const esp = m.especialidade_id ? indices.especialidade.get(m.especialidade_id)?.nome.toLowerCase() : '';
    return (
      m.nome.toLowerCase().includes(q) ||
      m.numero_ordem.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      !!esp?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Corpo Clínico & Médicos</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200 tabular-nums">
              {medicosFiltrados.length} médicos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registo de especialistas, inscrição na Ordem dos Médicos (OMM), consultórios e escalas.
          </p>
        </div>
        {podeModificar && (
          <Button
            size="sm"
            onClick={() => {
              limparForm();
              setModalNovo(true);
            }}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Registar Novo Médico
          </Button>
        )}
      </div>

      {/* Pesquisa */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" aria-hidden="true" />
        <Input
          aria-label="Pesquisar médicos"
          placeholder="Pesquisar por nome do médico, nº de ordem OMM, email ou especialidade…"
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

      {/* Tabela de Médicos */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome do Médico</th>
                <th className="py-3 px-4">Especialidade</th>
                <th className="py-3 px-4">Inscrição OMM</th>
                <th className="py-3 px-4">Consultório & Horário</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {medicosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum médico encontrado para o critério de pesquisa indicado.
                  </td>
                </tr>
              ) : (
                medicosFiltrados.map((m) => {
                  const esp = m.especialidade_id ? indices.especialidade.get(m.especialidade_id) : null;
                  return (
                    <tr key={m.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{m.nome}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-[#F0F9FF] text-[#0284C7] border-sky-200">
                          {esp?.nome || 'Clínica Geral'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0284C7] tabular-nums">
                        {m.numero_ordem}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.sala || 'Consultório 1'}</div>
                        <div className="text-xs text-slate-500">{m.horario || 'Seg a Sex (08:00 - 15:00)'}</div>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <div className="text-slate-900 font-medium">{m.telefone || '—'}</div>
                        {m.email && <div className="text-xs text-slate-500">{m.email}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                            m.activo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {m.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        {podeModificar && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-medium border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF]"
                              onClick={() => abrirEdicao(m)}
                              title="Editar Médico"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1 text-[#0284C7]" aria-hidden="true" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 w-7 p-0 ${
                                m.activo
                                  ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              onClick={() => alternarActivo(m)}
                              title={m.activo ? 'Inactivar Médico' : 'Reactivar Médico'}
                              aria-label={m.activo ? `Inactivar ${m.nome}` : `Reactivar ${m.nome}`}
                            >
                              {m.activo ? (
                                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => setMedicoEliminando(m)}
                              title="Eliminar Registo do Médico"
                              aria-label={`Eliminar médico ${m.nome}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          </>
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

      {/* Modal Cadastro / Edição de Médico */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {medicoEditando ? 'Actualizar Dados do Médico' : 'Registar Novo Médico'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informe a especialidade e número de inscrição único na Ordem dos Médicos (OMM).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-3.5 mt-2">
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
              <Label htmlFor="med-nome" className="text-xs">
                Nome Completo do Médico *
              </Label>
              <Input
                id="med-nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Dra. Joana Machel"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Especialidade Médica *</Label>
                <Select value={especialidadeId} onValueChange={setEspecialidadeId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {dados.especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id}>
                        {esp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="med-omm" className="text-xs">
                  Nº de Ordem (OMM) *
                </Label>
                <Input
                  id="med-omm"
                  required
                  value={numeroOrdem}
                  onChange={(e) => setNumeroOrdem(e.target.value)}
                  placeholder="Ex: OMM-5120"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="med-tel" className="text-xs">
                  Telefone de Contacto
                </Label>
                <Input
                  id="med-tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="+258 84 000 0000"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="med-email" className="text-xs">
                  Email Institucional
                </Label>
                <Input
                  id="med-email"
                  type="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="medico@hospital.com"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="med-sala" className="text-xs">
                  Sala / Consultório
                </Label>
                <Input
                  id="med-sala"
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
                  placeholder="Ex: Consultório 102"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="med-horario" className="text-xs">
                  Escala / Horário
                </Label>
                <Input
                  id="med-horario"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex: Seg a Sex (08:00 - 15:00)"
                  className="text-xs"
                />
              </div>
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
                {aProcessar ? 'A guardar…' : medicoEditando ? 'Guardar Alterações' : 'Registar Médico'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Eliminação de Médico */}
      <Dialog open={!!medicoEliminando} onOpenChange={(open) => !open && setMedicoEliminando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Eliminação de Médico
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Deseja eliminar permanentemente o registo de <strong>{medicoEliminando?.nome}</strong> (
              {medicoEliminando?.numero_ordem})?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Nota de integridade: Médicos com consultas agendadas ou histórico de atendimentos não podem ser eliminados para preservação dos registos clínicos.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMedicoEliminando(null)}
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
