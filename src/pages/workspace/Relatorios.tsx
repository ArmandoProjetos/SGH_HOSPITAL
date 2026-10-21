import { useState, useMemo } from 'react';
import { useDados } from '@/context/DadosContext';
import { useAuth } from '@/context/AuthContext';
import { HospitalLogo } from '@/components/common/HospitalLogo';
import { descarregarCSV } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Printer, Calendar, TrendingUp, Users, DollarSign, 
  Stethoscope, AlertTriangle, FileSpreadsheet, Download,
  CheckCircle2, ShieldCheck, Activity, CreditCard
} from 'lucide-react';
import { METODO_LABEL, MetodoPagamento } from '@/types';

export default function RelatoriosPage() {
  const { sessao } = useAuth();
  const { hospital, consultas, pacientes, medicos, pagamentos, medicamentos, atendimentos } = useDados();

  const [modalExportar, setModalExportar] = useState(false);

  // Filtros de Data (Padrão: início do mês corrente até hoje)
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiroDiaDoMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes);
  const [dataFim, setDataFim] = useState(hoje);

  // Atalhos de período
  const setPeriodo = (tipo: 'hoje' | '7dias' | 'mes' | 'ano') => {
    const agora = new Date();
    const fimStr = agora.toISOString().slice(0, 10);
    setDataFim(fimStr);

    if (tipo === 'hoje') {
      setDataInicio(fimStr);
    } else if (tipo === '7dias') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      setDataInicio(seteDiasAtras.toISOString().slice(0, 10));
    } else if (tipo === 'mes') {
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      setDataInicio(inicioMes.toISOString().slice(0, 10));
    } else if (tipo === 'ano') {
      const inicioAno = new Date(agora.getFullYear(), 0, 1);
      setDataInicio(inicioAno.toISOString().slice(0, 10));
    }
  };

  // Filtragem dos dados pelo período
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      const data = c.data_hora.slice(0, 10);
      return data >= dataInicio && data <= dataFim;
    });
  }, [consultas, dataInicio, dataFim]);

  const pagamentosFiltrados = useMemo(() => {
    return pagamentos.filter((p) => {
      const data = p.criado_em.slice(0, 10);
      return data >= dataInicio && data <= dataFim;
    });
  }, [pagamentos, dataInicio, dataFim]);

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const data = p.criado_em.slice(0, 10);
      return data >= dataInicio && data <= dataFim;
    });
  }, [pacientes, dataInicio, dataFim]);

  const atendimentosFiltrados = useMemo(() => {
    return atendimentos.filter((a) => {
      const data = a.criado_em.slice(0, 10);
      return data >= dataInicio && data <= dataFim;
    });
  }, [atendimentos, dataInicio, dataFim]);

  // Estatísticas Consolidadas
  const totalFaturado = useMemo(() => {
    return pagamentosFiltradasSoma(pagamentosFiltrados);
  }, [pagamentosFiltrados]);

  function pagamentosFiltradasSoma(lista: typeof pagamentos) {
    return lista.reduce((acc, p) => acc + p.valor, 0);
  }

  // Agrupamento por Estado das Consultas
  const consultasPorEstado = useMemo(() => {
    const contagem = {
      AGENDADA: 0,
      SALA_ESPERA: 0,
      EM_ATENDIMENTO: 0,
      CONCLUIDA: 0,
      CANCELADA: 0,
    };
    for (const c of consultasFiltradas) {
      if (contagem[c.estado] !== undefined) {
        contagem[c.estado]++;
      }
    }
    return contagem;
  }, [consultasFiltradas]);

  // Produtividade por Médico
  const produtividadeMedicos = useMemo(() => {
    const medicosMap = new Map(medicos.map((m) => [m.id, { medico: m, concluidas: 0, total: 0, receita: 0 }]));

    for (const c of consultasFiltradas) {
      const item = medicosMap.get(c.medico_id);
      if (item) {
        item.total++;
        if (c.estado === 'CONCLUIDA') {
          item.concluidas++;
          item.receita += c.valor || 0;
        }
      }
    }

    return Array.from(medicosMap.values()).sort((a, b) => b.concluidas - a.concluidas);
  }, [medicos, consultasFiltradas]);

  // Pagamentos por Método
  const pagamentosPorMetodo = useMemo(() => {
    const agrupado: Record<MetodoPagamento, { valor: number; qtd: number }> = {
      DINHEIRO: { valor: 0, qtd: 0 },
      CARTAO: { valor: 0, qtd: 0 },
      MPESA: { valor: 0, qtd: 0 },
      EMOLA: { valor: 0, qtd: 0 },
      TRANSFERENCIA: { valor: 0, qtd: 0 },
    };

    for (const p of pagamentosFiltrados) {
      if (agrupado[p.metodo]) {
        agrupado[p.metodo].valor += p.valor;
        agrupado[p.metodo].qtd += 1;
      }
    }

    return Object.entries(agrupado).map(([metodo, dados]) => ({
      metodo: metodo as MetodoPagamento,
      label: METODO_LABEL[metodo as MetodoPagamento],
      valor: dados.valor,
      qtd: dados.qtd,
      percentual: totalFaturado > 0 ? (dados.valor / totalFaturado) * 100 : 0,
    }));
  }, [pagamentosFiltrados, totalFaturado]);

  // Medicamentos com Alerta de Stock
  const medicamentosCriticos = useMemo(() => {
    return medicamentos.filter((m) => m.activo && m.stock <= m.stock_minimo);
  }, [medicamentos]);

  // Exportação CSV Estruturada
  const handleExportarCSV = () => {
    const colunas = [
      'Módulo / Categoria',
      'Indicador / Detalhe',
      'Quantidade / Valor',
      'Observação / Percentual',
    ];

    const linhas: (string | number)[][] = [
      ['Período', 'Data Início', dataInicio, 'Filtro aplicado'],
      ['Período', 'Data Fim', dataFim, 'Filtro aplicado'],
      ['Consultas', 'Total de Consultas', consultasFiltradas.length, 'Todas as consultas'],
      ['Consultas', 'Concluídas', consultasPorEstado.CONCLUIDA, `${consultasFiltradas.length > 0 ? Math.round((consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100) : 0}%`],
      ['Consultas', 'Em Sala de Espera', consultasPorEstado.SALA_ESPERA, 'Aguardando atendimento'],
      ['Consultas', 'Canceladas', consultasPorEstado.CANCELADA, `${consultasFiltradas.length > 0 ? Math.round((consultasPorEstado.CANCELADA / consultasFiltradas.length) * 100) : 0}%`],
      ['Atendimentos', 'Total de Atendimentos', atendimentosFiltrados.length, 'Diagnósticos e prescrições'],
      ['Pacientes', 'Novos Utentes Cadastrados', pacientesFiltrados.length, 'Processos clínicos abertos'],
      ['Faturamento', 'Receita Total Liquidada (MT)', totalFaturado, `${pagamentosFiltrados.length} recibos processados`],
      ...pagamentosPorMetodo.map((p) => [
        'Canais de Pagamento',
        p.label,
        `${p.valor.toLocaleString('pt-MZ')} MT`,
        `${p.qtd} transacções (${p.percentual.toFixed(1)}%)`,
      ]),
      ...produtividadeMedicos.map((m) => [
        'Corpo Clínico',
        m.medico.nome,
        `${m.concluidas} consultas concluídas`,
        `Receita: ${m.receita.toLocaleString('pt-MZ')} MT`,
      ]),
    ];

    descarregarCSV(`Relatorio_Gestao_Hospitalar_${dataInicio}_a_${dataFim}`, colunas, linhas);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios & Análise Operacional</h1>
          <p className="text-sm text-slate-500">
            Métricas de desempenho clínico, fluxo de consultas, produtividade médica e receita financeira
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden flex-wrap">
          <Button
            onClick={handleExportarCSV}
            variant="outline"
            className="gap-2 border-slate-300 text-slate-700 hover:text-blue-700 hover:bg-blue-50 shadow-xs h-9 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Exportar CSV
          </Button>

          <Button
            onClick={() => setModalExportar(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            Exportar / Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* Barra de Filtros de Período (Oculta na impressão) */}
      <Card className="border-slate-200 shadow-sm print:hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Período Rápido:</span>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPeriodo('hoje')}>
                Hoje
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPeriodo('7dias')}>
                Últimos 7 dias
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPeriodo('mes')}>
                Este Mês
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPeriodo('ano')}>
                Este Ano
              </Button>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="dt_inicio" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  De:
                </Label>
                <Input
                  id="dt_inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-8 text-xs w-36"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="dt_fim" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  Até:
                </Label>
                <Input
                  id="dt_fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-8 text-xs w-36"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sumário Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultas no Período</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{consultasFiltradas.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {consultasPorEstado.CONCLUIDA} concluídas ({consultasFiltradas.length > 0 ? Math.round((consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atendimentos Médicos</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Stethoscope className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{atendimentosFiltrados.length}</div>
            <p className="text-xs text-slate-500 mt-1">Diagnósticos e prescrições emitidas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Novos Utentes</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pacientesFiltrados.length}</div>
            <p className="text-xs text-slate-500 mt-1">Processos clínicos abertos no período</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Liquidado</CardTitle>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalFaturado.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-slate-500">MT</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{pagamentosFiltrados.length} recibos processados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Detalhadas */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="bg-slate-100 p-1 border border-slate-200 print:hidden">
          <TabsTrigger value="consultas">Consultas & Fluxo</TabsTrigger>
          <TabsTrigger value="medicos">Produtividade Médica</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro por Método</TabsTrigger>
          <TabsTrigger value="farmacia">Farmácia & Stock</TabsTrigger>
        </TabsList>

        {/* TAB 1: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Distribuição por Estado</CardTitle>
                <CardDescription>Resumo dos estados das consultas no intervalo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-600">Consultas Concluídas</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-700">{consultasPorEstado.CONCLUIDA}</span>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                      {consultasFiltradas.length > 0
                        ? `${Math.round((consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100)}%`
                        : '0%'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-600">Em Sala de Espera</span>
                  <span className="font-semibold text-amber-700">{consultasPorEstado.SALA_ESPERA}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-600">Agendadas Futuras</span>
                  <span className="font-semibold text-sky-700">{consultasPorEstado.AGENDADA}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-600">Canceladas / Desistências</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-700">{consultasPorEstado.CANCELADA}</span>
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-xs">
                      {consultasFiltradas.length > 0
                        ? `${Math.round((consultasPorEstado.CANCELADA / consultasFiltradas.length) * 100)}%`
                        : '0%'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Taxa de Eficácia do Agendamento</CardTitle>
                <CardDescription>Indicadores de pontualidade e assiduidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Taxa de Atendimento Concluído</span>
                    <span className="font-bold text-slate-900">
                      {consultasFiltradas.length > 0
                        ? Math.round((consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${consultasFiltradas.length > 0 ? (consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Taxa de Cancelamento</span>
                    <span className="font-bold text-rose-700">
                      {consultasFiltradas.length > 0
                        ? Math.round((consultasPorEstado.CANCELADA / consultasFiltradas.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${consultasFiltradas.length > 0 ? (consultasPorEstado.CANCELADA / consultasFiltradas.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  O tempo médio de espera dos pacientes na triagem para este período é monitorado nos registos de auditoria e prontuários.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: PRODUTIVIDADE MÉDICA */}
        <TabsContent value="medicos" className="pt-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Desempenho do Corpo Clínico</CardTitle>
              <CardDescription>
                Número de pacientes consultados e volume gerado por especialista
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-600 text-xs">Médico Especialista</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs">N.º da Ordem</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-center">Consultas Atribuídas</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-center">Concluídas</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-right">Valor Total Gerado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtividadeMedicos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-500 text-xs font-medium">
                        Nenhum médico registado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    produtividadeMedicos.map(({ medico, concluidas, total, receita }) => (
                      <TableRow 
                        key={medico.id}
                        className="even:bg-blue-50/20 hover:bg-blue-50/60 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-semibold text-slate-900 text-sm">
                          {medico.nome}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-blue-700 font-semibold">
                          {medico.numero_ordem}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-700">
                          {total}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                            {concluidas}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-slate-900 text-sm">
                          {receita.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FINANCEIRO POR MÉTODO */}
        <TabsContent value="financeiro" className="pt-2">
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Arrecadação por Canal de Cobrança</CardTitle>
              <CardDescription>
                Discriminação das receitas por moeda digital, POS e numerário
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-600 text-xs">Método de Pagamento</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-center">N.º de Transacções</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-right">Representatividade</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-right">Montante Liquidado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentosPorMetodo.map((item) => (
                    <TableRow 
                      key={item.metodo}
                      className="even:bg-blue-50/20 hover:bg-blue-50/60 transition-colors border-b border-slate-100"
                    >
                      <TableCell className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                        {item.label}
                      </TableCell>
                      <TableCell className="text-center text-sm text-slate-700">
                        {item.qtd}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-600 font-mono">
                            {item.percentual.toFixed(1)}%
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 hidden sm:block">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${item.percentual}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                        {item.valor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <TableCell className="text-slate-900">TOTAL GERAL</TableCell>
                    <TableCell className="text-center text-slate-900">{pagamentosFiltrados.length}</TableCell>
                    <TableCell className="text-right text-slate-900 font-mono">100.0%</TableCell>
                    <TableCell className="text-right font-mono text-slate-900 text-base">
                      {totalFaturado.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: FARMÁCIA E STOCK */}
        <TabsContent value="farmacia" className="pt-2">
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Medicamentos em Nível de Alerta ou Rutura
                </CardTitle>
                <CardDescription>
                  Fármacos cujo stock atual é menor ou igual ao stock mínimo de segurança
                </CardDescription>
              </div>
              <span className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {medicamentosCriticos.length} em Alerta
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-600 text-xs">Fármaco / Apresentação</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs">Princípio Activo</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-center">Stock Atual</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-center">Stock Mínimo</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicamentosCriticos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-green-700 text-xs font-medium">
                        Todos os medicamentos possuem stock operacional adequado acima da margem mínima.
                      </TableCell>
                    </TableRow>
                  ) : (
                    medicamentosCriticos.map((med) => (
                      <TableRow 
                        key={med.id}
                        className="even:bg-blue-50/20 hover:bg-blue-50/60 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-semibold text-slate-900 text-sm">
                          {med.nome} <span className="text-xs text-slate-500 font-normal">({med.dosagem} • {med.forma})</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{med.principio_activo}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-red-600 text-sm">
                          {med.stock}
                        </TableCell>
                        <TableCell className="text-center font-mono text-slate-500 text-xs">
                          {med.stock_minimo}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            med.stock === 0 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {med.stock === 0 ? 'Rutura Total' : 'Stock Baixo'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL OFICIAL DE EXPORTAÇÃO / IMPRESSÃO DO RELATÓRIO EXECUTIVO */}
      <Dialog open={modalExportar} onOpenChange={setModalExportar}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-slate-200">
          {/* Barra de Ações Superior (Oculta na impressão) */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print sticky top-0 z-20">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Relatório Executivo Hospitalar
              </h2>
              <p className="text-xs text-slate-500">
                Documento timbrado oficial formatado para impressão em A4 ou exportação em PDF.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportarCSV}
                className="h-8 text-xs border-slate-300 text-slate-700 hover:text-blue-700 hover:bg-blue-50 gap-1.5 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Exportar CSV
              </Button>

              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / Guardar PDF
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setModalExportar(false)}
                className="h-8 text-xs text-slate-500 hover:text-slate-800"
              >
                Fechar
              </Button>
            </div>
          </div>

          {/* DOCUMENTO OFICIAL TIMBRADO (Área Impressa: .print-area) */}
          <div className="p-6 sm:p-8 bg-white print-area space-y-6">
            
            {/* Cabeçalho Institucional com Logotipo da Empresa */}
            <div className="border-b-2 border-blue-900 pb-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <HospitalLogo size="lg" />
                  <div>
                    <h1 className="text-xl font-extrabold text-blue-900 tracking-tight">
                      {hospital?.nome || 'Hospital Geral & Centro Clínico'}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Direcção Geral • Gestão Clínica & Administração Financeira
                    </p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-mono">
                      <span>NUIT: {hospital?.nuit || '400987654'}</span>
                      <span>•</span>
                      <span>Tel: {hospital?.telefone || '+258 21 000 000'}</span>
                      <span>•</span>
                      <span>{hospital?.endereco || 'Maputo, Moçambique'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right border-l sm:border-l-0 pl-3 sm:pl-0 border-blue-200">
                  <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-xs font-bold uppercase tracking-wider">
                    RELATÓRIO EXECUTIVO
                  </span>
                  <div className="text-xs text-slate-600 mt-1.5 font-medium">
                    Ref: <strong className="font-mono text-slate-900">REL-{new Date().getFullYear()}-{String(consultasFiltradas.length + pagamentosFiltrados.length).padStart(4, '0')}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Emissão: {new Date().toLocaleString('pt-MZ', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              {/* Título do Relatório */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                    Relatório Executivo de Desempenho Clínico & Financeiro
                  </h2>
                  <p className="text-xs text-slate-500">
                    Período Analisado: <strong>{new Date(dataInicio).toLocaleDateString('pt-MZ')}</strong> até{' '}
                    <strong>{new Date(dataFim).toLocaleDateString('pt-MZ')}</strong>
                  </p>
                </div>
                <div className="text-xs text-slate-600">
                  Responsável: <strong className="text-slate-800">{sessao?.perfil.nome || 'Administrador do Sistema'}</strong>
                </div>
              </div>
            </div>

            {/* Sumário Executivo: 4 Indicadores Chave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Consultas Marcadas
                </span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                  {consultasFiltradas.length}
                </span>
                <span className="text-[11px] text-green-700 font-medium">
                  {consultasPorEstado.CONCLUIDA} concluídas ({consultasFiltradas.length > 0 ? Math.round((consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100) : 0}%)
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/40">
                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
                  Atendimentos Médicos
                </span>
                <span className="text-xl font-bold text-blue-900 mt-0.5 block font-mono">
                  {atendimentosFiltrados.length}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">
                  Prescrições emitidas
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Novos Utentes
                </span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                  {pacientesFiltrados.length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Processos abertos
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-green-200 bg-green-50/40">
                <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider block">
                  Faturamento Liquidado
                </span>
                <span className="text-xl font-bold text-green-800 mt-0.5 block font-mono">
                  {totalFaturado.toLocaleString('pt-MZ')} <span className="text-xs font-normal">MT</span>
                </span>
                <span className="text-[11px] text-green-700 font-medium">
                  {pagamentosFiltrados.length} recibos quitados
                </span>
              </div>
            </div>

            {/* SEÇÃO 1: FLUXO DE CONSULTAS */}
            <div className="space-y-2 page-break-inside-avoid">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs" />
                1. Distribuição & Desempenho do Fluxo de Consultas
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Estado da Consulta</th>
                      <th className="py-2 px-3 text-center">Quantidade</th>
                      <th className="py-2 px-3 text-center">Representatividade</th>
                      <th className="py-2 px-3 text-right">Classificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="even:bg-blue-50/15">
                      <td className="py-2 px-3 font-semibold text-slate-900">Consultas Concluídas com Sucesso</td>
                      <td className="py-2 px-3 text-center font-bold text-green-700 font-mono">{consultasPorEstado.CONCLUIDA}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        {consultasFiltradas.length > 0 ? `${Math.round((consultasPorEstado.CONCLUIDA / consultasFiltradas.length) * 100)}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                          Positivo
                        </span>
                      </td>
                    </tr>
                    <tr className="even:bg-blue-50/15">
                      <td className="py-2 px-3 font-semibold text-slate-900">Em Sala de Espera (Aguardando Médico)</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-700 font-mono">{consultasPorEstado.SALA_ESPERA}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        {consultasFiltradas.length > 0 ? `${Math.round((consultasPorEstado.SALA_ESPERA / consultasFiltradas.length) * 100)}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Pendente
                        </span>
                      </td>
                    </tr>
                    <tr className="even:bg-blue-50/15">
                      <td className="py-2 px-3 font-semibold text-slate-900">Consultas Agendadas Futuras</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-700 font-mono">{consultasPorEstado.AGENDADA}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        {consultasFiltradas.length > 0 ? `${Math.round((consultasPorEstado.AGENDADA / consultasFiltradas.length) * 100)}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Agendada
                        </span>
                      </td>
                    </tr>
                    <tr className="even:bg-blue-50/15">
                      <td className="py-2 px-3 font-semibold text-slate-900">Canceladas / Desistências</td>
                      <td className="py-2 px-3 text-center font-bold text-red-700 font-mono">{consultasPorEstado.CANCELADA}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        {consultasFiltradas.length > 0 ? `${Math.round((consultasPorEstado.CANCELADA / consultasFiltradas.length) * 100)}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          Cancelada
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 2: PRODUTIVIDADE MÉDICA */}
            <div className="space-y-2 page-break-inside-avoid">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs" />
                2. Produtividade & Rendimento do Corpo Clínico
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Médico Especialista</th>
                      <th className="py-2 px-3">N.º da Ordem</th>
                      <th className="py-2 px-3 text-center">Consultas Atribuídas</th>
                      <th className="py-2 px-3 text-center">Concluídas</th>
                      <th className="py-2 px-3 text-right">Receita Gerada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {produtividadeMedicos.map(({ medico, concluidas, total, receita }) => (
                      <tr key={medico.id} className="even:bg-blue-50/15">
                        <td className="py-2 px-3 font-semibold text-slate-900">{medico.nome}</td>
                        <td className="py-2 px-3 font-mono text-blue-700 font-semibold">{medico.numero_ordem}</td>
                        <td className="py-2 px-3 text-center font-mono">{total}</td>
                        <td className="py-2 px-3 text-center font-bold text-green-700 font-mono">{concluidas}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {receita.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 3: RECEITAS POR CANAL DE COBRANÇA */}
            <div className="space-y-2 page-break-inside-avoid">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs" />
                3. Arrecadação Financeira por Canal de Cobrança
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Método / Canal</th>
                      <th className="py-2 px-3 text-center">Transacções</th>
                      <th className="py-2 px-3 text-center">Participação</th>
                      <th className="py-2 px-3 text-right">Montante Liquidado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagamentosPorMetodo.map((item) => (
                      <tr key={item.metodo} className="even:bg-blue-50/15">
                        <td className="py-2 px-3 font-semibold text-slate-900">{item.label}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.qtd}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.percentual.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {item.valor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td className="py-2 px-3 text-slate-900">TOTAL CONSOLIDADO</td>
                      <td className="py-2 px-3 text-center font-mono">{pagamentosFiltrados.length}</td>
                      <td className="py-2 px-3 text-center font-mono">100.0%</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 text-sm">
                        {totalFaturado.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 4: ALERTAS DE FARMÁCIA */}
            {medicamentosCriticos.length > 0 && (
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <span className="w-1.5 h-3.5 bg-amber-500 rounded-xs" />
                  4. Alertas Farmacêuticos & Itens em Nível Crítico ({medicamentosCriticos.length})
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Fármaco</th>
                        <th className="py-2 px-3">Princípio Activo</th>
                        <th className="py-2 px-3 text-center">Estoque Atual</th>
                        <th className="py-2 px-3 text-center">Nível Mínimo</th>
                        <th className="py-2 px-3 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicamentosCriticos.map((med) => (
                        <tr key={med.id} className="even:bg-blue-50/15">
                          <td className="py-2 px-3 font-semibold text-slate-900">{med.nome}</td>
                          <td className="py-2 px-3 text-slate-600">{med.principio_activo}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-red-600">{med.stock} un.</td>
                          <td className="py-2 px-3 text-center font-mono text-slate-500">{med.stock_minimo} un.</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              med.stock === 0 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {med.stock === 0 ? 'Rutura Total' : 'Stock Baixo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Termo de Homologação e Assinaturas Oficiais */}
            <div className="pt-6 border-t border-slate-200 page-break-inside-avoid space-y-8">
              <div className="text-xs text-slate-500 italic leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                "O presente documento consolida os registos assistenciais, indicadores de assiduidade clínica e fluxos de caixa auditados no sistema hospitalar para o período acima discriminado, estando apto para prestação de contas e homologação institucional."
              </div>

              <div className="grid grid-cols-2 gap-12 pt-4">
                <div className="text-center">
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-800 text-xs">
                    Director(a) Clínico(a)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Homologação Técnica & Assistencial
                  </div>
                </div>

                <div className="text-center">
                  <div className="border-t border-slate-400 pt-2 font-semibold text-slate-800 text-xs">
                    Administrador(a) Hospitalar & Financeiro
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Conferência Administrativa & Contábil
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100 flex items-center justify-between">
                <span>{hospital?.nome || 'Hospital Geral & Centro Clínico'} • Sistema Integrado de Gestão Hospitalar</span>
                <span>Página 1 de 1 • Gerado eletronicamente com carimbo de integridade</span>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
