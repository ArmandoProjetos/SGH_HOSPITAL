import React, { useState } from 'react';
import { useDados } from '@/controllers/DadosController';
import { useAuth } from '@/controllers/AuthController';
import { validarPacienteInput } from '@/models/ValidadoresModel';
import { podeEditar } from '@/lib/permissoes';
import { idade, formatarDataHora } from '@/lib/utils';
import type { Paciente } from '@/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HeartPulse,
} from 'lucide-react';

export function Pacientes() {
  const { dados, criar, editar, eliminar, proximoNumero } = useDados();
  const { sessao } = useAuth();
  const papel = sessao?.perfil.papel;
  const podeModificar = podeEditar(papel, 'pacientes');

  const [busca, setBusca] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<Paciente | null>(null);
  const [pacienteHistorico, setPacienteHistorico] = useState<Paciente | null>(null);
  const [pacienteEliminando, setPacienteEliminando] = useState<Paciente | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [nuit, setNuit] = useState('');
  const [dataNascimento, setDataNascimento] = useState('1990-01-01');
  const [genero, setGenero] = useState<'M' | 'F'>('M');
  const [grupoSanguineo, setGrupoSanguineo] = useState('O+');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [alergias, setAlergias] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const limparForm = () => {
    setNome('');
    setDocumento('');
    setNuit('');
    setDataNascimento('1990-01-01');
    setGenero('M');
    setGrupoSanguineo('O+');
    setTelefone('');
    setEmail('');
    setEndereco('');
    setAlergias('');
    setObservacoes('');
    setErroForm('');
    setPacienteEditando(null);
  };

  const abrirEdicao = (p: Paciente) => {
    setPacienteEditando(p);
    setNome(p.nome);
    setDocumento(p.documento || '');
    setNuit(p.nuit || '');
    setDataNascimento(p.data_nascimento);
    setGenero(p.genero);
    setGrupoSanguineo(p.grupo_sanguineo || 'O+');
    setTelefone(p.telefone);
    setEmail(p.email || '');
    setEndereco(p.endereco || '');
    setAlergias(p.alergias || '');
    setObservacoes(p.observacoes || '');
    setErroForm('');
    setModalNovo(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');

    const validacao = validarPacienteInput(
      {
        nome,
        documento: documento || null,
        nuit: nuit || null,
        data_nascimento: dataNascimento,
        telefone,
        email: email || null,
      },
      dados.pacientes,
      pacienteEditando?.id,
    );

    if (!validacao.valido) {
      setErroForm(validacao.erro || 'Dados inválidos.');
      toast.error(validacao.erro || 'Verifique os dados introduzidos.');
      return;
    }

    setAProcessar(true);
    try {
      if (pacienteEditando) {
        await editar(
          'pacientes',
          pacienteEditando.id,
          {
            nome: nome.trim(),
            documento: documento.trim() || null,
            nuit: nuit.trim() || null,
            data_nascimento: dataNascimento,
            genero,
            grupo_sanguineo: grupoSanguineo || null,
            telefone: telefone.trim(),
            email: email.trim() || null,
            endereco: endereco.trim() || null,
            alergias: alergias.trim() || null,
            observacoes: observacoes.trim() || null,
          },
          `Actualizou os dados do paciente ${nome.trim()} (${pacienteEditando.numero_processo})`,
        );
        toast.success(`Dados do paciente ${nome.trim()} actualizados com sucesso.`);
      } else {
        const numProcesso = proximoNumero('processo');
        await criar(
          'pacientes',
          {
            numero_processo: numProcesso,
            nome: nome.trim(),
            documento: documento.trim() || null,
            nuit: nuit.trim() || null,
            data_nascimento: dataNascimento,
            genero,
            grupo_sanguineo: grupoSanguineo || null,
            telefone: telefone.trim(),
            email: email.trim() || null,
            endereco: endereco.trim() || null,
            alergias: alergias.trim() || null,
            observacoes: observacoes.trim() || null,
            activo: true,
          },
          `Cadastrou o paciente ${nome.trim()} (${numProcesso})`,
        );
        toast.success(`Paciente ${nome.trim()} registado com o processo ${numProcesso}.`);
      }

      limparForm();
      setModalNovo(false);
    } catch (err: any) {
      const msg = err.message || 'Não foi possível guardar os dados do paciente.';
      setErroForm(msg);
      toast.error(msg);
    } finally {
      setAProcessar(false);
    }
  };

  const alternarActivo = async (p: Paciente) => {
    try {
      await editar(
        'pacientes',
        p.id,
        { activo: !p.activo },
        `${p.activo ? 'Desactivou' : 'Activou'} o paciente ${p.nome}`,
      );
      toast.success(`Paciente ${p.nome} ${p.activo ? 'inactivado' : 'reactivado'}.`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar estado do paciente.');
    }
  };

  const confirmarEliminacao = async () => {
    if (!pacienteEliminando) return;
    setAProcessar(true);
    try {
      await eliminar(
        'pacientes',
        pacienteEliminando.id,
        `Eliminou o registo do paciente ${pacienteEliminando.nome} (${pacienteEliminando.numero_processo})`,
      );
      toast.success(`Registo do paciente ${pacienteEliminando.nome} eliminado da base de dados.`);
      setPacienteEliminando(null);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível eliminar o paciente.');
    } finally {
      setAProcessar(false);
    }
  };

  const pacientesFiltrados = dados.pacientes.filter((p) => {
    const q = busca.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nome.toLowerCase().includes(q) ||
      p.numero_processo.toLowerCase().includes(q) ||
      (p.documento && p.documento.toLowerCase().includes(q)) ||
      (p.nuit && p.nuit.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      p.telefone.includes(q)
    );
  });

  const atendimentosDoPaciente = pacienteHistorico
    ? dados.atendimentos.filter((a) => a.paciente_id === pacienteHistorico.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Registo Geral de Pacientes</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200 tabular-nums">
              {pacientesFiltrados.length} utentes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro biográfico validado, alergias, tipagem sanguínea e prontuário histórico.
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
            Admitir Novo Paciente
          </Button>
        )}
      </div>

      {/* Pesquisa */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" aria-hidden="true" />
        <Input
          aria-label="Pesquisar pacientes"
          placeholder="Pesquisar por nome, nº de processo, BI, NUIT, telefone ou email…"
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

      {/* Tabela de Pacientes */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Processo</th>
                <th className="py-3 px-4">Nome do Utente</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Dados Clínicos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {pacientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum paciente encontrado para o critério de pesquisa indicado.
                  </td>
                </tr>
              ) : (
                pacientesFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0284C7] text-xs tabular-nums">
                      {p.numero_processo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{p.nome}</div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {p.documento ? `BI: ${p.documento}` : 'Sem BI'}
                        {p.nuit ? ` • NUIT: ${p.nuit}` : ''} • {idade(p.data_nascimento)} anos (
                        {p.genero === 'M' ? 'Masculino' : 'Feminino'})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <div className="text-slate-900 font-medium">{p.telefone}</div>
                      {p.email && <div className="text-xs text-slate-500">{p.email}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200">
                          {p.grupo_sanguineo || 'N/A'}
                        </span>
                      </div>
                      {p.alergias ? (
                        <div className="text-xs text-rose-700 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
                          <span>Alergia: {p.alergias}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-0.5">Sem alergias reportadas</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                          p.activo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-medium border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF]"
                        onClick={() => setPacienteHistorico(p)}
                        title="Ver Histórico Clínico"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-[#0284C7]" aria-hidden="true" />
                        Prontuário
                      </Button>

                      {podeModificar && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-600 hover:text-[#0284C7] hover:bg-[#F0F9FF]"
                            onClick={() => abrirEdicao(p)}
                            title="Editar Dados do Paciente"
                            aria-label={`Editar paciente ${p.nome}`}
                          >
                            <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 ${
                              p.activo
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            onClick={() => alternarActivo(p)}
                            title={p.activo ? 'Inactivar Paciente' : 'Reactivar Paciente'}
                            aria-label={p.activo ? `Inactivar ${p.nome}` : `Reactivar ${p.nome}`}
                          >
                            {p.activo ? (
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setPacienteEliminando(p)}
                            title="Eliminar Registo do Paciente"
                            aria-label={`Eliminar paciente ${p.nome}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro / Edição de Paciente */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {pacienteEditando ? 'Actualizar Dados do Paciente' : 'Registar Novo Paciente'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados de identificação. O sistema valida campos obrigatórios e impede duplicações de BI, NUIT e Email.
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
              <Label htmlFor="pac-nome" className="text-xs">
                Nome Completo *
              </Label>
              <Input
                id="pac-nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Alberto Fernando Macamo"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pac-doc" className="text-xs">
                  Nº do Documento (BI / Passaporte)
                </Label>
                <Input
                  id="pac-doc"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="Ex: 110298374019B"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pac-nuit" className="text-xs">
                  NUIT Fiscal (9 dígitos)
                </Label>
                <Input
                  id="pac-nuit"
                  maxLength={9}
                  value={nuit}
                  onChange={(e) => setNuit(e.target.value)}
                  placeholder="Ex: 109283741"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pac-nasc" className="text-xs">
                  Data de Nascimento *
                </Label>
                <Input
                  id="pac-nasc"
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Género *</Label>
                <Select value={genero} onValueChange={(v) => setGenero(v as 'M' | 'F')}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grupo Sanguíneo</Label>
                <Select value={grupoSanguineo} onValueChange={setGrupoSanguineo}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pac-tel" className="text-xs">
                  Telefone de Contacto *
                </Label>
                <Input
                  id="pac-tel"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="+258 84 000 0000"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pac-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="pac-email"
                  type="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pac-end" className="text-xs">
                Morada / Endereço
              </Label>
              <Input
                id="pac-end"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Bairro, Avenida ou Rua"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pac-alergias" className="text-xs">
                Alergias Conhecidas
              </Label>
              <Input
                id="pac-alergias"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                placeholder="Ex: Penicilina, Dipirona"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pac-obs" className="text-xs">
                Observações Gerais
              </Label>
              <Textarea
                id="pac-obs"
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações relevantes para a equipa médica…"
                className="text-xs"
              />
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
                {aProcessar ? 'A guardar…' : pacienteEditando ? 'Guardar Alterações' : 'Concluir Registo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Eliminação (Requisito e) */}
      <Dialog open={!!pacienteEliminando} onOpenChange={(open) => !open && setPacienteEliminando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Eliminação de Paciente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Tem a certeza que deseja eliminar permanentemente o registo do paciente{' '}
              <strong>{pacienteEliminando?.nome}</strong> ({pacienteEliminando?.numero_processo})?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Nota de integridade: Pacientes com consultas, atendimentos clínicos ou recibos associados têm a eliminação bloqueada para protecção do histórico médico.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPacienteEliminando(null)}
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

      {/* Modal Histórico Clínico do Paciente */}
      <Dialog open={!!pacienteHistorico} onOpenChange={(open) => !open && setPacienteHistorico(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />
              Histórico Clínico do Utente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paciente: <strong>{pacienteHistorico?.nome}</strong> ({pacienteHistorico?.numero_processo})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {atendimentosDoPaciente.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border rounded-lg border-dashed">
                Nenhum atendimento clínico concluído registado para este paciente até ao momento.
              </div>
            ) : (
              atendimentosDoPaciente.map((atend) => {
                const itensPresc = dados.prescricao_itens.filter((i) => i.atendimento_id === atend.id);
                return (
                  <div key={atend.id} className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatarDataHora(atend.criado_em)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Prontuário Fechado
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded border border-slate-200 text-[11px] tabular-nums">
                      <div>
                        <strong>PA:</strong> {atend.pressao_arterial || 'N/A'}
                      </div>
                      <div>
                        <strong>Temp:</strong> {atend.temperatura ? `${atend.temperatura} ºC` : 'N/A'}
                      </div>
                      <div>
                        <strong>Pulso:</strong> {atend.frequencia_cardiaca ? `${atend.frequencia_cardiaca} bpm` : 'N/A'}
                      </div>
                      <div>
                        <strong>Peso:</strong> {atend.peso ? `${atend.peso} kg` : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <strong className="text-slate-600">Diagnóstico Clínico:</strong>
                      <p className="font-medium text-slate-900 mt-0.5">{atend.diagnostico}</p>
                    </div>

                    <div>
                      <strong className="text-slate-600">Queixas / Anamnese:</strong>
                      <p className="text-slate-600 mt-0.5">{atend.sintomas}</p>
                    </div>

                    {itensPresc.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <strong className="text-slate-600">Medicamentos Prescritos:</strong>
                        <ul className="list-disc list-inside mt-1 text-[11px] space-y-0.5">
                          {itensPresc.map((it) => (
                            <li key={it.id}>
                              <strong>{it.medicamento_nome}</strong> — {it.posologia} ({it.duracao})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
