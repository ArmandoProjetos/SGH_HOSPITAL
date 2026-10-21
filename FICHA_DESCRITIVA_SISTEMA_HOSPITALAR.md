# FICHA DESCRITIVA DO SISTEMA
# SGH — SISTEMA INTEGRADO DE GESTÃO HOSPITALAR & CLÍNICA (HIS / ERP)
**Solução Corporativa Multi-Tenant para Unidades Hospitalares, Centros Clínicos e Policlínicas**

---

## 1. IDENTIFICAÇÃO E VISÃO GERAL DO PRODUTO

- **Denominação da Solução:** SGH — Sistema de Gestão Hospitalar & Clínica (Hospital Information System / Healthcare ERP)
- **Natureza da Solução:** Plataforma Web Integrada Multi-Tenant (SaaS Empresarial)
- **Público-Alvo:** Hospitais Gerais, Centros Médicos Privados, Policlínicas, Redes de Clínicas e Unidades Especializadas
- **Setor de Atividade:** Tecnologia da Informação Aplicada à Saúde (HealthTech / Gestão Hospitalar)
- **Modelo de Operação:** Cada entidade hospitalar regista-se na plataforma e obtém o seu próprio **Workspace Hospitalar Isolado**, gerido pelo seu Diretor Clínico/Executivo, com gestão independente de equipa, pacientes, prontuários, farmácia, tesouraria e aquisições.

---

## 2. A IDEIA CENTRAL E CONTEXTO DE MERCADO

### 2.1. O Desafio no Setor Hospitalar
A gestão hospitalar contemporânea engloba uma multiplicidade de operações interconectadas que não podem depender de processos manuais ou de softwares desarticulados:
- O atendimento na recepção e o acolhimento de pacientes;
- A triagem de urgência e a marcação de consultas;
- A organização da escala e do corpo médico;
- A elaboração segura e confidencial do prontuário médico eletrónico;
- O controlo rigoroso do stock e validade de medicamentos na farmácia hospitalar;
- O fluxo de requisições de compra, insumos clínicos e equipamentos com aprovação orçamental da Direção;
- A faturação transparente com múltiplos meios de pagamento (Dinheiro, Cartão/POS, M-Pesa, e-Mola) e fecho de caixa;
- A extração de inteligência e relatórios estratégicos para tomada de decisão pela administração.

A ausência de integração causa perdas financeiras, extravio de fichas clínicas, atrasos no atendimento ao utente, ruturas involuntárias de stock e ausência de trilha de auditoria.

### 2.2. A Proposta de Valor do SGH
O **SGH** soluciona estes desafios ao disponibilizar uma arquitetura moderna baseada em **Workspaces Hospitalares**:
1. **Portal Público Institucional de Apresentação:** Uma página corporativa com estética limpa, profissional e elegante, permitindo que utentes consultem especialidades e médicos, e que hospitais e clínicas acedam diretamente ao seu workspace de gestão através de autenticação segura.
2. **Ambiente de Gestão Centralizado (Workspace):** O Diretor do Hospital detém controlo total e centralizado das operações, métricas de produtividade, finanças globais e tem competência exclusiva para autorizar compras e aquisições.
3. **Interfaces Adaptadas por Cargo:** Cada colaborador (Médicos, Farmacêuticos, Recepcionistas) acede apenas às ferramentas correspondentes à sua função, com menus, métricas e ações operacionais personalizadas.
4. **Ciclo de Suprimentos & Aquisições Integrado:** Pedidos de reposição farmacêutica ou equipamentos feitos pelo staff são submetidos à Direção para despacho (Aprovação/Rejeição); uma vez recebidos, o stock é atualizado de forma 100% automatizada.

---

## 3. ARQUITETURA DE WORKSPACES E TIPOS DE UTILIZADORES

No ecossistema do SGH, cada hospital opera dentro de um limite de dados seguro (`hospital_id`). A hierarquia de perfis divide-se em 4 papéis essenciais:

```
                           ┌─────────────────────────────────────────┐
                           │      DIREÇÃO DO HOSPITAL (ADMIN)        │
                           │  - Painel 360º Executivo                │
                           │  - Despacho de Requisições/Aquisições   │
                           │  - Gestão de Equipa e Credenciais       │
                           │  - Auditoria & Relatórios Globais       │
                           └────────────────────┬────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌─────────────────────────┐            ┌─────────────────────────┐            ┌─────────────────────────┐
│  MÉDICO / CORPO CLÍNICO │            │ FARMACÊUTICO / STOCK    │            │ RECEPCIONISTA & CAIXA   │
│ - Fila do Consultório   │            │ - Controlo de Fármacos  │            │ - Admissão de Pacientes │
│ - Prontuário Eletrónico │            │ - Gestão de Validades   │            │ - Marcação & Triagem    │
│ - Prescrição Oficial    │            │ - Requisições Reposição │            │ - Faturação & Recibos   │
│ - Requisição Insumos    │            │ - Confirmação Entrada   │            │ - Chamada p/ Espera     │
└─────────────────────────┘            └─────────────────────────┘            └─────────────────────────┘
```

### 3.1. Direção / Administrador Hospitalar (`ADMINISTRADOR`)
- **Papel:** Diretor Geral, Diretor Clínico ou Administrador Hospitalar.
- **Painel:** Visão executiva 360º com total de pacientes, receita diária acumulada, taxa de ocupação, alertas de medicamentos em rutura e pedidos de compra pendentes.
- **Competências Exclusivas:**
  - Despacho e assinatura digital de **Requisições & Aquisições** (Aprovação ou Rejeição com notas formais de parecer).
  - Criação de credenciais de acesso para médicos, farmacêuticos e recepcionistas.
  - Acesso à trilha de **Auditoria & Segurança** com registo imutável de todas as ações no sistema.
  - Extração de **Relatórios Gerenciais** de faturação, produtividade médica e fluxo de atendimento.
  - Configuração de especialidades médicas, tabelas de preços e dados corporativos (N.U.I.T., contactos, morada).

### 3.2. Médico / Corpo Clínico (`MEDICO`)
- **Papel:** Médicos Especialistas e Médicos de Clínica Geral.
- **Painel:** Fila de espera diária com classificação de risco (Normal, Prioritário, Urgente), histórico do paciente e atendimentos em curso.
- **Módulos Principais:**
  - **Consultório Eletrónico:** Registo de anamnese, exame físico e sinais vitais (Pressão Arterial, Frequência Cardíaca, Temperatura, Peso).
  - **Diagnóstico & Conduta:** Classificação nosológica (CID) e plano terapêutico.
  - **Prescrição Médica Oficial:** Seleção de fármacos do catálogo com posologia detalhada e emissão de receita formatada para impressão.
  - **Requisições Clínicas:** Solicitação formal à Direção para aquisição de novos aparelhos diagnósticos ou insumos para o consultório.

### 3.3. Farmacêutico / Gestor de Stock (`FARMACEUTICO`)
- **Papel:** Responsável pela Farmácia Hospitalar e Almoxarifado Clínico.
- **Painel:** Painel de monitorização de stock em tempo real, contagem de itens em nível crítico (`stock <= stock_minimo`) e receitas hospitalares atendidas.
- **Módulos Principais:**
  - **Catálogo de Medicamentos:** Cadastro de substâncias ativas, formas farmacêuticas (comprimidos, ampolas, suspensões), dosagens e níveis de segurança.
  - **Requisições de Reposição:** Elaboração de pedidos formais de aquisição de fármacos com justificativa de consumo e estimativa orçamental.
  - **Recepção e Alimentação de Stock:** Ao receber os lotes aprovados pela Direção, a confirmação na interface atualiza imediatamente o inventário físico sem necessidade de inserção manual duplicada.

### 3.4. Recepcionista & Operador de Caixa (`RECEPCIONISTA`)
- **Papel:** Balcão de Atendimento, Triagem Inicial e Tesouraria.
- **Painel:** Indicadores de fluxo do dia, pacientes em espera, consultas agendadas e total arrecadado no turno.
- **Módulos Principais:**
  - **Cadastro de Pacientes:** Abertura e manutenção do Processo Clínico Único (`P2026-XXXXX`), dados biográficos, contactos e alergias conhecidas.
  - **Marcação e Gestão de Consultas:** Agendamento conforme a disponibilidade médica e especialidade, com cancelamento justificado ou check-in na recepção.
  - **Caixa & Pagamentos:** Registo do pagamento da consulta ou procedimentos com suporte a Dinheiro, Cartão (POS), M-Pesa, e-Mola e Transferência Bancária, com emissão de Recibo Oficial numerado para impressão.
  - **Requisições de Expediente:** Pedidos de material de receção e consumíveis de balcão encaminhados ao Diretor.

---

## 4. MÓDULOS FUNCIONAIS INTEGRADOS DO WORKSPACE

| Módulo | Código | Descrição Funcional |
| :--- | :--- | :--- |
| **Painel de Controlo Adaptativo** | `MOD-01` | Dashboard dinâmico que reorganiza cartões de KPI, listas de tarefas e atalhos rápidos de acordo com o perfil do utilizador autenticado. |
| **Registo & Gestão de Pacientes** | `MOD-02` | Prontuário biográfico completo, geração automática de número de processo, histórico clínico longitudinal, alergias e observações de saúde. |
| **Marcação & Fila de Consultas** | `MOD-03` | Escala médica, marcação antecipada, controlo de fluxo de presença (`Agendada` -> `Sala de Espera` -> `Em Atendimento` -> `Concluída`), triagem com níveis de prioridade. |
| **Atendimento Clínico & Prontuário** | `MOD-04` | Registo de anamnese, aferição de parâmetros vitais, hipóteses diagnósticas e emissão de prescrição médica estruturada. |
| **Farmácia & Inventário Hospitalar** | `MOD-05` | Catálogo de medicamentos, gestão de formas farmacêuticas, níveis mínimos de alarme e integração direta com prescrições e requisições. |
| **Requisições & Aquisições Internas** | `MOD-06` | Fluxo de suprimentos com submissão de pedidos por funcionários, despacho pela Direção Geral e reposição automática de stock. |
| **Caixa, Faturação & Pagamentos** | `MOD-07` | Cobrança com recibo oficial emitido em nome do paciente, controlo por modalidades financeiras moçambicanas e internacionais. |
| **Relatórios Executivos & Estatísticas**| `MOD-08` | Métricas de faturação, volume de atendimentos por especialidade, produtividade médica e análise de conformidade operacional. |
| **Equipa, Cargos & Credenciais** | `MOD-09` | Registo de novos funcionários no hospital, emissão de credenciais com permissões RBAC estritas e simulação de interfaces para a administração. |
| **Auditoria, Segurança & Logs** | `MOD-10` | Registo detalhado e auditável de eventos com data, hora, utilizador, módulo afetado e descrição técnica da transação. |
| **Definições & Configuração da Unidade**| `MOD-11` | Configuração dos dados cadastrais do hospital (Nome, NUIT, Endereço, Telefones) e catálogo de especialidades com tabela de preços. |

---

## 5. FLUXO OPERACIONAL DE REQUISIÇÕES & AQUISIÇÕES (BPMN / WORKFLOW)

Um dos diferenciais cruciais do SGH é a eliminação de formulários em papel para pedidos de material e fármacos:

1. **Submissão:** O Farmacêutico (ou Médico/Recepcionista) constata necessidade de reposição ou compra. Acede a **Requisições & Aquisições** e cria uma requisição formal (`REQ-2026-XXXXX`), indicando o tipo, o item, quantidade, urgência e custo estimado.
2. **Notificação da Direção:** O Diretor visualiza um badge em destaque na barra de navegação e um cartão de alerta de despesas pendentes no seu dashboard.
3. **Despacho:** O Diretor analisa o pedido, o custo e a justificativa, e emite o parecer oficial:
   - **Aprovada:** Autoriza a compra/desembolso financeiro pelo departamento administrativo.
   - **Rejeitada:** Regista o motivo da recusa para ciência do colaborador.
4. **Liquidação e Entrada de Stock:** Com a entrega dos bens pelo fornecedor, o Farmacêutico clica em **Confirmar Receção**, e o sistema credita as quantidades diretamente no saldo do medicamento correspondente, gerando uma entrada na auditoria geral.

---

## 6. ESPECIFICAÇÕES TÉCNICAS, PADRÃO MVC E PILHA DE DESENVOLVIMENTO

- **Padrão Arquitectural MVC (Model – View – Controller):**
  - **Model (`src/models/`):** Definição das entidades de domínio (`src/models/index.ts`), regras de validação, unicidade e integridade relacional (`src/models/ValidadoresModel.ts`) e motor de persistência SQL/Supabase (`src/models/DatabaseModel.ts`).
  - **View (`src/views/` e `src/pages/`):** Interfaces visuais modulares organizadas por área clínica e administrativa (`src/views/index.ts`), desenhadas na paleta institucional Azul Clínico (`#0284C7`) e Branco (`#FFFFFF`).
  - **Controller (`src/controllers/`):** Controlador de Autenticação e Permissões RBAC (`src/controllers/AuthController.ts`) e Controlador de Operações CRUD e Auditoria (`src/controllers/DadosController.ts`).
- **Frontend & Interface de Utilizador:**
  - React 19 com TypeScript rigoroso;
  - Vite para compilação ultrarrápida;
  - Tailwind CSS para design system corporativo limpo, responsivo e sem excessos visuais;
  - Componentes Shadcn UI / Radix Primitives para máxima acessibilidade;
  - Lucide React para iconografia médica padronizada.
- **Backend & Base de Dados:**
  - PostgreSQL / Supabase na nuvem (`supabase/schema.sql`);
  - Autenticação Segura com encriptação de palavras-passe (`auth.users`);
  - Row Level Security (RLS) para isolamento estrito de dados entre utilizadores e organizações;
  - Triggers em PL/pgSQL para auditoria contínua e provisionamento automatizado de novos workspaces;
  - Camada de compatibilidade com motor resiliente em armazenamento local para contingência operacional ininterrupta.
- **Segurança da Informação:**
  - Conformidade com padrões de confidencialidade médica;
  - Criptografia em trânsito (HTTPS / TLS 1.3);
  - Trilha imutável de auditoria clínica e financeira;
  - Separação lógica total por `hospital_id`.

---

## 7. MATRIZ DE RASTREABILIDADE DE REQUISITOS ATENDIDOS

| Requisito do Setor de Saúde | Como o SGH Atende |
| :--- | :--- |
| **Registo e gestão de pacientes** | Módulo de Pacientes com processo clínico único, pesquisa rápida, alergias, dados demográficos e histórico completo. |
| **Cadastro de médicos e equipa** | Módulo de Equipa & Acessos, permitindo registar médicos com Nº da Ordem (OMM), consultório, especialidade e utilizadores por papel. |
| **Marcação, alteração e cancelamento de consultas** | Módulo de Consultas com agenda médica, alteração de estado (Espera, Atendimento, Concluída) e cancelamento fundamentado. |
| **Consulta e atualização do histórico clínico** | Prontuário eletrónico longitudinal acessível em tempo real pelo médico durante o atendimento. |
| **Diagnósticos, prescrições e medicamentos** | Módulo de Atendimento com diagnóstico CID, registo de sinais vitais e gerador de receitas impressas com baixa de inventário. |
| **Controlo de pagamentos e faturação** | Módulo de Pagamentos com emissão de recibo oficial, múltiplos métodos (M-Pesa, e-Mola, Cartão, Dinheiro) e fecho financeiro. |
| **Relatórios administrativos e executivos** | Módulo de Relatórios com gráficos de receitas, volumetria por especialidade, despesas e desempenho do corpo clínico. |
| **Níveis de acesso diferenciados (RBAC)** | 4 perfis implementados (Diretor, Médico, Farmacêutico, Recepcionista) com acessos e interfaces restritas. |
| **Segurança e organização das informações** | Armazenamento relacional estruturado no Supabase/PostgreSQL com auditoria, sem dispersão de papel. |

---

*Ficha Técnica e Descritiva Oficial aprovada para distribuição e implantação no mercado hospitalar.*
