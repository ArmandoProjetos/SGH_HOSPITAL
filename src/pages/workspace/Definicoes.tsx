import { useState } from 'react';
import { useDados } from '@/controllers/DadosController';
import { useAuth } from '@/controllers/AuthController';
import { validarEmail, validarNuit } from '@/models/ValidadoresModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Database, Download, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function DefinicoesPage() {
  const { hospital, atualizarHospital, recarregarDados, dados } = useDados();
  const { sessao, modo } = useAuth();

  const [nome, setNome] = useState(hospital.nome || '');
  const [nuit, setNuit] = useState(hospital.nuit || '');
  const [endereco, setEndereco] = useState(hospital.endereco || '');
  const [telefone, setTelefone] = useState(hospital.telefone || '');
  const [email, setEmail] = useState(hospital.email || '');
  const [salvando, setSalvando] = useState(false);

  const isAdmin = sessao?.perfil.papel === 'ADMINISTRADOR';

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Apenas administradores podem actualizar as definições da instituição.');
      return;
    }

    const rNuit = validarNuit(nuit);
    if (!rNuit.valido) {
      toast.error(rNuit.erro || 'NUIT inválido.');
      return;
    }

    const rEmail = validarEmail(email, false);
    if (!rEmail.valido) {
      toast.error(rEmail.erro || 'Email inválido.');
      return;
    }

    setSalvando(true);
    try {
      await atualizarHospital({
        nome: nome.trim(),
        nuit: nuit.trim() || null,
        endereco: endereco.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
      });
      toast.success('Informações do hospital actualizadas com sucesso.');
    } catch {
      toast.error('Erro ao actualizar definições.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExportarBackup = () => {
    const payload = JSON.stringify(
      {
        hospital,
        exportado_em: new Date().toISOString(),
        dados,
      },
      null,
      2,
    );
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(payload);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_hospital_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Backup JSON exportado com sucesso.');
  };

  const handleSincronizarBaseDados = async () => {
    await recarregarDados();
    toast.success('Dados sincronizados com a base de dados.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Definições da Instituição</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Identificação da unidade hospitalar, persistência de dados e arquitectura do sistema.
        </p>
      </div>

      {/* Formulário de Identidade */}
      <Card className="border-slate-200 shadow-xs">
        <form onSubmit={handleSalvar}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />
              <CardTitle className="text-base font-bold text-slate-900">Dados da Unidade Hospitalar</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Estes dados são emitidos nos cabeçalhos de receitas médicas, relatórios executivos e recibos oficiais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="inst_nome" className="text-xs font-medium text-slate-700">
                  Nome da Instituição Hospitalar / Clínica *
                </Label>
                <Input
                  id="inst_nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={!isAdmin}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inst_nuit" className="text-xs font-medium text-slate-700">
                  NUIT da Instituição (9 dígitos)
                </Label>
                <Input
                  id="inst_nuit"
                  maxLength={9}
                  value={nuit}
                  onChange={(e) => setNuit(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Ex: 400123456"
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inst_tel" className="text-xs font-medium text-slate-700">
                  Telefone Principal
                </Label>
                <Input
                  id="inst_tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="+258 21 000 000"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inst_email" className="text-xs font-medium text-slate-700">
                  E-mail Oficial
                </Label>
                <Input
                  id="inst_email"
                  type="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="contacto@hospital.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inst_moeda" className="text-xs font-medium text-slate-700">
                  Moeda Oficial do Sistema
                </Label>
                <Input
                  id="inst_moeda"
                  value="Metical de Moçambique (MT)"
                  disabled
                  className="h-9 bg-[#F8FAFC] text-slate-600 font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="inst_end" className="text-xs font-medium text-slate-700">
                  Endereço Físico Completo
                </Label>
                <Input
                  id="inst_end"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Av. Julius Nyerere, N.º 1240, Maputo, Moçambique"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
          {isAdmin && (
            <CardFooter className="border-t border-slate-100 bg-[#F8FAFC] flex justify-end py-3">
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold gap-2"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                {salvando ? 'A guardar…' : 'Guardar Alterações'}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Persistência de Base de Dados & Arquitectura MVC */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0284C7]" aria-hidden="true" />
            <CardTitle className="text-base font-bold text-slate-900">
              Ligação à Base de Dados & Persistência
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Estado da conexão relacional e estrutura modular do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-slate-200 gap-3">
            <div>
              <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                Motor de Persistência ({modo === 'supabase' ? 'PostgreSQL / Supabase Cloud' : 'Persistência Local'})
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Conectado
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Todos os registos criados, editados ou eliminados persistem após actualizar a página ou reiniciar a aplicação.
              </p>
            </div>
          </div>

          {/* Identificação das Camadas MVC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                Model (Dados & Regras)
              </div>
              <p className="text-xs font-mono text-slate-700 mt-1">src/models/</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Entidades do domínio (`index.ts`), conexão e persistência SQL (`DatabaseModel.ts`) e validadores de integridade (`ValidadoresModel.ts`).
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                View (Interface Visual)
              </div>
              <p className="text-xs font-mono text-slate-700 mt-1">src/views/ & src/pages/</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Componentes de apresentação de pacientes, consultas, consultório, farmácia, caixa, relatórios e auditoria.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                Controller (Controlo)
              </div>
              <p className="text-xs font-mono text-slate-700 mt-1">src/controllers/</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Controlador de autenticação e permissões RBAC (`AuthController.ts`) e controlador de operações CRUD (`DadosController.ts`).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSincronizarBaseDados}
              className="gap-2 border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF] text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
              Sincronizar Dados Agora
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportarBackup}
              className="gap-2 border-slate-300 text-slate-700 hover:text-[#0284C7] hover:bg-[#F0F9FF] text-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
              Exportar Backup JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
