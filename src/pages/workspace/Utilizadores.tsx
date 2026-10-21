import React, { useState, useMemo } from 'react';
import { useDados } from '@/context/DadosContext';
import { useAuth } from '@/context/AuthContext';
import { Papel, PAPEL_LABEL, Perfil } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  UserPlus,
  Shield,
  Stethoscope,
  UserCheck,
  Pill,
  Edit,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { validarPerfilInput } from '@/models/ValidadoresModel';
import { toast } from 'sonner';

export default function UtilizadoresPage() {
  const { sessao, papelOriginal } = useAuth();
  const { perfis, especialidades, criarColaborador, criar, editar, eliminar } = useDados();

  const [pesquisa, setPesquisa] = useState('');
  const [papelFiltro, setPapelFiltro] = useState<string>('TODOS');

  const [dialogAberto, setDialogAberto] = useState(false);
  const [perfilEmEdicao, setPerfilEmEdicao] = useState<Perfil | null>(null);
  const [perfilEliminando, setPerfilEliminando] = useState<Perfil | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('123456');
  const [papel, setPapel] = useState<Papel>('MEDICO');
  // Campos adicionais se for Médico
  const [especialidadeId, setEspecialidadeId] = useState<string>('');
  const [numeroOrdem, setNumeroOrdem] = useState('');
  const [sala, setSala] = useState('Consultório 102');
  const [horario, setHorario] = useState('Segunda a Sexta, 08h - 16h');
  const [salvando, setSalvando] = useState(false);

  const isAdmin = sessao?.perfil.papel === 'ADMINISTRADOR' || papelOriginal === 'ADMINISTRADOR';

  const perfisFiltrados = useMemo(() => {
    return perfis.filter((p) => {
      const matchTexto =
        p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        p.email.toLowerCase().includes(pesquisa.toLowerCase());
      const matchPapel = papelFiltro === 'TODOS' || p.papel === papelFiltro;
      return matchTexto && matchPapel;
    });
  }, [perfis, pesquisa, papelFiltro]);

  const abrirCriacao = (papelInicial: Papel = 'MEDICO') => {
    setPerfilEmEdicao(null);
    setNome('');
    setEmail('');
    setSenha('123456');
    setPapel(papelInicial);
    setEspecialidadeId(especialidades[0]?.id || '');
    setNumeroOrdem('');
    setSala('Consultório 102');
    setHorario('Segunda a Sexta, 08h - 16h');
    setDialogAberto(true);
  };

  const abrirEdicao = (p: Perfil) => {
    setPerfilEmEdicao(p);
    setNome(p.nome);
    setEmail(p.email);
    setPapel(p.papel);
    setDialogAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const validacao = validarPerfilInput(
      { nome, email, senha: perfilEmEdicao ? undefined : senha },
      perfis,
      perfilEmEdicao?.id,
    );
    if (!validacao.valido) {
      toast.error(validacao.erro || 'Verifique os dados do funcionário.');
      return;
    }

    setSalvando(true);
    try {
      if (perfilEmEdicao) {
        await editar('perfis', perfilEmEdicao.id, {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          papel,
        });
        toast.success('Permissões e perfil do funcionário atualizados!');
      } else {
        const novoPerfil = await criarColaborador({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          papel,
        });

        // Se for médico e informou número da ordem, regista também no Corpo Clínico
        if (papel === 'MEDICO' && numeroOrdem.trim()) {
          await criar(
            'medicos',
            {
              perfil_id: novoPerfil.id,
              especialidade_id: especialidadeId || null,
              nome: nome.trim(),
              numero_ordem: numeroOrdem.trim(),
              telefone: null,
              email: email.trim().toLowerCase(),
              sala: sala.trim() || 'Consultório 101',
              horario: horario.trim() || 'Segunda a Sexta, 08h - 16h',
              activo: true,
            },
            `Credenciamento automático no Corpo Clínico: ${nome.trim()}`
          );
        }

        toast.success(
          `Funcionário ${nome.trim()} credenciado! Já pode iniciar sessão com ${email.trim().toLowerCase()}`
        );
      }
      setDialogAberto(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao guardar colaborador');
    } finally {
      setSalvando(false);
    }
  };

  const alternarEstado = async (p: Perfil) => {
    if (p.id === sessao?.perfil.id) {
      toast.error('Não é possível desativar a sua própria conta em sessão');
      return;
    }
    const novoEstado = !p.activo;
    await editar('perfis', p.id, { activo: novoEstado });
    toast.success(`Acesso de ${p.nome} ${novoEstado ? 'ativado' : 'revogado'} com sucesso.`);
  };

  const confirmarEliminacaoPerfil = async () => {
    if (!perfilEliminando) return;
    if (perfilEliminando.id === sessao?.perfil.id) {
      toast.error('Não é possível eliminar a conta actualmente em sessão.');
      return;
    }
    setSalvando(true);
    try {
      await eliminar(
        'perfis',
        perfilEliminando.id,
        `Eliminou o perfil de utilizador ${perfilEliminando.nome} (${perfilEliminando.email})`,
      );
      toast.success(`Utilizador ${perfilEliminando.nome} eliminado.`);
      setPerfilEliminando(null);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível eliminar o utilizador.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Equipa, Funcionários & Permissões
          </h1>
          <p className="text-sm text-slate-600">
            Credencie médicos, farmacêuticos e recepcionistas no workspace do hospital e controle os níveis de acesso de cada função.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => abrirCriacao('MEDICO')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Credenciar Novo Funcionário
          </Button>
        )}
      </div>

      {/* Arquitetura dos 4 Perfis do Workspace Hospitalar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Shield className="w-5 h-5" />
              </div>
              <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[11px] font-semibold">Nível 1 • Direção</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">
              Diretor / Administrador
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Controlo total centralizado do hospital, aprovação de aquisições/requisições, relatórios financeiros, auditoria e gestão de acessos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {perfis.filter((p) => p.papel === 'ADMINISTRADOR').length} ativo(s)
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirCriacao('ADMINISTRADOR')}
                className="h-7 text-xs text-[#0284C7] hover:bg-sky-50 font-semibold gap-1"
              >
                + Registar
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Stethoscope className="w-5 h-5" />
              </div>
              <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-[11px] font-semibold">Nível 2 • Clínico</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">
              Médico / Corpo Clínico
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Interface de consultório, fila de pacientes, prontuário eletrónico, sinais vitais, diagnóstico CID, receitas e requisição de insumos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {perfis.filter((p) => p.papel === 'MEDICO').length} ativo(s)
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirCriacao('MEDICO')}
                className="h-7 text-xs text-[#0284C7] hover:bg-sky-50 font-semibold gap-1"
              >
                + Registar Médico
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <Pill className="w-5 h-5" />
              </div>
              <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[11px] font-semibold">Nível 3 • Farmácia</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">
              Farmacêutico / Stock
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Interface dedicada ao inventário de medicamentos, controlo de lotes, alertas de rutura e pedidos de aquisição para o Diretor.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {perfis.filter((p) => p.papel === 'FARMACEUTICO').length} ativo(s)
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirCriacao('FARMACEUTICO')}
                className="h-7 text-xs text-[#0284C7] hover:bg-sky-50 font-semibold gap-1"
              >
                + Registar Farmacêutico
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100">
                <UserCheck className="w-5 h-5" />
              </div>
              <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[11px] font-semibold">Nível 4 • Atendimento</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">
              Recepcionista & Caixa
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 font-medium">
              Interface de admissão de pacientes, marcação de consultas, check-in para fila de espera, cobrança e emissão de recibos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {perfis.filter((p) => p.papel === 'RECEPCIONISTA').length} ativo(s)
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirCriacao('RECEPCIONISTA')}
                className="h-7 text-xs text-[#0284C7] hover:bg-sky-50 font-semibold gap-1"
              >
                + Registar Recepcionista
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Utilizadores */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Pesquisar funcionário por nome ou e-mail..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="w-56">
              <Select value={papelFiltro} onValueChange={setPapelFiltro}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filtrar por Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas as Funções</SelectItem>
                  <SelectItem value="ADMINISTRADOR">Diretor / Administrador</SelectItem>
                  <SelectItem value="MEDICO">Médico / Corpo Clínico</SelectItem>
                  <SelectItem value="FARMACEUTICO">Farmacêutico / Stock</SelectItem>
                  <SelectItem value="RECEPCIONISTA">Recepcionista & Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/75">
                <TableHead className="font-bold text-slate-800">Funcionário / Utilizador</TableHead>
                <TableHead className="font-bold text-slate-800">E-mail de Login</TableHead>
                <TableHead className="font-bold text-slate-800">Cargo & Interface</TableHead>
                <TableHead className="font-bold text-slate-800">Estado</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Credenciado em</TableHead>
                {isAdmin && <TableHead className="font-bold text-slate-800 text-right">Ações do Diretor</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {perfisFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-10 text-slate-500">
                    Nenhum colaborador encontrado para este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                perfisFiltrados.map((p) => {
                  const initials = p.nome
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const isCurrent = p.id === sessao?.perfil.id;

                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              {p.nome}
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                  Sessão Atual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{p.email}</TableCell>
                      <TableCell>
                        {p.papel === 'ADMINISTRADOR' && (
                          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200 gap-1 text-xs font-semibold">
                            <Shield className="w-3 h-3 text-[#0284C7]" />
                            {PAPEL_LABEL[p.papel]}
                          </Badge>
                        )}
                        {p.papel === 'MEDICO' && (
                          <Badge className="bg-sky-50 text-[#0284C7] hover:bg-sky-50 border-sky-200 gap-1 text-xs font-semibold">
                            <Stethoscope className="w-3 h-3 text-[#0284C7]" />
                            {PAPEL_LABEL[p.papel]}
                          </Badge>
                        )}
                        {p.papel === 'FARMACEUTICO' && (
                          <Badge className="bg-slate-50 text-slate-700 hover:bg-slate-50 border-slate-200 gap-1 text-xs font-semibold">
                            <Pill className="w-3 h-3 text-[#0284C7]" />
                            {PAPEL_LABEL[p.papel]}
                          </Badge>
                        )}
                        {p.papel === 'RECEPCIONISTA' && (
                          <Badge className="bg-slate-50 text-slate-700 hover:bg-slate-50 border-slate-200 gap-1 text-xs font-semibold">
                            <UserCheck className="w-3 h-3 text-[#0284C7]" />
                            {PAPEL_LABEL[p.papel]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.activo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            Inativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-600">
                        {new Date(p.criado_em).toLocaleDateString('pt-MZ')}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirEdicao(p)}
                              className="h-8 px-2 text-slate-700 hover:text-blue-700 text-xs gap-1"
                              title="Alterar Cargo ou Dados"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Cargo
                            </Button>
                            {!isCurrent && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => alternarEstado(p)}
                                  className={`h-8 text-xs font-semibold ${
                                    p.activo
                                      ? 'text-amber-700 hover:bg-amber-50'
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {p.activo ? 'Revogar' : 'Ativar'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPerfilEliminando(p)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Eliminar Utilizador"
                                  aria-label={`Eliminar utilizador ${p.nome}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG DE CRIAÇÃO / EDIÇÃO DE FUNCIONÁRIO */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {perfilEmEdicao ? 'Alterar Permissões do Colaborador' : 'Credenciar Funcionário no Workspace'}
            </DialogTitle>
            <DialogDescription>
              {perfilEmEdicao
                ? 'Atualize a função ou os dados deste colaborador dentro do hospital.'
                : 'Crie as credenciais de login para que o médico, farmacêutico ou recepcionista aceda à sua própria interface de trabalho.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome_user" className="text-xs font-semibold text-slate-800">
                Nome Completo do Profissional <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_user"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Dra. Ana Muthemba ou Joaquim Mondlane"
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email_user" className="text-xs font-semibold text-slate-800">
                  E-mail de Login <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email_user"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="profissional@gmail.com"
                  required
                  className="h-9"
                />
              </div>

              {!perfilEmEdicao && (
                <div className="space-y-1.5">
                  <Label htmlFor="senha_user" className="text-xs font-semibold text-slate-800">
                    Palavra-passe Inicial <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="senha_user"
                      type="text"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="h-9 pl-8 font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="papel_user" className="text-xs font-semibold text-slate-800">
                Cargo & Interface de Trabalho (RBAC) <span className="text-red-500">*</span>
              </Label>
              <Select value={papel} onValueChange={(val) => setPapel(val as Papel)}>
                <SelectTrigger id="papel_user" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEDICO">
                    Médico / Corpo Clínico — Consultório, Prontuário, Receitas e Pedidos
                  </SelectItem>
                  <SelectItem value="FARMACEUTICO">
                    Farmacêutico / Gestor de Stock — Inventário de Medicamentos e Aquisições
                  </SelectItem>
                  <SelectItem value="RECEPCIONISTA">
                    Recepcionista & Caixa — Pacientes, Marcações, Triagem e Recibos
                  </SelectItem>
                  <SelectItem value="ADMINISTRADOR">
                    Diretor / Administrador — Gestão Global, Aprovações, Relatórios e Equipa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Se for novo Médico, permite configurar já os dados clínicos */}
            {!perfilEmEdicao && papel === 'MEDICO' && (
              <div className="p-3.5 rounded-lg bg-sky-50/60 border border-sky-200 space-y-3">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Dados de Registo no Corpo Clínico
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">Especialidade Clínica</Label>
                    <Select value={especialidadeId} onValueChange={setEspecialidadeId}>
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">N.º da Ordem (OMM)</Label>
                    <Input
                      value={numeroOrdem}
                      onChange={(e) => setNumeroOrdem(e.target.value)}
                      placeholder="Ex: OMM-5410/CAR"
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">Gabinete / Consultório</Label>
                    <Input
                      value={sala}
                      onChange={(e) => setSala(e.target.value)}
                      placeholder="Consultório 102"
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">Turno / Horário</Label>
                    <Input
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      placeholder="Seg a Sex, 08h - 16h"
                      className="h-8 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="bg-[#0284C7] hover:bg-[#0369A1] text-white">
                {salvando ? 'A processar...' : perfilEmEdicao ? 'Guardar Alterações' : 'Credenciar Funcionário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO DE ELIMINAÇÃO DE PERFIL */}
      <Dialog open={!!perfilEliminando} onOpenChange={(open) => !open && setPerfilEliminando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Eliminação de Funcionário
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Tem a certeza que deseja eliminar permanentemente o acesso de{' '}
              <strong>{perfilEliminando?.nome}</strong> ({perfilEliminando?.email})?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPerfilEliminando(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmarEliminacaoPerfil}
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
