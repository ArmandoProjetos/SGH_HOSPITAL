import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} from 'docx';

const PRIMARY_COLOR = '0F172A'; // Slate 900
const ACCENT_COLOR = '0284C7';  // Sky 600
const MUTED_COLOR = '475569';   // Slate 600
const LIGHT_BG = 'F8FAFC';      // Slate 50
const BORDER_COLOR = 'CBD5E1';  // Slate 300

function createHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: '0F172A', type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            color: 'FFFFFF',
            font: 'Calibri',
            size: 20
          })
        ]
      })
    ]
  });
}

function createDataCell(text, widthPercent, isMuted = false, isBold = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: isBold,
            color: isMuted ? MUTED_COLOR : '1E293B',
            font: 'Calibri',
            size: 19
          })
        ]
      })
    ]
  });
}

function makeSectionTitle(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: 'Calibri',
        size: 28,
        color: PRIMARY_COLOR
      })
    ]
  });
}

function makeSubsectionTitle(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: 'Calibri',
        size: 23,
        color: ACCENT_COLOR
      })
    ]
  });
}

function makeBodyParagraph(text, isBold = false) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    children: [
      new TextRun({
        text,
        bold: isBold,
        font: 'Calibri',
        size: 21,
        color: '1E293B'
      })
    ]
  });
}

function makeBulletPoint(lead, text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children: [
      new TextRun({
        text: lead + ' ',
        bold: true,
        font: 'Calibri',
        size: 20,
        color: '0F172A'
      }),
      new TextRun({
        text,
        font: 'Calibri',
        size: 20,
        color: '334155'
      })
    ]
  });
}

function makeCalloutBox(title, description) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT_COLOR },
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    font: 'Calibri',
                    size: 21,
                    color: ACCENT_COLOR
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: description,
                    font: 'Calibri',
                    size: 20,
                    color: '334155'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

async function generateDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'SGH — Sistema de Gestão Hospitalar & Clínica (HIS / ERP) | Ficha Descritiva Oficial',
                    font: 'Calibri',
                    size: 16,
                    color: MUTED_COLOR
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Página ',
                    font: 'Calibri',
                    size: 18,
                    color: MUTED_COLOR
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Calibri',
                    size: 18,
                    color: MUTED_COLOR
                  }),
                  new TextRun({
                    text: ' de ',
                    font: 'Calibri',
                    size: 18,
                    color: MUTED_COLOR
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Calibri',
                    size: 18,
                    color: MUTED_COLOR
                  })
                ]
              })
            ]
          })
        },
        children: [
          // CAPA / TÍTULO PRINCIPAL
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: 'SISTEMA INTEGRADO DE GESTÃO HOSPITALAR',
                bold: true,
                font: 'Calibri',
                size: 36,
                color: PRIMARY_COLOR
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({
                text: 'SGH — Hospital Information System & Healthcare ERP',
                bold: true,
                font: 'Calibri',
                size: 26,
                color: ACCENT_COLOR
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 0, after: 280 },
            children: [
              new TextRun({
                text: 'Ficha Técnica & Descritiva Oficial do Sistema para o Mercado de Saúde',
                italics: true,
                font: 'Calibri',
                size: 22,
                color: MUTED_COLOR
              })
            ]
          }),

          makeCalloutBox(
            'Visão Executiva da Solução',
            'O SGH é uma plataforma corporativa multi-tenant em nuvem concebida para modernizar, unificar e otimizar a totalidade das operações clínicas e administrativas de unidades hospitalares, centros de diagnóstico e policlínicas. Cada hospital dispõe de um Workspace próprio onde o Diretor centraliza os dados, credencia a equipa e despacha requisições, enquanto médicos, farmacêuticos e recepcionistas trabalham em interfaces especializadas de alto desempenho.'
          ),

          // SEÇÃO 1
          makeSectionTitle('1. Identificação do Produto & Modelo de Operação'),
          makeBulletPoint('• Denominação Comercial:', 'SGH — Sistema Integrado de Gestão Hospitalar & Clínica'),
          makeBulletPoint('• Arquitetura Operacional:', 'SaaS Corporativo Multi-Tenant em Nuvem com isolamento rigoroso por Hospital (hospital_id).'),
          makeBulletPoint('• Segmento Alvo:', 'Hospitais Gerais, Centros Médicos Privados, Policlínicas Especializadas e Redes de Saúde.'),
          makeBulletPoint('• Idioma e Moeda:', 'Totalmente localizado em Português com suporte nativo a Meticais (MZN) e múltiplos métodos de pagamento (Dinheiro, Cartão/POS, M-Pesa, e-Mola).'),

          // SEÇÃO 2
          makeSectionTitle('2. Ideia Central e Objetivos de Negócio'),
          makeBodyParagraph('A gestão hospitalar moderna envolve processos críticos e interdependentes: cadastro de utentes, triagem médica, agendamentos, emissão de prontuários eletrónicos, controlo de stock farmacêutico, requisições internas de abastecimento e liquidação financeira.'),
          makeBodyParagraph('O objetivo primordial do SGH é substituir registos dispersos em papel e softwares desconectados por uma infraestrutura integrada em nuvem que proporciona:'),
          makeBulletPoint('1. Zero Dispersão de Dados:', 'Prontuário clínico unificado que acompanha o paciente em todas as suas consultas e internamentos.'),
          makeBulletPoint('2. Despacho & Controlo de Gastos:', 'Fluxo formal de Requisições & Aquisições onde pedidos de medicamentos ou equipamentos feitos pelos funcionários só avançam com a aprovação explícita da Direção do Hospital.'),
          makeBulletPoint('3. Segurança e Auditoria:', 'Rastreabilidade total através de logs de auditoria imutáveis com carimbo de tempo para qualquer ação clínica ou financeira.'),
          makeBulletPoint('4. Interfaces Adaptativas:', 'Cada colaborador opera num ambiente despoluído com as ferramentas estritamente necessárias para a sua função diária.'),

          // SEÇÃO 3
          makeSectionTitle('3. Estrutura de Perfis & Permissões no Workspace'),
          makeBodyParagraph('Cada Workspace Hospitalar organiza a equipa médica e administrativa em 4 perfis fundamentais com controlo de acesso baseado em funções (RBAC):'),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR }
            },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Perfil', 22),
                  createHeaderCell('Responsabilidades Principais', 38),
                  createHeaderCell('Módulos & Interfaces Exclusivas', 40)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Diretor Geral / Administrador', 22, false, true),
                  createDataCell('Gestão estratégica, supervisão clínica e administrativa, despacho de compras e gestão da equipa.', 38),
                  createDataCell('Painel Executivo 360º, Despacho de Requisições, Equipa & Acessos, Auditoria Geral, Configurações do Hospital.', 40)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Médico / Corpo Clínico', 22, false, true),
                  createDataCell('Atendimento médico ambulatorial e de urgência, diagnóstico, prescrição de medicamentos e requisições clínicas.', 38),
                  createDataCell('Fila de Espera Clínica, Prontuário Eletrónico, Diagnóstico CID, Emissor de Receitas Médicas, Requisição de Insumos.', 40)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Farmacêutico / Stock', 22, false, true),
                  createDataCell('Gestão do inventário da farmácia, dispensação de fármacos prescritos e reposição de stock hospitalar.', 38),
                  createDataCell('Painel Farmacêutico, Alertas de Rutura, Catálogo de Medicamentos, Requisição de Reposição e Confirmação de Entrada.', 40)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Recepcionista & Caixa', 22, false, true),
                  createDataCell('Admissão de pacientes, abertura de processos clínicos, triagem de prioridade e cobrança de serviços.', 38),
                  createDataCell('Registo de Pacientes, Marcação de Consultas, Triagem/Chamada, Caixa com Emissão de Recibo Oficial numerado.', 40)
                ]
              })
            ]
          }),

          // SEÇÃO 4
          makeSectionTitle('4. Módulos Operacionais Integrados do Sistema'),
          makeSubsectionTitle('A. Portal Institucional de Apresentação (Landing Page)'),
          makeBodyParagraph('Apresentação corporativa da unidade de saúde com visual moderno e limpo, sem vestígios de IA: apresentação de departamentos clínicos (Cardiologia, Neurologia, Pediatria, Ortopedia, Cirurgia), corpo clínico credenciado com imagens profissionais, marcação expressa e botão de login seguro para acesso aos Workspaces de Gestão.'),

          makeSubsectionTitle('B. Gestão de Pacientes & Histórico Clínico Longitudinal'),
          makeBodyParagraph('Registo de pacientes com geração padronizada de Número de Processo (ex: P2026-00001), arquivo biográfico, documentos de identificação, contactos de emergência, registo de alergias e acesso instantâneo ao histórico de todas as consultas e atendimentos anteriores.'),

          makeSubsectionTitle('C. Agenda Médica, Triagem e Fila de Espera'),
          makeBodyParagraph('Marcação ágil de consultas por médico e especialidade. Fluxo de atendimento com transições de estado em tempo real: Agendada -> Sala de Espera -> Em Atendimento -> Concluída. Classificação de prioridade (Normal, Prioritário, Urgente) para gestão humanizada do tempo de espera.'),

          makeSubsectionTitle('D. Consultório Médico Eletrónico & Prescrição'),
          makeBodyParagraph('Interface clínica para o médico com aferição de sinais vitais (Tensão Arterial, Temperatura, Pulsação, Peso corporal), anotações de anamnese, registo de diagnósticos clínicos e gerador de Prescrições Médicas oficiais prontas para impressão.'),

          makeSubsectionTitle('E. Farmácia Hospitalar & Controlo de Stock'),
          makeBodyParagraph('Catálogo informatizado de medicamentos com dosagem, princípio ativo, forma farmacêutica e limiares de segurança (stock mínimo). Dedução de saídas e sincronização automática com pedidos de abastecimento.'),

          makeSubsectionTitle('F. Requisições, Aquisições & Despacho da Direção'),
          makeBodyParagraph('Módulo de compras sem papel: funcionários solicitam reposição de fármacos, material clínico ou equipamentos. O Diretor analisa o custo, a justificativa e aprova ou rejeita com parecer oficial. A receção física do produto credita automaticamente o stock.'),

          makeSubsectionTitle('G. Caixa, Faturação e Emissão de Recibos'),
          makeBodyParagraph('Registo de pagamentos em conformidade com o mercado moçambicano e internacional: M-Pesa, e-Mola, Cartão POS, Dinheiro e Transferência. Emissão automática de Recibo Oficial numerado com discriminação do serviço prestado e identificação do operador.'),

          makeSubsectionTitle('H. Relatórios Administrativos & Executivos'),
          makeBodyParagraph('Painéis analíticos e relatórios gerenciais com métricas de faturação total, produtividade do corpo clínico, volume de consultas por departamento e estatísticas de utilização.'),

          makeSubsectionTitle('I. Auditoria, Rastreabilidade & Segurança'),
          makeBodyParagraph('Mecanismo de log contínuo que regista o utilizador, a hora, a entidade e os detalhes de cada ação relevante na base de dados, prevenindo fraudes e assegurando conformidade ética.'),

          // SEÇÃO 5
          makeSectionTitle('5. Especificações Técnicas e Arquitetura de Software'),
          makeBulletPoint('• Frontend:', 'React 19, TypeScript, Vite, Tailwind CSS, Componentes Shadcn UI / Radix Primitives, Lucide Icons.'),
          makeBulletPoint('• Backend & Dados:', 'Supabase (PostgreSQL 15), Políticas de Segurança RLS (Row Level Security), Triggers em PL/pgSQL.'),
          makeBulletPoint('• Autenticação:', 'Supabase Auth com tokens JWT seguros, confirmação imediata e metadados organizacionais por Hospital.'),
          makeBulletPoint('• Resiliência Operacional:', 'Mecanismo de persistência redundante com failover transparente caso ocorra oscilação na ligação à nuvem.'),

          // SEÇÃO 6
          makeSectionTitle('6. Matriz de Atendimento aos Requisitos'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR }
            },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Requisito Hospitalar', 40),
                  createHeaderCell('Implementação Efetiva no SGH', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Registar e gerir informações dos pacientes', 40, false, true),
                  createDataCell('Processo clínico informatizado, histórico unificado e pesquisa rápida.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Cadastro e gestão de médicos e funcionários', 40, false, true),
                  createDataCell('Módulo de equipa com credenciais por função e inscrição de médicos na OMM.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Marcação, alteração e cancelamento de consultas', 40, false, true),
                  createDataCell('Agenda médica completa, fila de espera dinâmica e motivos de cancelamento.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Histórico clínico longitudinal dos pacientes', 40, false, true),
                  createDataCell('Acesso imediato no consultório ao prontuário e antecedentes de saúde.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Diagnósticos, prescrições e medicamentos', 40, false, true),
                  createDataCell('Atendimento médico eletrónico com CID, sinais vitais e receitas impressas.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Controlo de pagamentos e tesouraria', 40, false, true),
                  createDataCell('Faturação com M-Pesa, e-Mola, Cartão, Dinheiro e emissão de recibo.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Requisições internas e reposição de stock', 40, false, true),
                  createDataCell('Fluxo formal de compras com despacho do Diretor e entrada automática em stock.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Relatórios gerenciais e estatísticas', 40, false, true),
                  createDataCell('Métricas financeiras, relatórios de produtividade médica e gráficos executivos.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Níveis de acesso diferenciados (RBAC)', 40, false, true),
                  createDataCell('4 interfaces adaptativas: Diretor, Médico, Farmacêutico e Recepcionista.', 60)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell('Segurança e eliminação de papéis', 40, false, true),
                  createDataCell('Base de dados relacional segura com auditoria contínua e RLS.', 60)
                ]
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'Documento homologado para apresentação institucional, implantação operacional e demonstração executiva a unidades de saúde.',
                italics: true,
                font: 'Calibri',
                size: 19,
                color: MUTED_COLOR
              })
            ]
          })
        ]
      }
    ]
  });

  const outputPath = path.resolve('FICHA_DESCRITIVA_SISTEMA_HOSPITALAR.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento Word gerado com sucesso em: ${outputPath}`);
}

generateDocx().catch((err) => {
  console.error('Erro ao gerar documento docx:', err);
  process.exit(1);
});
