import React, { useState, useMemo } from 'react';
import { useDados } from '@/controllers/DadosController';
import { useAuth } from '@/controllers/AuthController';
import { validarMedicamentoInput } from '@/models/ValidadoresModel';
import { podeEditar } from '@/lib/permissoes';
import { descarregarCSV } from '@/lib/utils';
import { HospitalLogo } from '@/components/common/HospitalLogo';
import type { Medicamento } from '@/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpDown,
  Printer,
  Download,
  Filter,
  AlertCircle,
} from 'lucide-react';

export function Medicamentos() {
  const { dados, criar, editar, eliminar } = useDados();
  const { sessao } = useAuth();
  const hospital = sessao?.hospital;
  const podeModificar = podeEditar(sessao?.perfil.papel, 'medicamentos');

  const [busca, setBusca] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [medicamentoEditando, setMedicamentoEditando] = useState<Medicamento | null>(null);
  const [medicamentoEliminando, setMedicamentoEliminando] = useState<Medicamento | null>(null);
  const [modalEstoque, setModalEstoque] = useState<Medicamento | null>(null);
  const [novoStock, setNovoStock] = useState(0);
  const [erroForm, setErroForm] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  // Estado do Modal de Exportação do Estoque
  const [modalExportar, setModalExportar] = useState(false);
  const [filtroExportStatus, setFiltroExportStatus] = useState<string>('TODOS');
  const [filtroExportForma] = useState<string>('TODAS');

  // Form State Medicamento
  const [nome, setNome] = useState('');
  const [principioActivo, setPrincipioActivo] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [forma, setForma] = useState('Comprimido');
  const [stockInicial, setStockInicial] = useState(100);
  const [stockMinimo, setStockMinimo] = useState(20);

  const limparForm = () => {
    setNome('');
    setPrincipioActivo('');
    setDosagem('');
    setForma('Comprimido');
    setStockInicial(100);
    setStockMinimo(20);
    setErroForm('');
    setMedicamentoEditando(null);
  };

  const abrirEdicao = (m: Medicamento) => {
    setMedicamentoEditando(m);
    setNome(m.nome);
    setPrincipioActivo(m.principio_activo);
    setDosagem(m.dosagem);
    setForma(m.forma);
    setStockInicial(m.stock);
    setStockMinimo(m.stock_minimo);
    setErroForm('');
    setModalNovo(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');

    const validacao = validarMedicamentoInput(
      {
        nome,
        principio_activo: principioActivo,
        dosagem,
        forma,
        stock: Number(stockInicial),
        stock_minimo: Number(stockMinimo),
      },
      dados.medicamentos,
      medicamentoEditando?.id,
    );

    if (!validacao.valido) {
      setErroForm(validacao.erro || 'Dados inválidos.');
      toast.error(validacao.erro || 'Verifique os dados do medicamento.');
      return;
    }

    setAProcessar(true);
    try {
      if (medicamentoEditando) {
        await editar(
          'medicamentos',
          medicamentoEditando.id,
          {
            nome: nome.trim(),
            principio_activo: principioActivo.trim(),
            dosagem: dosagem.trim(),
            forma,
            stock: Number(stockInicial),
            stock_minimo: Number(stockMinimo),
          },
          `Actualizou o fármaco ${nome.trim()} (${dosagem.trim()})`,
        );
        toast.success(`Medicamento ${nome.trim()} actualizado com sucesso.`);
      } else {
        await criar(
          'medicamentos',
          {
            nome: nome.trim(),
            principio_activo: principioActivo.trim(),
            dosagem: dosagem.trim(),
            forma,
            stock: Number(stockInicial),
            stock_minimo: Number(stockMinimo),
            activo: true,
          },
          `Cadastrou o medicamento ${nome.trim()} (${dosagem.trim()})`,
        );
        toast.success(`Medicamento ${nome.trim()} registado no catálogo.`);
      }

      limparForm();
      setModalNovo(false);
    } catch (err: any) {
      const msg = err.message || 'Erro ao guardar medicamento.';
      setErroForm(msg);
      toast.error(msg);
    } finally {
      setAProcessar(false);
    }
  };

  const handleAtualizarEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEstoque) return;
    if (novoStock < 0) {
      toast.error('A quantidade em stock não pode ser negativa.');
      return;
    }

    setAProcessar(true);
    try {
      await editar(
        'medicamentos',
        modalEstoque.id,
        { stock: Number(novoStock) },
        `Ajuste manual de stock de ${modalEstoque.nome}: de ${modalEstoque.stock} para ${novoStock} un.`,
      );
      toast.success(`Stock de ${modalEstoque.nome} actualizado para ${novoStock} un.`);
      setModalEstoque(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao actualizar stock.');
    } finally {
      setAProcessar(false);
    }
  };

  const alternarActivo = async (m: Medicamento) => {
    try {
      await editar(
        'medicamentos',
        m.id,
        { activo: !m.activo },
        `${m.activo ? 'Desactivou' : 'Activou'} o fármaco ${m.nome}`,
      );
      toast.success(`Fármaco ${m.nome} ${m.activo ? 'inactivado' : 'reactivado'}.`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar estado do medicamento.');
    }
  };

  const confirmarEliminacao = async () => {
    if (!medicamentoEliminando) return;
    setAProcessar(true);
    try {
      await eliminar(
        'medicamentos',
        medicamentoEliminando.id,
        `Eliminou o medicamento ${medicamentoEliminando.nome} (${medicamentoEliminando.dosagem})`,
      );
      toast.success(`Medicamento ${medicamentoEliminando.nome} eliminado do catálogo.`);
      setMedicamentoEliminando(null);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível eliminar o medicamento.');
    } finally {
      setAProcessar(false);
    }
  };

  const medicamentosFiltrados = dados.medicamentos.filter((m) => {
    const q = busca.toLowerCase().trim();
    if (!q) return true;
    return (
      m.nome.toLowerCase().includes(q) ||
      m.principio_activo.toLowerCase().includes(q) ||
      m.forma.toLowerCase().includes(q) ||
      m.dosagem.toLowerCase().includes(q)
    );
  });

  // Estatísticas do Inventário para Exportação
  const statsInventario = useMemo(() => {
    const totalItens = dados.medicamentos.length;
    const totalUnidades = dados.medicamentos.reduce((acc, m) => acc + m.stock, 0);
    const totalRuturas = dados.medicamentos.filter((m) => m.stock === 0).length;
    const totalBaixo = dados.medicamentos.filter((m) => m.activo && m.stock <= m.stock_minimo && m.stock > 0).length;
    const totalOperacional = totalItens - totalRuturas - totalBaixo;
    return { totalItens, totalUnidades, totalRuturas, totalBaixo, totalOperacional };
  }, [dados.medicamentos]);

  // Lista dinâmica de fármacos filtrada para exportação
  const itensExportacao = useMemo(() => {
    return dados.medicamentos.filter((m) => {
      const esgotado = m.stock === 0;
      const estoqueBaixo = m.activo && m.stock <= m.stock_minimo && !esgotado;

      let matchStatus = true;
      if (filtroExportStatus === 'RUTURA') matchStatus = esgotado;
      else if (filtroExportStatus === 'BAIXO') matchStatus = estoqueBaixo;
      else if (filtroExportStatus === 'ALERTAS') matchStatus = esgotado || estoqueBaixo;
      else if (filtroExportStatus === 'DISPONIVEL') matchStatus = !esgotado && !estoqueBaixo;

      const matchForma = filtroExportForma === 'TODAS' || m.forma === filtroExportForma;

      return matchStatus && matchForma;
    });
  }, [dados.medicamentos, filtroExportStatus, filtroExportForma]);

  // Download CSV compatível com Excel UTF-8
  const handleExportarCSV = () => {
    const colunas = [
      'ID / Referência',
      'Nome Comercial',
      'Princípio Activo',
      'Dosagem',
      'Forma Farmacêutica',
      'Stock Mínimo',
      'Stock Actual',
      'Estado Operacional',
    ];

    const linhas = itensExportacao.map((m) => {
      const esgotado = m.stock === 0;
      const estoqueBaixo = m.activo && m.stock <= m.stock_minimo && !esgotado;
      const statusStr = esgotado ? 'Rutura Total' : estoqueBaixo ? 'Abaixo do Mínimo' : 'Disponível';
      return [
        m.id.slice(0, 8).toUpperCase(),
        m.nome,
        m.principio_activo,
        m.dosagem,
        m.forma,
        m.stock_minimo,
        m.stock,
        statusStr,
      ];
    });

    descarregarCSV(`Inventario_Stock_${new Date().toISOString().slice(0, 10)}`, colunas, linhas);
  };

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Farmácia & Gestão de Stock</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200 tabular-nums">
              {medicamentosFiltrados.length} itens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo de fármacos essenciais, formas farmacêuticas, dosagens e controlo de stock.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalExportar(true)}
            className="border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF] font-semibold text-xs shadow-xs gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
            Exportar / Imprimir
          </Button>

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
              Adicionar Medicamento
            </Button>
          )}
        </div>
      </div>

      {/* Pesquisa */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" aria-hidden="true" />
        <Input
          aria-label="Pesquisar medicamentos"
          placeholder="Pesquisar por nome comercial, princípio activo, forma ou dosagem…"
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

      {/* Tabela de Medicamentos */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome do Medicamento</th>
                <th className="py-3 px-4">Princípio Activo & Dosagem</th>
                <th className="py-3 px-4">Forma</th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="py-3 px-4">Nível Mínimo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {medicamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum medicamento encontrado no catálogo para o termo pesquisado.
                  </td>
                </tr>
              ) : (
                medicamentosFiltrados.map((m) => {
                  const esgotado = m.stock === 0;
                  const estoqueBaixo = m.activo && m.stock <= m.stock_minimo && !esgotado;
                  return (
                    <tr key={m.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 text-sm">{m.nome}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-medium text-xs">{m.principio_activo}</div>
                        <div className="text-xs text-[#0284C7] font-mono font-medium">{m.dosagem}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {m.forma}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs ${
                              esgotado ? 'text-rose-700' : estoqueBaixo ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {m.stock} un.
                          </span>
                          {esgotado ? (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              Esgotado
                            </span>
                          ) : estoqueBaixo ? (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Stock Baixo
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs tabular-nums">
                        {m.stock_minimo} un.
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                            m.activo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {m.activo ? 'Disponível' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        {podeModificar && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-medium border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF]"
                              onClick={() => {
                                setModalEstoque(m);
                                setNovoStock(m.stock);
                              }}
                              title="Ajustar Quantidade em Stock"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-[#0284C7]" aria-hidden="true" />
                              Stock
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-[#0284C7] hover:bg-[#F0F9FF]"
                              onClick={() => abrirEdicao(m)}
                              title="Editar Dados do Medicamento"
                              aria-label={`Editar medicamento ${m.nome}`}
                            >
                              <Edit className="w-3.5 h-3.5" aria-hidden="true" />
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
                              title={m.activo ? 'Inactivar Fármaco' : 'Reactivar Fármaco'}
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
                              onClick={() => setMedicamentoEliminando(m)}
                              title="Eliminar Fármaco do Catálogo"
                              aria-label={`Eliminar medicamento ${m.nome}`}
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

      {/* Modal Cadastro / Edição de Medicamento */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {medicamentoEditando ? 'Actualizar Dados do Medicamento' : 'Registar Novo Medicamento'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informe a denominação comercial, princípio activo, dosagem e níveis de stock.
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
              <Label htmlFor="farm-nome" className="text-xs">
                Nome Comercial do Medicamento *
              </Label>
              <Input
                id="farm-nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Paracetamol 500mg"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="farm-pa" className="text-xs">
                Princípio Activo *
              </Label>
              <Input
                id="farm-pa"
                required
                value={principioActivo}
                onChange={(e) => setPrincipioActivo(e.target.value)}
                placeholder="Ex: Paracetamol"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="farm-dos" className="text-xs">
                  Dosagem / Concentração *
                </Label>
                <Input
                  id="farm-dos"
                  required
                  value={dosagem}
                  onChange={(e) => setDosagem(e.target.value)}
                  placeholder="Ex: 500 mg"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Forma Farmacêutica *</Label>
                <Select value={forma} onValueChange={setForma}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Comprimido', 'Cápsula', 'Xarope', 'Injetável', 'Pomada', 'Gotas'].map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="farm-stock" className="text-xs">
                  Stock Actual (Unidades)
                </Label>
                <Input
                  id="farm-stock"
                  type="number"
                  min={0}
                  value={stockInicial}
                  onChange={(e) => setStockInicial(Number(e.target.value))}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="farm-min" className="text-xs">
                  Stock Mínimo para Alerta
                </Label>
                <Input
                  id="farm-min"
                  type="number"
                  min={1}
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(Number(e.target.value))}
                  className="text-xs font-mono"
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
                {aProcessar ? 'A guardar…' : medicamentoEditando ? 'Guardar Alterações' : 'Registar Fármaco'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ajustar Stock */}
      <Dialog open={!!modalEstoque} onOpenChange={(open) => !open && setModalEstoque(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Ajuste Rápido de Stock</DialogTitle>
            <DialogDescription className="text-xs">
              Actualize a quantidade física real de <strong>{modalEstoque?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAtualizarEstoque} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="ajuste-stock" className="text-xs">
                Nova Quantidade em Stock (Unidades) *
              </Label>
              <Input
                id="ajuste-stock"
                type="number"
                min={0}
                required
                value={novoStock}
                onChange={(e) => setNovoStock(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalEstoque(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={aProcessar}
                className="font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white"
              >
                Guardar Stock
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Eliminação de Medicamento */}
      <Dialog open={!!medicamentoEliminando} onOpenChange={(open) => !open && setMedicamentoEliminando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Eliminação de Medicamento
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Tem a certeza que deseja eliminar permanentemente o medicamento{' '}
              <strong>{medicamentoEliminando?.nome}</strong> ({medicamentoEliminando?.dosagem})?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Nota de integridade: Medicamentos já prescritos em receitas médicas ou vinculados a requisições têm a eliminação bloqueada para manter o histórico farmacêutico.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMedicamentoEliminando(null)}
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

      {/* MODAL OFICIAL DE EXPORTAÇÃO / IMPRESSÃO DE STOCK */}
      <Dialog open={modalExportar} onOpenChange={setModalExportar}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-slate-200">
          <div className="p-4 bg-[#F8FAFC] border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print sticky top-0 z-20">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                Exportação de Stock Farmacêutico
              </h2>
              <p className="text-xs text-slate-500">
                Pré-visualize o documento oficial antes de imprimir ou descarregar em CSV.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportarCSV}
                className="h-8 text-xs border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF] gap-1.5 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                Exportar CSV
              </Button>

              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs bg-[#0284C7] hover:bg-[#0369A1] text-white gap-1.5 font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                Imprimir / PDF
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

          <div className="px-6 py-3 bg-[#F0F9FF]/60 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
              <span className="font-semibold text-slate-700">Filtro de Inventário:</span>
              <Select value={filtroExportStatus} onValueChange={setFiltroExportStatus}>
                <SelectTrigger className="h-7 text-xs w-44 bg-white">
                  <SelectValue placeholder="Estado do Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Fármacos</SelectItem>
                  <SelectItem value="ALERTAS">Apenas em Alerta (Rutura + Baixo)</SelectItem>
                  <SelectItem value="RUTURA">Apenas Rutura Total</SelectItem>
                  <SelectItem value="BAIXO">Apenas Abaixo do Mínimo</SelectItem>
                  <SelectItem value="DISPONIVEL">Apenas Stock Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-slate-500 font-medium tabular-nums">
              Listando <strong className="text-[#0284C7]">{itensExportacao.length}</strong> de{' '}
              {dados.medicamentos.length} fármacos
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white print-area space-y-6">
            <div className="border-b-2 border-[#0284C7] pb-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <HospitalLogo size="lg" />
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {hospital?.nome || 'Hospital Geral & Centro Clínico'}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Direcção Clínica • Departamento de Farmácia Hospitalar
                    </p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-mono tabular-nums">
                      <span>NUIT: {hospital?.nuit || '400987654'}</span>
                      <span>•</span>
                      <span>Tel: {hospital?.telefone || '+258 21 000 000'}</span>
                      <span>•</span>
                      <span>{hospital?.endereco || 'Maputo, Moçambique'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-[#F0F9FF] text-[#0284C7] border border-sky-200 font-mono text-xs font-bold uppercase tracking-wider">
                    DOCUMENTO OFICIAL
                  </span>
                  <div className="text-xs text-slate-600 mt-1.5 font-medium tabular-nums">
                    Ref:{' '}
                    <strong className="font-mono text-slate-900">
                      INV-{new Date().getFullYear()}-{String(dados.medicamentos.length).padStart(4, '0')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
              <div className="p-3 rounded-lg border border-slate-200 bg-[#F8FAFC]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Itens no Catálogo
                </span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {statsInventario.totalItens}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-sky-200 bg-[#F0F9FF]">
                <span className="text-[10px] font-semibold text-[#0284C7] uppercase tracking-wider block">
                  Unidades em Stock
                </span>
                <span className="text-xl font-bold text-[#0284C7] mt-0.5 block font-mono">
                  {statsInventario.totalUnidades.toLocaleString('pt-MZ')}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">
                  Stock Mínimo / Alerta
                </span>
                <span className="text-xl font-bold text-amber-900 mt-0.5 block">{statsInventario.totalBaixo}</span>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/40">
                <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">
                  Rutura Total
                </span>
                <span className="text-xl font-bold text-rose-700 mt-0.5 block">{statsInventario.totalRuturas}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Nome Comercial</th>
                    <th className="py-2.5 px-3">Princípio Activo & Dosagem</th>
                    <th className="py-2.5 px-3">Forma</th>
                    <th className="py-2.5 px-3 text-center">Mínimo</th>
                    <th className="py-2.5 px-3 text-center">Actual</th>
                    <th className="py-2.5 px-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 tabular-nums">
                  {itensExportacao.map((m) => {
                    const esgotado = m.stock === 0;
                    const estoqueBaixo = m.activo && m.stock <= m.stock_minimo && !esgotado;
                    return (
                      <tr key={m.id}>
                        <td className="py-2 px-3 font-mono font-bold text-[#0284C7] text-[11px]">
                          #{m.id.slice(0, 6).toUpperCase()}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{m.nome}</td>
                        <td className="py-2 px-3">
                          {m.principio_activo} <span className="font-mono text-[#0284C7]">({m.dosagem})</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{m.forma}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{m.stock_minimo} un.</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{m.stock} un.</td>
                        <td className="py-2 px-3 text-right">
                          {esgotado ? 'Rutura Total' : estoqueBaixo ? 'Stock Baixo' : 'Disponível'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
