import { useState, useMemo } from 'react';
import { useDados } from '@/context/DadosContext';
import { useAuth } from '@/context/AuthContext';
import { Pagamento, MetodoPagamento, METODO_LABEL } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Printer, CreditCard, DollarSign, Wallet, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PagamentosPage() {
  const { sessao } = useAuth();
  const { pagamentos, pacientes, consultas, hospital, adicionar } = useDados();

  const [pesquisa, setPesquisa] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState<string>('TODOS');

  const [dialogNovoAberto, setDialogNovoAberto] = useState(false);
  const [reciboVisualizar, setReciboVisualizar] = useState<Pagamento | null>(null);

  // Form State
  const [pacienteId, setPacienteId] = useState('');
  const [consultaId, setConsultaId] = useState<string>('');
  const [descricao, setDescricao] = useState('Consulta médica');
  const [valor, setValor] = useState<number>(1500);
  const [metodo, setMetodo] = useState<MetodoPagamento>('DINHEIRO');
  const [referencia, setReferencia] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Mapas rápidos
  const pacientesMap = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes]);
  const consultasMap = useMemo(() => new Map(consultas.map((c) => [c.id, c])), [consultas]);

  // Consultas do paciente selecionado para associar valor
  const consultasDoPaciente = useMemo(() => {
    if (!pacienteId) return [];
    return consultas.filter((c) => c.paciente_id === pacienteId);
  }, [consultas, pacienteId]);

  const handleSelecionarConsulta = (id: string) => {
    setConsultaId(id);
    if (id && id !== 'nenhuma') {
      const c = consultasMap.get(id);
      if (c) {
        setValor(c.valor || 1500);
        setDescricao(`Consulta médica - ${new Date(c.data_hora).toLocaleDateString('pt-MZ')}`);
      }
    }
  };

  const pagamentosFiltrados = useMemo(() => {
    return pagamentos.filter((pg) => {
      const pac = pacientesMap.get(pg.paciente_id);
      const matchTexto =
        pg.numero_recibo.toLowerCase().includes(pesquisa.toLowerCase()) ||
        pg.descricao.toLowerCase().includes(pesquisa.toLowerCase()) ||
        (pg.referencia && pg.referencia.toLowerCase().includes(pesquisa.toLowerCase())) ||
        (pac && pac.nome.toLowerCase().includes(pesquisa.toLowerCase())) ||
        (pac && pac.numero_processo.toLowerCase().includes(pesquisa.toLowerCase()));

      const matchMetodo = metodoFiltro === 'TODOS' || pg.metodo === metodoFiltro;

      return matchTexto && matchMetodo;
    });
  }, [pagamentos, pacientesMap, pesquisa, metodoFiltro]);

  // Estatísticas de Caixa
  const stats = useMemo(() => {
    const hojeStr = new Date().toISOString().slice(0, 10);
    const mesStr = new Date().toISOString().slice(0, 7);

    let totalHoje = 0;
    let totalMes = 0;
    let totalGeral = 0;

    for (const p of pagamentos) {
      totalGeral += p.valor;
      if (p.criado_em.startsWith(hojeStr)) {
        totalHoje += p.valor;
      }
      if (p.criado_em.startsWith(mesStr)) {
        totalMes += p.valor;
      }
    }

    return { totalHoje, totalMes, totalGeral, qtd: pagamentos.length };
  }, [pagamentos]);

  const handleGravarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) {
      toast.error('Selecione o paciente');
      return;
    }
    if (valor <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return;
    }

    setSalvando(true);
    try {
      const ano = new Date().getFullYear();
      const numSequencial = String(pagamentos.length + 1).padStart(4, '0');
      const numero_recibo = `REC-${ano}-${numSequencial}`;

      const novoPagamento = await adicionar('pagamentos', {
        numero_recibo,
        paciente_id: pacienteId,
        consulta_id: consultaId && consultaId !== 'nenhuma' ? consultaId : null,
        descricao,
        valor: Number(valor),
        metodo,
        referencia: referencia.trim() || null,
        recebido_por: sessao?.perfil.nome || 'Operador de Caixa',
      });

      toast.success(`Pagamento ${numero_recibo} emitido com sucesso!`);
      setDialogNovoAberto(false);
      // Abrir visualização do recibo emitido
      setReciboVisualizar(novoPagamento);

      // Limpar form
      setPacienteId('');
      setConsultaId('');
      setDescricao('Consulta médica');
      setValor(1500);
      setMetodo('DINHEIRO');
      setReferencia('');
    } catch {
      toast.error('Erro ao registar pagamento');
    } finally {
      setSalvando(false);
    }
  };

  const pacienteDoRecibo = reciboVisualizar ? pacientesMap.get(reciboVisualizar.paciente_id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Caixa & Pagamentos</h1>
          <p className="text-sm text-slate-500">
            Registo de cobranças, emissão de recibos e controlo financeiro de consultas e serviços
          </p>
        </div>
        <Button onClick={() => setDialogNovoAberto(true)} className="bg-sky-700 hover:bg-sky-800 text-white gap-2">
          <Plus className="w-4 h-4" />
          Registar Pagamento
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cobrado Hoje
            </CardTitle>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalHoje.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-slate-500">MT</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Total liquidado no dia corrente</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receita do Mês
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Wallet className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalMes.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-slate-500">MT</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Acumulado do mês em exercício</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recibos Emitidos
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.qtd}</div>
            <p className="text-xs text-slate-500 mt-1">Transacções registadas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Global
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalGeral.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-slate-500">MT</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Histórico financeiro consolidado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pagamentos */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Pesquisar por recibo, paciente ou referência..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="w-48">
              <Select value={metodoFiltro} onValueChange={setMetodoFiltro}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Métodos</SelectItem>
                  <SelectItem value="DINHEIRO">Numerário</SelectItem>
                  <SelectItem value="CARTAO">Cartão / POS</SelectItem>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="EMOLA">e-Mola</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-semibold text-slate-600 text-xs">N.º Recibo</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs">Data / Hora</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs">Paciente</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs">Descrição</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs">Método de Pagamento</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs">Referência</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs text-right">Valor Liquidado</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-xs font-medium">
                      Nenhum registo de pagamento encontrado com o filtro indicado.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagamentosFiltrados.map((pg) => {
                    const pac = pacientesMap.get(pg.paciente_id);
                    return (
                      <TableRow 
                        key={pg.id} 
                        className="even:bg-blue-50/20 hover:bg-blue-50/60 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-mono font-bold text-blue-700 text-xs">
                          {pg.numero_recibo}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {new Date(pg.criado_em).toLocaleString('pt-MZ', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-sm">{pac?.nome || 'Paciente'}</div>
                          <div className="text-xs text-slate-500 font-mono">{pac?.numero_processo}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-[200px] truncate">
                          {pg.descricao}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            {METODO_LABEL[pg.metodo]}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {pg.referencia || '—'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 text-sm font-mono">
                          {pg.valor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReciboVisualizar(pg)}
                            className="h-8 text-blue-700 hover:text-blue-800 hover:bg-blue-50 gap-1.5 text-xs font-medium"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Recibo
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG: NOVO PAGAMENTO */}
      <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Registar Cobrança de Pagamento</DialogTitle>
            <DialogDescription>
              Emissão de recibo oficial de pagamento por consulta ou serviço prestado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGravarPagamento} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="paciente_select" className="text-xs font-medium text-slate-700">
                Paciente <span className="text-rose-500">*</span>
              </Label>
              <Select value={pacienteId} onValueChange={(val) => { setPacienteId(val); setConsultaId(''); }}>
                <SelectTrigger id="paciente_select" className="h-9">
                  <SelectValue placeholder="Selecione o paciente..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {pacientes
                    .filter((p) => p.activo)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({p.numero_processo})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {pacienteId && (
              <div className="space-y-1.5">
                <Label htmlFor="consulta_select" className="text-xs font-medium text-slate-700">
                  Associar a Consulta (Opcional)
                </Label>
                <Select value={consultaId} onValueChange={handleSelecionarConsulta}>
                  <SelectTrigger id="consulta_select" className="h-9">
                    <SelectValue placeholder="Nenhuma consulta específica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma consulta específica</SelectItem>
                    {consultasDoPaciente.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {new Date(c.data_hora).toLocaleDateString('pt-MZ')} - {c.motivo || 'Consulta'} ({c.valor} MT)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-medium text-slate-700">
                Descrição do Serviço <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Consulta médica de especialidade"
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor" className="text-xs font-medium text-slate-700">
                  Valor a Pagar (MT) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="valor"
                  type="number"
                  min="1"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="metodo" className="text-xs font-medium text-slate-700">
                  Método de Pagamento <span className="text-rose-500">*</span>
                </Label>
                <Select value={metodo} onValueChange={(val) => setMetodo(val as MetodoPagamento)}>
                  <SelectTrigger id="metodo" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DINHEIRO">Numerário</SelectItem>
                    <SelectItem value="CARTAO">Cartão / POS</SelectItem>
                    <SelectItem value="MPESA">M-Pesa</SelectItem>
                    <SelectItem value="EMOLA">e-Mola</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref" className="text-xs font-medium text-slate-700">
                Referência / N.º de Transação (POS / M-Pesa / Talão)
              </Label>
              <Input
                id="ref"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ex: MP261020.1432.A98B ou Terminal POS 443"
                className="h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogNovoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="bg-sky-700 hover:bg-sky-800 text-white">
                {salvando ? 'A processar...' : 'Emitir Recibo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: RECIBO FORMATADO PARA IMPRESSÃO */}
      <Dialog open={!!reciboVisualizar} onOpenChange={(open) => !open && setReciboVisualizar(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Recibo de Pagamento Oficial
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{reciboVisualizar?.numero_recibo}</p>
            </div>
            <Button
              onClick={() => window.print()}
              size="sm"
              className="bg-sky-700 hover:bg-sky-800 text-white gap-2 shadow-sm print:hidden"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo
            </Button>
          </div>

          {reciboVisualizar && (
            <div id="area-recibo" className="p-6 space-y-6 text-slate-800 font-sans">
              {/* Cabeçalho Hospital */}
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{hospital.nome}</h2>
                  <p className="text-xs text-slate-500">{hospital.endereco || 'Maputo, Moçambique'}</p>
                  <p className="text-xs text-slate-500">
                    NUIT: <span className="font-mono text-slate-700">{hospital.nuit || '400987654'}</span>
                  </p>
                  <p className="text-xs text-slate-500">Tel: {hospital.telefone || '+258 21 000 000'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded font-mono font-bold">
                    {reciboVisualizar.numero_recibo}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Data: {new Date(reciboVisualizar.criado_em).toLocaleDateString('pt-MZ')}
                  </p>
                  <p className="text-xs text-slate-500">
                    Hora: {new Date(reciboVisualizar.criado_em).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Paciente */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1 border border-slate-100">
                <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Dados do Utente
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-medium text-slate-900">{pacienteDoRecibo?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">N.º de Processo Clínico:</span>
                  <span className="font-mono font-medium text-slate-900">{pacienteDoRecibo?.numero_processo}</span>
                </div>
                {pacienteDoRecibo?.documento && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">BI / Passaporte:</span>
                    <span className="text-slate-700">{pacienteDoRecibo.documento}</span>
                  </div>
                )}
                {pacienteDoRecibo?.nuit && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">NUIT do Cliente:</span>
                    <span className="text-slate-700">{pacienteDoRecibo.nuit}</span>
                  </div>
                )}
              </div>

              {/* Tabela de Discriminação */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="text-left py-2">Item / Discriminação do Serviço</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 text-slate-800 font-medium">{reciboVisualizar.descricao}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                      {reciboVisualizar.valor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900">
                    <td className="py-3 font-bold text-slate-900 text-sm">TOTAL LIQUIDADO</td>
                    <td className="py-3 text-right font-bold text-slate-900 text-base font-mono">
                      {reciboVisualizar.valor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Detalhes do Pagamento */}
              <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 flex justify-between items-center">
                <div>
                  <span className="text-slate-500">Forma de Pagamento: </span>
                  <span className="font-semibold text-slate-800">{METODO_LABEL[reciboVisualizar.metodo]}</span>
                  {reciboVisualizar.referencia && (
                    <span className="text-slate-500 ml-2 font-mono">({reciboVisualizar.referencia})</span>
                  )}
                </div>
                <div className="text-right text-slate-500">
                  Operador: <span className="font-medium text-slate-700">{reciboVisualizar.recebido_por || 'Sistema'}</span>
                </div>
              </div>

              {/* Assinatura / Rodapé */}
              <div className="pt-6 border-t border-dashed border-slate-200 text-center">
                <div className="inline-block border-t border-slate-400 w-48 mb-1"></div>
                <p className="text-[11px] text-slate-500">Assinatura / Carimbo da Tesouraria</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Documento processado por computador • Válido como comprovativo de quitação
                </p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setReciboVisualizar(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
