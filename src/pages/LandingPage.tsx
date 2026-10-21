import React, { useState } from 'react';
import { useAuth } from '@/controllers/AuthController';
import { APP_NOME, APP_NOME_COMPLETO } from '@/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HospitalCarousel } from '@/components/landing/HospitalCarousel';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Users,
  Calendar,
  Pill,
  CreditCard,
  Lock,
  ArrowRight,
  Building2,
  CheckCircle2,
} from 'lucide-react';

const MODULOS_RESUMO = [
  {
    icone: Users,
    titulo: 'Pacientes e Recepção',
    descricao: 'Registo biográfico validado com BI, NUIT, grupo sanguíneo e histórico clínico individual.',
    itens: ['Validação de dados únicos', 'Pesquisa rápida por nome ou BI'],
  },
  {
    icone: Calendar,
    titulo: 'Agenda e Consultas',
    descricao: 'Marcação por especialidade e médico, controlo de prioridades e fila de espera em tempo real.',
    itens: ['Triagem Normal, Prioritária e Urgente', 'Gestão completa de estados'],
  },
  {
    icone: Stethoscope,
    titulo: 'Consultório e Prontuário',
    descricao: 'Registo de sinais vitais, diagnóstico clínico e prescrição digital com impressão de receita.',
    itens: ['Baixa automática na farmácia', 'Receita médica padronizada'],
  },
  {
    icone: Pill,
    titulo: 'Farmácia e Requisições',
    descricao: 'Catálogo de medicamentos, controlo de stock mínimo e pedidos de reposição à Direcção.',
    itens: ['Alertas de stock crítico', 'Aprovação com entrada automática'],
  },
  {
    icone: CreditCard,
    titulo: 'Caixa e Facturação',
    descricao: 'Cobrança de serviços clínicos por Numerário, POS, M-Pesa, e-Mola e Seguro de Saúde.',
    itens: ['Emissão de recibos numerados', 'Relatórios financeiros diários'],
  },
  {
    icone: ShieldCheck,
    titulo: 'Segurança e Auditoria',
    descricao: 'Acesso diferenciado por perfil profissional e registo cronológico de todas as operações.',
    itens: ['4 perfis com permissões próprias', 'Persistência em base de dados'],
  },
];

export function LandingPage({ onAbrirWorkspace }: { onAbrirWorkspace?: () => void } = {}) {
  const { entrar, registar, sessao } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAuth, setAbaAuth] = useState<'login' | 'registo'>('login');

  // Login form state
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Registo form state
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailRegisto, setEmailRegisto] = useState('');
  const [senhaRegisto, setSenhaRegisto] = useState('');
  const [nomeHospital, setNomeHospital] = useState('');
  const [cidadeHospital, setCidadeHospital] = useState('Maputo');
  const [nuitHospital, setNuitHospital] = useState('');
  const [erroRegisto, setErroRegisto] = useState('');
  const [carregandoRegisto, setCarregandoRegisto] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    setCarregandoLogin(true);
    try {
      await entrar(emailLogin, senhaLogin);
    } catch (err: any) {
      setErroLogin(err.message || 'Credenciais inválidas. Verifique o email e a palavra-passe.');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroRegisto('');
    setCarregandoRegisto(true);
    try {
      const res = await registar({
        nome: nomeAdmin,
        email: emailRegisto,
        senha: senhaRegisto,
        hospital: {
          nome: nomeHospital,
          nuit: nuitHospital || undefined,
        },
      });
      if (res.tipo === 'confirmar_email') {
        setErroRegisto('Conta criada. Confirme o seu email para iniciar sessão.');
      }
    } catch (err: any) {
      setErroRegisto(err.message || 'Erro ao criar workspace hospitalar.');
    } finally {
      setCarregandoRegisto(false);
    }
  };

  const preencherCredenciais = (email: string, senha: string) => {
    setEmailLogin(email);
    setSenhaLogin(senha);
    setErroLogin('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Cabeçalho Institucional Simples e Limpo */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Identidade Visual sem sublinhado em HOSPITALAR */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">SGH</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">
                  Hospitalar
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:block">
                Sistema Integrado de Gestão Hospitalar
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5">
            {sessao && onAbrirWorkspace ? (
              <Button
                size="sm"
                onClick={onAbrirWorkspace}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold px-4"
              >
                <Activity className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Ir para o Painel ({sessao.hospital?.nome || 'Hospital'})
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAbaAuth('login');
                    setModalAberto(true);
                  }}
                  className="font-semibold border-slate-300 text-slate-800 hover:bg-slate-50 px-3.5"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-[#0284C7]" aria-hidden="true" />
                  Entrar
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setAbaAuth('registo');
                    setModalAberto(true);
                  }}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold px-4"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Criar Workspace
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Secção Principal (Hero) Limpa e Equilibrada */}
      <section className="py-12 sm:py-16 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Coluna Esquerda: Título Resumido e Texto Formatado */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0284C7]">
                Plataforma Clínica Integrada
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Gestão Clínica e Hospitalar Simples e Integrada
              </h1>

              <p className="text-base text-slate-600 leading-relaxed">
                Centralize o registo de pacientes, marcação de consultas, prontuário médico,
                stock de farmácia e facturação numa única plataforma segura e rápida para toda a equipa.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {sessao && onAbrirWorkspace ? (
                  <Button
                    size="lg"
                    onClick={onAbrirWorkspace}
                    className="font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white px-6"
                  >
                    Aceder ao Sistema
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => {
                        setAbaAuth('login');
                        setModalAberto(true);
                      }}
                      className="font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white px-6"
                    >
                      <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
                      Entrar no Sistema
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setAbaAuth('registo');
                        setModalAberto(true);
                      }}
                      className="font-semibold border-slate-300 text-slate-800 hover:bg-slate-50 px-5"
                    >
                      <Building2 className="w-4 h-4 mr-2 text-[#0284C7]" aria-hidden="true" />
                      Registar Hospital
                    </Button>
                  </>
                )}
              </div>

              {/* Indicadores Resumidos */}
              <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-200 tabular-nums">
                <div>
                  <p className="text-xl font-bold text-[#0284C7]">100%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Prontuário Digital</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">4 Perfis</p>
                  <p className="text-xs text-slate-500 mt-0.5">Acesso por Função</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0284C7]">24/7</p>
                  <p className="text-xs text-slate-500 mt-0.5">Dados Sincronizados</p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Carrossel Harmonioso */}
            <div className="lg:col-span-7">
              <HospitalCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Secção de Módulos Simplificada (Paleta Azul e Branco) */}
      <section className="py-14 sm:py-16 bg-[#F8FAFC] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">
              Módulos do Sistema
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Áreas Operacionais Integradas
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Cada sector do hospital trabalha com permissões ajustadas à sua função.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULOS_RESUMO.map((m) => {
              const Icone = m.icone;
              return (
                <div
                  key={m.titulo}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#0284C7]/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center mb-3.5">
                      <Icone className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{m.titulo}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{m.descricao}</p>
                  </div>
                  <div className="pt-3.5 mt-4 border-t border-slate-100 space-y-1.5">
                    {m.itens.map((item) => (
                      <p key={item} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rodapé Simples */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{APP_NOME}</span>
            <span>• {APP_NOME_COMPLETO}</span>
          </div>
          <p>© {new Date().getFullYear()} SGH Hospitalar. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Modal de Autenticação e Registo */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-md border-slate-200 bg-white p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                <Building2 className="w-4 h-4" aria-hidden="true" />
              </span>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Acesso ao Sistema Hospitalar
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Inicie sessão com as suas credenciais ou registe uma nova unidade hospitalar.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={abaAuth} onValueChange={(v) => setAbaAuth(v as 'login' | 'registo')} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger
                value="login"
                className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0284C7] data-[state=active]:shadow-xs"
              >
                Iniciar Sessão
              </TabsTrigger>
              <TabsTrigger
                value="registo"
                className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0284C7] data-[state=active]:shadow-xs"
              >
                Criar Workspace
              </TabsTrigger>
            </TabsList>

            {/* Aba Login */}
            <TabsContent value="login" className="space-y-4 pt-3">
              {erroLogin && (
                <div
                  role="alert"
                  className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-medium"
                >
                  {erroLogin}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700">
                    Email Institucional *
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    required
                    placeholder="ex: admin@hospital.com"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    className="text-xs border-slate-300 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                    Palavra-passe *
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={senhaLogin}
                    onChange={(e) => setSenhaLogin(e.target.value)}
                    className="text-xs border-slate-300 bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-semibold h-10 bg-[#0284C7] hover:bg-[#0369A1] text-white"
                  disabled={carregandoLogin}
                >
                  {carregandoLogin ? 'A autenticar…' : 'Entrar no Sistema'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
                </Button>
              </form>

              {/* Acesso rápido por perfil para demonstração */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  Preenchimento rápido por perfil de acesso:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => preencherCredenciais('admin@hospital.com', 'admin123')}
                    className="text-left px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-colors text-[11px]"
                  >
                    <span className="font-semibold text-slate-800 block">Direcção / Admin</span>
                    <span className="text-slate-500">admin@hospital.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => preencherCredenciais('medico@hospital.com', 'medico123')}
                    className="text-left px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-colors text-[11px]"
                  >
                    <span className="font-semibold text-slate-800 block">Corpo Clínico</span>
                    <span className="text-slate-500">medico@hospital.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => preencherCredenciais('farmacia@hospital.com', 'farmacia123')}
                    className="text-left px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-colors text-[11px]"
                  >
                    <span className="font-semibold text-slate-800 block">Farmácia</span>
                    <span className="text-slate-500">farmacia@hospital.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => preencherCredenciais('recepcao@hospital.com', 'recepcao123')}
                    className="text-left px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-colors text-[11px]"
                  >
                    <span className="font-semibold text-slate-800 block">Recepção e Caixa</span>
                    <span className="text-slate-500">recepcao@hospital.com</span>
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Aba Registo */}
            <TabsContent value="registo" className="space-y-3.5 pt-3">
              {erroRegisto && (
                <div
                  role="alert"
                  className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-medium"
                >
                  {erroRegisto}
                </div>
              )}

              <form onSubmit={handleRegisto} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="reg-hospital" className="text-xs font-semibold text-slate-700">
                      Nome do Hospital *
                    </Label>
                    <Input
                      id="reg-hospital"
                      type="text"
                      required
                      placeholder="Ex: Hospital Central"
                      value={nomeHospital}
                      onChange={(e) => setNomeHospital(e.target.value)}
                      className="text-xs border-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-cidade" className="text-xs font-semibold text-slate-700">
                      Cidade *
                    </Label>
                    <Input
                      id="reg-cidade"
                      type="text"
                      required
                      placeholder="Ex: Maputo"
                      value={cidadeHospital}
                      onChange={(e) => setCidadeHospital(e.target.value)}
                      className="text-xs border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-nuit" className="text-xs font-semibold text-slate-700">
                    NUIT da Entidade (9 dígitos)
                  </Label>
                  <Input
                    id="reg-nuit"
                    type="text"
                    maxLength={9}
                    placeholder="Ex: 400192831"
                    value={nuitHospital}
                    onChange={(e) => setNuitHospital(e.target.value)}
                    className="text-xs border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-admin" className="text-xs font-semibold text-slate-700">
                    Nome do Responsável *
                  </Label>
                  <Input
                    id="reg-admin"
                    type="text"
                    required
                    placeholder="Ex: Dr. Carlos Macamo"
                    value={nomeAdmin}
                    onChange={(e) => setNomeAdmin(e.target.value)}
                    className="text-xs border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="reg-email" className="text-xs font-semibold text-slate-700">
                      Email *
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      required
                      placeholder="direcao@hospital.co.mz"
                      value={emailRegisto}
                      onChange={(e) => setEmailRegisto(e.target.value)}
                      className="text-xs border-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-senha" className="text-xs font-semibold text-slate-700">
                      Palavra-passe *
                    </Label>
                    <Input
                      id="reg-senha"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={senhaRegisto}
                      onChange={(e) => setSenhaRegisto(e.target.value)}
                      className="text-xs border-slate-300"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-semibold h-10 bg-[#0284C7] hover:bg-[#0369A1] text-white mt-1"
                  disabled={carregandoRegisto}
                >
                  {carregandoRegisto ? 'A criar workspace…' : 'Criar Workspace Hospitalar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
