import { useState, useMemo } from 'react';
import { useDados } from '@/context/DadosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Search, Activity, Lock, Database } from 'lucide-react';

export default function AuditoriaPage() {
  const { auditoria } = useDados();

  const [pesquisa, setPesquisa] = useState('');
  const [entidadeFiltro, setEntidadeFiltro] = useState('TODAS');

  const logsFiltrados = useMemo(() => {
    return auditoria
      .filter((item) => {
        const matchTexto =
          item.utilizador.toLowerCase().includes(pesquisa.toLowerCase()) ||
          item.accao.toLowerCase().includes(pesquisa.toLowerCase()) ||
          (item.detalhes && item.detalhes.toLowerCase().includes(pesquisa.toLowerCase()));

        const matchEntidade = entidadeFiltro === 'TODAS' || item.entidade === entidadeFiltro;

        return matchTexto && matchEntidade;
      })
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  }, [auditoria, pesquisa, entidadeFiltro]);

  const badgesAcao = (accao: string) => {
    const ac = accao.toUpperCase();
    if (ac.includes('CRIAR') || ac.includes('NOVO') || ac.includes('CADASTRO')) {
      return (
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
          {accao}
        </span>
      );
    }
    if (ac.includes('EDITAR') || ac.includes('ATUALIZAR') || ac.includes('AJUSTE')) {
      return (
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
          {accao}
        </span>
      );
    }
    if (ac.includes('CANCELAR') || ac.includes('DESATIVAR') || ac.includes('EXCLUIR')) {
      return (
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
          {accao}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
        {accao}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registo de Auditoria & Segurança</h1>
        <p className="text-sm text-slate-500">
          Rastreabilidade imutável de todas as operações, alterações cadastrais e acessos no sistema hospitalar
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Eventos Registados
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{auditoria.length}</div>
            <p className="text-xs text-slate-500 mt-1">Operações com carimbo temporal</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conformidade Regulatória
            </CardTitle>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-700">100% Auditável</div>
            <p className="text-xs text-slate-500 mt-1">Registo de prescrições e cobranças</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Segurança dos Registos
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Database className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">Isolamento Estrito</div>
            <p className="text-xs text-slate-500 mt-1">Multi-unidade com proteção e sigilo de dados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Logs */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Pesquisar por utilizador, acção ou detalhe..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="w-48">
              <Select value={entidadeFiltro} onValueChange={setEntidadeFiltro}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Entidades</SelectItem>
                  <SelectItem value="pacientes">Pacientes</SelectItem>
                  <SelectItem value="consultas">Consultas</SelectItem>
                  <SelectItem value="atendimentos">Atendimentos Médicos</SelectItem>
                  <SelectItem value="medicamentos">Medicamentos / Stock</SelectItem>
                  <SelectItem value="pagamentos">Pagamentos / Caixa</SelectItem>
                  <SelectItem value="medicos">Médicos</SelectItem>
                  <SelectItem value="perfis">Utilizadores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="font-semibold text-slate-600 text-xs">Data & Hora</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Utilizador Responsável</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Acção</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Módulo / Tabela</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Descrição do Evento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500 text-xs font-medium">
                    Nenhum registo de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logsFiltrados.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className="even:bg-blue-50/20 hover:bg-blue-50/60 transition-colors border-b border-slate-100"
                  >
                    <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                      {new Date(log.criado_em).toLocaleString('pt-MZ', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 text-sm">
                      {log.utilizador}
                    </TableCell>
                    <TableCell>
                      {badgesAcao(log.accao)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 font-semibold">
                      {log.entidade}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 max-w-md truncate">
                      {log.detalhes || 'Sem detalhes adicionais'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
