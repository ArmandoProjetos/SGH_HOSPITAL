import React, { useState, useMemo } from 'react';
import { useDados } from '@/context/DadosContext';
import { useAuth } from '@/context/AuthContext';
import { podeEditar } from '@/lib/permissoes';
import {
  Requisicao,
  TipoRequisicao,
  Prioridade,
  TIPO_REQUISICAO_LABEL,
  ESTADO_REQUISICAO_LABEL,
  PRIORIDADE_LABEL,
  PAPEL_LABEL,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  PackagePlus,
  Search,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RequisicoesPage() {
  const { sessao } = useAuth();
  const { requisicoes, medicamentos, criar, editar, eliminar, proximoNumero } = useDados();

  const papel = sessao?.perfil.papel;
  const isDiretor = podeEditar(papel, 'aprovarRequisicoes');
  const podeReceberStock = papel === 'ADMINISTRADOR' || papel === 'FARMACEUTICO';

  const [pesquisa, setPesquisa] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');

  // Modal Nova Requisição
  const [modalNova, setModalNova] = useState(false);
  const [tipo, setTipo] = useState<TipoRequisicao>('AQUISICAO_MEDICAMENTO');
  const [medicamentoId, setMedicamentoId] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [quantidade, setQuantidade] = useState<number>(50);
  const [unidade, setUnidade] = useState('Unidades');
  const [valorEstimado, setValorEstimado] = useState<number>(5000);
  const [prioridade, setPrioridade] = useState<Prioridade>('NORMAL');
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Modal Despacho do Diretor e Eliminação
  const [reqDespacho, setReqDespacho] = useState<Requisicao | null>(null);
  const [reqEliminando, setReqEliminando] = useState<Requisicao | null>(null);
  const [decisaoTipo, setDecisaoTipo] = useState<'APROVADA' | 'REJEITADA'>('APROVADA');
  const [textoDespacho, setTextoDespacho] = useState('');

  const medicamentosMap = useMemo(() => new Map(medicamentos.map((m) => [m.id, m])), [medicamentos]);

  const handleSelecionarMedicamento = (id: string) => {
    setMedicamentoId(id);
    if (id && id !== 'nenhum') {
      const med = medicamentosMap.get(id);
      if (med) {
        setTitulo(`Reposição de Stock: ${med.nome} (${med.dosagem})`);
        setUnidade(med.forma + 's');
      }
    }
  };

  const requisicoesFiltradas = useMemo(() => {
    return requisicoes.filter((r) => {
      const matchTexto =
        r.codigo.toLowerCase().includes(pesquisa.toLowerCase()) ||
        r.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
        r.solicitante_nome.toLowerCase().includes(pesquisa.toLowerCase());
      const matchEstado = estadoFiltro === 'TODOS' || r.estado === estadoFiltro;
      return matchTexto && matchEstado;
    });
  }, [requisicoes, pesquisa, estadoFiltro]);

  const stats = useMemo(() => {
    const pendentes = requisicoes.filter((r) => r.estado === 'PENDENTE').length;
    const aprovadas = requisicoes.filter((r) => r.estado === 'APROVADA' || r.estado === 'RECEBIDA_STOCK').length;
    const orcamentoPendente = requisicoes
      .filter((r) => r.estado === 'PENDENTE')
      .reduce((acc, r) => acc + (r.valor_estimado || 0), 0);
    const orcamentoAprovado = requisicoes
      .filter((r) => r.estado === 'APROVADA' || r.estado === 'RECEBIDA_STOCK')
      .reduce((acc, r) => acc + (r.valor_estimado || 0), 0);
    return { pendentes, aprovadas, orcamentoPendente, orcamentoAprovado };
  }, [requisicoes]);

  const handleCriarRequisicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !justificativa.trim() || !sessao) {
      toast.error('Preencha o item solicitado e a justificativa');
      return;
    }

    setSalvando(true);
    try {
      const codigo = proximoNumero('requisicao');
      await criar(
        'requisicoes',
        {
          codigo,
          solicitante_id: sessao.perfil.id,
          solicitante_nome: sessao.perfil.nome,
          solicitante_papel: sessao.perfil.papel,
          tipo,
          titulo: titulo.trim(),
          medicamento_id: tipo === 'AQUISICAO_MEDICAMENTO' && medicamentoId && medicamentoId !== 'nenhum' ? medicamentoId : null,
          quantidade: Number(quantidade),
          unidade: unidade.trim() || 'Unidades',
          valor_estimado: Number(valorEstimado),
          prioridade,
          justificativa: justificativa.trim(),
          estado: 'PENDENTE',
          aprovado_por: null,
          despacho_direcao: null,
          data_decisao: null,
        },
        `Submissão de requisição ${codigo}: ${titulo.trim()}`
      );

      toast.success(`Requisição ${codigo} enviada para aprovação do Diretor!`);
      setModalNova(false);
      setTitulo('');
      setMedicamentoId('');
      setQuantidade(50);
      setJustificativa('');
    } catch {
      toast.error('Erro ao submeter requisição');
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalDespacho = (req: Requisicao, decisao: 'APROVADA' | 'REJEITADA') => {
    setReqDespacho(req);
    setDecisaoTipo(decisao);
    setTextoDespacho(
      decisao === 'APROVADA'
        ? 'Aquisição autorizada pela Direção Hospitalar. Proceder com o fornecedor credenciado.'
        : 'Pedido recusado neste momento por revisão orçamental.'
    );
  };

  const handleConfirmarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDespacho || !sessao) return;

    setSalvando(true);
    try {
      await editar(
        'requisicoes',
        reqDespacho.id,
        {
          estado: decisaoTipo,
          aprovado_por: sessao.perfil.nome,
          despacho_direcao: textoDespacho.trim() || null,
          data_decisao: new Date().toISOString(),
        },
        `Despacho do Diretor na requisição ${reqDespacho.codigo}: ${decisaoTipo}`
      );
      toast.success(
        decisaoTipo === 'APROVADA'
          ? `Requisição ${reqDespacho.codigo} aprovada com sucesso!`
          : `Requisição ${reqDespacho.codigo} recusada.`
      );
      setReqDespacho(null);
    } catch {
      toast.error('Erro ao registar despacho da direção');
    } finally {
      setSalvando(false);
    }
  };

  const handleDarEntradaStock = async (req: Requisicao) => {
    setSalvando(true);
    try {
      if (req.medicamento_id) {
        const med = medicamentosMap.get(req.medicamento_id);
        if (med) {
          const novoStock = med.stock + req.quantidade;
          await editar(
            'medicamentos',
            med.id,
            { stock: novoStock },
            `Entrada automática via requisição aprovada ${req.codigo} (+${req.quantidade} un.)`
          );
        }
      }

      await editar(
        'requisicoes',
        req.id,
        {
          estado: 'RECEBIDA_STOCK',
        },
        `Confirmação de recepção e entrada em stock da requisição ${req.codigo}`
      );

      toast.success(`Material recebido! O stock foi atualizado automaticamente (+${req.quantidade} ${req.unidade}).`);
    } catch {
      toast.error('Erro ao dar entrada no stock');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarEliminacaoReq = async () => {
    if (!reqEliminando) return;
    if (reqEliminando.estado === 'RECEBIDA_STOCK') {
      toast.error('Não é possível eliminar uma requisição cuja entrada de stock já foi integrada no inventário.');
      return;
    }
    setSalvando(true);
    try {
      await eliminar(
        'requisicoes',
        reqEliminando.id,
        `Eliminou a requisição ${reqEliminando.codigo} (${reqEliminando.titulo})`,
      );
      toast.success(`Requisição ${reqEliminando.codigo} eliminada.`);
      setReqEliminando(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar requisição.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Requisições Internas & Aquisições
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDiretor
              ? 'Central de deliberação da Direcção Hospitalar: aprove ou recuse pedidos de reposição de medicamentos e materiais.'
              : 'Solicite à Direcção a aquisição de medicamentos, materiais clínicos ou equipamentos.'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setModalNova(true)}
          className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Nova Requisição à Direcção
        </Button>
      </div>

      {/* KPIs de Requisições */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Aguardando Direcção
            </CardTitle>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.pendentes}</div>
            <p className="text-xs text-slate-600 mt-1">Pedidos pendentes de despacho</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Aquisições Autorizadas
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.aprovadas}</div>
            <p className="text-xs text-slate-600 mt-1">Aprovadas pela Direcção Geral</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Valor em Análise
            </CardTitle>
            <div className="p-2 bg-[#F0F9FF] text-[#0284C7] rounded-lg border border-sky-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.orcamentoPendente.toLocaleString('pt-MZ')} <span className="text-sm font-normal">MT</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Orçamento pendente de aprovação</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Orçamento Autorizado
            </CardTitle>
            <div className="p-2 bg-[#F0F9FF] text-[#0284C7] rounded-lg border border-sky-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.orcamentoAprovado.toLocaleString('pt-MZ')} <span className="text-sm font-normal">MT</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Total investido em aquisições</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Requisições */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Pesquisar por código, item ou funcionário solicitante..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="w-56">
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Filtrar por Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Estados</SelectItem>
                  <SelectItem value="PENDENTE">Aguardando Diretor</SelectItem>
                  <SelectItem value="APROVADA">Autorizadas pelo Diretor</SelectItem>
                  <SelectItem value="RECEBIDA_STOCK">Concluídas / Em Stock</SelectItem>
                  <SelectItem value="REJEITADA">Recusadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC]">
                  <TableHead className="font-bold text-slate-800 text-xs">Código</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs">Solicitante / Sector</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs">Item & Justificativa</TableHead>
                  <TableHead className="font-bold text-slate-800 text-center text-xs">Qtd.</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right text-xs">Valor Est.</TableHead>
                  <TableHead className="font-bold text-slate-800 text-xs">Estado / Despacho</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right text-xs">Deliberação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisicoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500 text-xs">
                      Nenhuma requisição registada para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  requisicoesFiltradas.map((req) => (
                    <TableRow key={req.id} className="hover:bg-[#F0F9FF]/40 align-top">
                      <TableCell className="font-mono font-bold text-[#0284C7] text-xs whitespace-nowrap tabular-nums">
                        <div>{req.codigo}</div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          {new Date(req.criado_em).toLocaleDateString('pt-MZ')}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-slate-900 text-sm">{req.solicitante_nome}</div>
                        <Badge variant="outline" className="text-[11px] mt-1 font-medium border-slate-300 text-slate-700">
                          {PAPEL_LABEL[req.solicitante_papel] || req.solicitante_papel}
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{req.titulo}</span>
                          {req.prioridade === 'URGENTE' && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">Urgente</Badge>
                          )}
                          {req.prioridade === 'PRIORITARIO' && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Prioritário</Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          {TIPO_REQUISICAO_LABEL[req.tipo]}
                        </div>
                        <p className="text-xs text-slate-700 mt-1 bg-[#F8FAFC] p-2 rounded border border-slate-200">
                          "{req.justificativa}"
                        </p>
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold text-slate-900 text-sm whitespace-nowrap tabular-nums">
                        {req.quantidade} <span className="text-xs font-normal text-slate-600">{req.unidade}</span>
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap tabular-nums">
                        {req.valor_estimado.toLocaleString('pt-MZ')} MT
                      </TableCell>

                      <TableCell className="max-w-[220px]">
                        {req.estado === 'PENDENTE' && (
                          <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs">
                            {ESTADO_REQUISICAO_LABEL[req.estado]}
                          </Badge>
                        )}
                        {req.estado === 'APROVADA' && (
                          <Badge className="bg-[#F0F9FF] text-[#0284C7] border-sky-200 font-semibold text-xs">
                            {ESTADO_REQUISICAO_LABEL[req.estado]}
                          </Badge>
                        )}
                        {req.estado === 'RECEBIDA_STOCK' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs">
                            {ESTADO_REQUISICAO_LABEL[req.estado]}
                          </Badge>
                        )}
                        {req.estado === 'REJEITADA' && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-semibold text-xs">
                            {ESTADO_REQUISICAO_LABEL[req.estado]}
                          </Badge>
                        )}

                        {req.despacho_direcao && (
                          <div className="text-[11px] text-slate-700 mt-1.5 border-l-2 border-[#0284C7] pl-2">
                            <span className="font-bold">{req.aprovado_por}:</span> {req.despacho_direcao}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.estado === 'PENDENTE' && isDiretor && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => abrirModalDespacho(req, 'APROVADA')}
                                className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirModalDespacho(req, 'REJEITADA')}
                                className="h-7 border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Recusar
                              </Button>
                            </>
                          )}

                          {req.estado === 'PENDENTE' && !isDiretor && (
                            <span className="text-xs text-slate-500 font-medium">Em análise</span>
                          )}

                          {req.estado === 'APROVADA' && podeReceberStock && (
                            <Button
                              size="sm"
                              onClick={() => handleDarEntradaStock(req)}
                              disabled={salvando}
                              className="h-7 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold gap-1.5"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              Confirmar Entrada
                            </Button>
                          )}

                          {req.estado === 'RECEBIDA_STOCK' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Integrado ao Stock
                            </span>
                          )}

                          {(isDiretor || req.solicitante_id === sessao?.perfil.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReqEliminando(req)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Eliminar Requisição"
                              aria-label={`Eliminar requisição ${req.codigo}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: NOVA REQUISIÇÃO */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Submeter Requisição / Pedido de Aquisição
            </DialogTitle>
            <DialogDescription className="text-xs">
              O pedido ficará disponível imediatamente no painel da Direcção para autorização.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCriarRequisicao} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Categoria do Pedido *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRequisicao)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AQUISICAO_MEDICAMENTO">Aquisição de Medicamento</SelectItem>
                    <SelectItem value="MATERIAL_CLINICO">Material Clínico & Consumíveis</SelectItem>
                    <SelectItem value="EQUIPAMENTO">Equipamento Hospitalar</SelectItem>
                    <SelectItem value="EXPEDIENTE">Expediente & Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Nível de Urgência *</Label>
                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Prioridade)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="PRIORITARIO">Prioritário</SelectItem>
                    <SelectItem value="URGENTE">Urgente (Rutura de Stock)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipo === 'AQUISICAO_MEDICAMENTO' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Vincular a Medicamento da Farmácia (para entrada automática de stock)
                </Label>
                <Select value={medicamentoId} onValueChange={handleSelecionarMedicamento}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Seleccione o fármaco..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Outro / Novo Fármaco</SelectItem>
                    {medicamentos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome} ({m.dosagem}) — Stock actual: {m.stock} un.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">
                Descrição do Item / Artigo Requisitado *
              </Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Reposição de Amoxicilina 500mg"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Quantidade *</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Unidade *</Label>
                <Input
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  placeholder="Caixas, Kits, Un."
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Custo Estimado (MT) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="100"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(Number(e.target.value))}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">
                Justificação Clínica / Operacional *
              </Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva o motivo da requisição..."
                required
                rows={3}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNova(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold"
              >
                {salvando ? 'A submeter...' : 'Enviar para a Direcção'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: DESPACHO DO DIRETOR */}
      <Dialog open={!!reqDespacho} onOpenChange={(open) => !open && setReqDespacho(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {decisaoTipo === 'APROVADA' ? 'Autorizar Aquisição Hospitalar' : 'Recusar Requisição'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {reqDespacho?.codigo} — {reqDespacho?.titulo}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmarDespacho} className="space-y-4 pt-2">
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-slate-200 text-xs space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-600">Solicitante:</span>
                <span className="font-bold text-slate-900">{reqDespacho?.solicitante_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Quantidade:</span>
                <span className="font-bold text-slate-900">
                  {reqDespacho?.quantidade} {reqDespacho?.unidade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Orçamento Estimado:</span>
                <span className="font-mono font-bold text-slate-900">
                  {reqDespacho?.valor_estimado.toLocaleString('pt-MZ')} MT
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">
                Despacho / Parecer da Direcção *
              </Label>
              <Textarea
                value={textoDespacho}
                onChange={(e) => setTextoDespacho(e.target.value)}
                required
                rows={3}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setReqDespacho(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className={
                  decisaoTipo === 'APROVADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                    : 'bg-rose-600 hover:bg-rose-700 text-white font-semibold'
                }
              >
                {salvando
                  ? 'A registar...'
                  : decisaoTipo === 'APROVADA'
                    ? 'Confirmar Autorização'
                    : 'Confirmar Recusa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR ELIMINAÇÃO DE REQUISIÇÃO */}
      <Dialog open={!!reqEliminando} onOpenChange={(open) => !open && setReqEliminando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Eliminação de Requisição
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Deseja eliminar permanentemente a requisição <strong>{reqEliminando?.codigo}</strong> (
              {reqEliminando?.titulo})?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReqEliminando(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmarEliminacaoReq}
              disabled={salvando}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {salvando ? 'A eliminar…' : 'Confirmar Eliminação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
