import React, { useState } from 'react';
import { useDados } from '@/context/DadosContext';
import { useIndices } from '@/context/DadosContext';
import { useAuth } from '@/context/AuthContext';
import { formatarDataHora } from '@/lib/utils';
import type { Consulta, Medicamento } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, Activity, FileText, Pill, Plus, 
  Trash2, CheckCircle2, Printer, X, AlertTriangle 
} from 'lucide-react';

interface ItemPrescricaoRascunho {
  medicamentoId: string | null;
  medicamentoNome: string;
  posologia: string;
  quantidade: number;
  duracao: string;
}

export function Atendimento() {
  const { dados, criar, editar } = useDados();
  const indices = useIndices();
  const { sessao } = useAuth();
  const perfil = sessao?.perfil;
  const hospital = sessao?.hospital;

  // Consultas aptas para atendimento (Em espera ou Em atendimento)
  const consultasAptas = dados.consultas.filter(
    (c) => c.estado === 'SALA_ESPERA' || c.estado === 'EM_ATENDIMENTO',
  );

  const [consultaSel, setConsultaSel] = useState<Consulta | null>(consultasAptas[0] || null);

  // Form State Atendimento
  const [pressaoArterial, setPressaoArterial] = useState('120/80');
  const [temperatura, setTemperatura] = useState<number | ''>(36.5);
  const [peso, setPeso] = useState<number | ''>(68);
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState<number | ''>(72);
  const [sintomas, setSintomas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [conduta, setConduta] = useState('');
  const [orientacoes, setOrientacoes] = useState('Repouso e ingestão de líquidos.');

  // Prescrição de Medicamentos
  const [itens, setItens] = useState<ItemPrescricaoRascunho[]>([]);
  const medicamentosDisponiveis = dados.medicamentos.filter((m) => m.activo);
  const [medSelId, setMedSelId] = useState(medicamentosDisponiveis[0]?.id || '');
  const [posologia, setPosologia] = useState('1 comprimido de 8 em 8 horas');
  const [quantidade, setQuantidade] = useState(1);
  const [duracao, setDuracao] = useState('7 dias');

  // Modal de Impressão de Receita Concluída
  const [receitaImpressao, setReceitaImpressao] = useState<{
    pacienteNome: string;
    medicoNome: string;
    diagnostico: string;
    data: string;
    itens: ItemPrescricaoRascunho[];
    orientacoes: string;
  } | null>(null);

  const handleAdicionarItem = () => {
    const med = indices.medicamento.get(medSelId);
    if (!med) return;

    if (quantidade <= 0) {
      alert('A quantidade prescrita deve ser no mínimo 1.');
      return;
    }

    if (quantidade > med.stock) {
      alert(`Atenção: A quantidade prescrita (${quantidade}) é superior ao estoque disponível (${med.stock}).`);
    }

    setItens((prev) => [
      ...prev,
      {
        medicamentoId: med.id,
        medicamentoNome: `${med.nome} (${med.principio_activo} ${med.dosagem})`,
        posologia,
        quantidade: Number(quantidade),
        duracao,
      },
    ]);
  };

  const handleRemoverItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConcluirAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaSel) {
      alert('Selecione uma consulta na fila de espera.');
      return;
    }

    if (!sintomas.trim() || !diagnostico.trim()) {
      alert('Sintomas e Diagnóstico Clínico são de preenchimento obrigatório.');
      return;
    }

    const pac = indices.paciente.get(consultaSel.paciente_id);
    const med = indices.medico.get(consultaSel.medico_id);

    // 1. Criar o atendimento no prontuário
    const novoAtend = await criar(
      'atendimentos',
      {
        consulta_id: consultaSel.id,
        paciente_id: consultaSel.paciente_id,
        medico_id: consultaSel.medico_id,
        pressao_arterial: pressaoArterial || null,
        temperatura: temperatura === '' ? null : Number(temperatura),
        peso: peso === '' ? null : Number(peso),
        frequencia_cardiaca: frequenciaCardiaca === '' ? null : Number(frequenciaCardiaca),
        sintomas,
        diagnostico,
        conduta: conduta || null,
        orientacoes: orientacoes || null,
      },
      `Registo de atendimento médico para ${pac?.nome}. Diagnóstico: ${diagnostico}`,
    );

    // 2. Gravar os itens de prescrição e BAIXAR O ESTOQUE da farmácia!
    for (const it of itens) {
      await criar('prescricao_itens', {
        atendimento_id: novoAtend.id,
        medicamento_id: it.medicamentoId,
        medicamento_nome: it.medicamentoNome,
        posologia: it.posologia,
        quantidade: it.quantidade,
        duracao: it.duracao,
      });

      // Baixa no estoque real do medicamento
      if (it.medicamentoId) {
        const medAtual = indices.medicamento.get(it.medicamentoId);
        if (medAtual) {
          const novoStock = Math.max(0, medAtual.stock - it.quantidade);
          await editar(
            'medicamentos',
            medAtual.id,
            { stock: novoStock },
            `Baixa de estoque por prescrição médica (${it.quantidade} un. de ${medAtual.nome})`,
          );
        }
      }
    }

    // 3. Atualizar consulta para CONCLUIDA
    await editar('consultas', consultaSel.id, { estado: 'CONCLUIDA' }, `Consulta concluída para ${pac?.nome}`);

    // 4. Preparar visualização/impressão da receita médica
    setReceitaImpressao({
      pacienteNome: pac?.nome || 'Utente',
      medicoNome: med?.nome || perfil?.nome || 'Médico',
      diagnostico,
      data: new Date().toISOString(),
      itens,
      orientacoes,
    });

    // Reset formulário
    setSintomas('');
    setDiagnostico('');
    setConduta('');
    setItens([]);
    setConsultaSel(null);
  };

  const pacienteAtual = consultaSel ? indices.paciente.get(consultaSel.paciente_id) : null;
  const medicoAtual = consultaSel ? indices.medico.get(consultaSel.medico_id) : null;

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consultório & Prontuário Médico</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Módulo Clínico Ativo
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Atendimento clínico, registo de anamnese, sinais vitais e emissão de receita com dedução de estoque na farmácia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fila de Pacientes no Consultório */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-fit">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Fila do Consultório</h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {consultasAptas.length} utente(s)
            </span>
          </div>
          
          <div className="space-y-2.5">
            {consultasAptas.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                <p className="font-bold text-slate-800">Sem utentes em espera</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Faça o check-in na recepção ou agenda.</p>
              </div>
            ) : (
              consultasAptas.map((c) => {
                const pac = indices.paciente.get(c.paciente_id);
                const isSel = consultaSel?.id === c.id;
                const isEmergencia = c.prioridade === 'URGENTE';
                return (
                  <button
                    key={c.id}
                    onClick={async () => {
                      setConsultaSel(c);
                      if (c.estado === 'SALA_ESPERA') {
                        await editar('consultas', c.id, { estado: 'EM_ATENDIMENTO' });
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                      isSel 
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-xs' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start font-semibold">
                      <span className="text-slate-900 text-sm font-semibold">{pac?.nome || 'Utente'}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        isEmergencia
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {c.prioridade}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 font-mono font-medium mt-1">
                      Processo: {pac?.numero_processo}
                    </p>
                    {c.motivo && (
                      <p className="text-xs text-slate-500 italic mt-0.5 font-normal">"{c.motivo}"</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Ficha Clínica de Atendimento */}
        <div className="lg:col-span-2 space-y-4">
          {consultaSel && pacienteAtual ? (
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {pacienteAtual.nome}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Processo: {pacienteAtual.numero_processo} • Grupo: {pacienteAtual.grupo_sanguineo || 'N/A'} • Alergias: {pacienteAtual.alergias || 'Nenhuma relatada'}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="text-xs font-semibold">
                    Em Atendimento
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <form onSubmit={handleConcluirAtendimento} className="space-y-4">
                  
                  {/* Sinais Vitais */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      1. Sinais Vitais
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Pressão Arterial</Label>
                        <Input
                          value={pressaoArterial}
                          onChange={(e) => setPressaoArterial(e.target.value)}
                          placeholder="120/80 mmHg"
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Temperatura (ºC)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={temperatura}
                          onChange={(e) => setTemperatura(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="36.5"
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Pulso (bpm)</Label>
                        <Input
                          type="number"
                          value={frequenciaCardiaca}
                          onChange={(e) => setFrequenciaCardiaca(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="72"
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Peso (kg)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="70"
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Anamnese e Diagnóstico */}
                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      2. Anamnese & Avaliação Médica
                    </h3>
                    <div className="space-y-1">
                      <Label className="text-xs">História da Doença Atual & Queixas *</Label>
                      <Textarea
                        rows={3}
                        required
                        value={sintomas}
                        onChange={(e) => setSintomas(e.target.value)}
                        placeholder="Descreva a sintomatologia e evolução do paciente..."
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Diagnóstico Clínico (CID) *</Label>
                      <Input
                        required
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                        placeholder="Ex: I10 - Hipertensão Essencial / J00 - Rinofaringite Aguda"
                        className="text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Conduta Clínica / Notas Médicas</Label>
                      <Input
                        value={conduta}
                        onChange={(e) => setConduta(e.target.value)}
                        placeholder="Ex: Solicitação de exames complementares, alta com medicação..."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Prescrição Médica Integrada com Estoque */}
                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-primary" />
                      3. Prescrição Eletrónica (Baixa no Estoque)
                    </h3>

                    <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Medicamento da Farmácia</Label>
                          <Select value={medSelId} onValueChange={setMedSelId}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Selecione o fármaco" />
                            </SelectTrigger>
                            <SelectContent>
                              {medicamentosDisponiveis.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.nome} — {m.dosagem} ({m.stock} un. em estoque)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Posologia</Label>
                          <Input
                            value={posologia}
                            onChange={(e) => setPosologia(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Quantidade (Unidades)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={quantidade}
                            onChange={(e) => setQuantidade(Number(e.target.value))}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duração do Tratamento</Label>
                          <Input
                            value={duracao}
                            onChange={(e) => setDuracao(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAdicionarItem}
                          className="text-xs font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Adicionar à Receita
                        </Button>
                      </div>
                    </div>

                    {/* Lista de Itens na Receita */}
                    {itens.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {itens.map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border bg-card flex justify-between items-center text-xs"
                          >
                            <div>
                              <strong className="text-foreground">{it.medicamentoNome}</strong>
                              <span className="text-muted-foreground ml-2">
                                ({it.quantidade} un. • {it.posologia} • {it.duracao})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => handleRemoverItem(idx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">Recomendações e Orientações ao Utente</Label>
                      <Input
                        value={orientacoes}
                        onChange={(e) => setOrientacoes(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Ações Finais */}
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConsultaSel(null)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium"
                    >
                      Pausar Atendimento
                    </Button>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Concluir Prontuário & Emitir Receita
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground text-xs space-y-2">
                <Stethoscope className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="font-semibold text-foreground text-sm">Nenhum Paciente em Consulta</p>
                <p className="max-w-xs mx-auto text-muted-foreground">
                  Selecione um paciente na lista da fila de espera à esquerda para abrir a ficha clínica de atendimento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>

      {/* Modal de Impressão Oficial da Receita Médica */}
      <Dialog open={!!receitaImpressao} onOpenChange={(open) => !open && setReceitaImpressao(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="no-print">
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Receita Médica Emitida</span>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="text-xs font-semibold h-8"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Imprimir Receita
              </Button>
            </DialogTitle>
          </DialogHeader>

          {receitaImpressao && (
            <div className="p-6 print-area font-sans text-foreground space-y-4">
              <div className="text-center pb-3 border-b-2">
                <h2 className="text-lg font-black uppercase tracking-tight">{hospital?.nome || 'HOSPITAL'}</h2>
                <p className="text-[11px] text-muted-foreground">Serviço de Atendimento Clínico & Prescrição</p>
                {hospital?.nuit && <p className="text-[10px] text-muted-foreground font-mono">NUIT: {hospital.nuit}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded border">
                <div>
                  <span className="text-muted-foreground">Paciente:</span>
                  <p className="font-bold">{receitaImpressao.pacienteNome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Médico Prescritor:</span>
                  <p className="font-bold">{receitaImpressao.medicoNome}</p>
                </div>
                <div className="col-span-2 pt-1 border-t">
                  <span className="text-muted-foreground">Diagnóstico Clínico:</span>
                  <p className="font-semibold">{receitaImpressao.diagnostico}</p>
                </div>
              </div>

              <div className="space-y-2 py-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1">
                  Medicamentos Prescritos
                </h3>
                {receitaImpressao.itens.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum medicamento formulado.</p>
                ) : (
                  <ol className="list-decimal list-inside space-y-2 text-xs">
                    {receitaImpressao.itens.map((it, i) => (
                      <li key={i} className="pl-1">
                        <strong>{it.medicamentoNome}</strong> — Quantidade: {it.quantidade} un.
                        <div className="text-[11px] text-muted-foreground pl-4">
                          Posologia: {it.posologia} ({it.duracao})
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {receitaImpressao.orientacoes && (
                <div className="p-2.5 bg-muted/30 rounded border text-xs">
                  <strong>Recomendações ao Utente:</strong>
                  <p className="text-muted-foreground mt-0.5">{receitaImpressao.orientacoes}</p>
                </div>
              )}

              <div className="pt-8 flex justify-between items-end text-xs text-muted-foreground">
                <span className="text-[10px]">Data: {new Date(receitaImpressao.data).toLocaleDateString('pt-PT')}</span>
                <div className="text-center w-48 border-t pt-1">
                  <p className="font-semibold text-foreground">{receitaImpressao.medicoNome}</p>
                  <p className="text-[10px]">Assinatura & Carimbo Médico</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
