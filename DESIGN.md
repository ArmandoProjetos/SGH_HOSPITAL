# Design System: SGH — Sistema Integrado de Gestão Hospitalar
**Project ID:** 16191097382177036899

## 1. Visual Theme & Atmosphere
A interface do **SGH (Sistema Integrado de Gestão Hospitalar)** adota uma estética clínica, limpa, institucional e minimalista, projetada para ambientes hospitalares de alta responsabilidade. O ambiente visual privilegia a clareza imediata, a leitura sem fadiga visual durante longos turnos médicos e administrativos, e a ausência total de elementos decorativos supérfluos, gradientes exagerados ou cores artificiais (como roxo ou néon). A estrutura equilibra espaços em branco generosos sobre superfícies claras com acentos precisos em Azul Clínico.

## 2. Color Palette & Roles
* **Clinical Cerulean Blue (`#0284C7`):** Cor primária institucional utilizada em ações principais, botões de confirmação, indicadores ativos de navegação e destaques de marca.
* **Deep Medical Sky (`#0369A1`):** Variação de estado ativo e hover para botões primários, links interativos e cabeçalhos de documentos oficiais.
* **Soft Clinical Ice (`#F0F9FF` / `#E0F2FE`):** Fundo suave para emblemas informativos, realce de linhas selecionadas e indicadores de contexto clínico.
* **Pure Clinical White (`#FFFFFF`):** Superfície principal de cartões, tabelas de prontuários, modais de diálogo, cabeçalhos e áreas de impressão oficial (receitas e recibos).
* **Sterile Alabaster (`#F8FAFC`):** Plano de fundo geral do workspace hospitalar, garantindo contraste suave com os contentores brancos.
* **Deep Slate Ink (`#0F172A`):** Cor tipográfica primária para títulos, nomes de pacientes, valores monetários e cabeçalhos estruturais.
* **Balanced Slate Gray (`#475569`):** Texto secundário, rótulos de formulários, legendas técnicas e metadados de auditoria.
* **Crisp Border Mist (`#E2E8F0`):** Linhas divisórias subtis de tabelas, contornos de cartões e separadores de secção.
* **Vital Emerald (`#059669`):** Indicador semântico exclusivo para estados concluídos, stock regular, contas ativas e pagamentos liquidados.
* **Triage Amber (`#D97706`):** Indicador semântico reservado para fila de sala de espera, stock próximo do mínimo e requisições pendentes.
* **Urgent Crimson (`#E11D48`):** Indicador semântico restrito a urgências clínicas, alergias críticas, ruturas de stock e ações destrutivas (eliminação/cancelamento).

## 3. Typography Rules
* **Primary Font Family:** `Inter`, sans-serif geométrica de elevada legibilidade em ecrãs densos de dados clínicos.
* **Monospace Font Family:** Fonte monoespaçada do sistema com `tabular-nums` para números de processo (`P2026-0001`), inscrições na OMM, NUIT, valores em Meticais (`MT`), sinais vitais e carimbos temporais.
* **Hierarchy & Weights:**
  * Títulos de Página e Headline: `font-bold` a `font-extrabold` (`700`–`800`), `tracking-tight`, alinhados com `text-balance`.
  * Cabeçalhos de Cartões e Secções: `font-semibold` (`600`), escala controlada (`14px`–`16px`) sem sublinhados decorativos.
  * Corpo de Texto e Tabelas: `font-normal` a `font-medium` (`400`–`500`), altura de linha confortável (`leading-relaxed`) para leitura rápida de prontuários.

## 4. Component Stylings
* **Buttons:** Cantos suavemente arredondados (`rounded-lg`, `8px`), altura compacta e consistente (`32px` a `40px`), preenchimento sólido em Azul Clínico (`#0284C7`) para ações primárias e contorno subtil (`#CBD5E1`) sobre fundo branco para ações secundárias. Estados de foco visíveis com anel azul (`focus-visible:ring-2`).
* **Cards & Containers:** Cantos moderadamente arredondados (`rounded-xl`, `10px`), fundo branco puro (`#FFFFFF`), borda fina de `1px` (`#E2E8F0`) e elevação mínima (`shadow-xs`) para manter a sobriedade visual sem sombras pesadas.
* **Inputs & Forms:** Campos com borda nítida (`#CBD5E1`), fundo branco, rótulos claros acima de cada controlo, mensagens de validação objetivas e suporte completo a navegação por teclado.
* **Data Tables:** Cabeçalhos discretos em cinza muito claro (`#F8FAFC`), linhas separadas por divisórias subtis (`#F1F5F9`) e realce suave no hover (`hover:bg-sky-50/40`).

## 5. Layout Principles
* **Whitespace & Simplicity:** Prioridade à informação essencial. Cada página do workspace apresenta um cabeçalho direto, indicadores resumidos (máximo de 4 KPIs por linha) e a tabela ou área de trabalho principal, evitando caixas redundantes ou excesso de texto explicativo.
* **Grid & Alignment:** Grelha responsiva de 12 colunas na página institucional (`max-w-7xl`) e estrutura fixa com barra lateral esquerda (`256px`) e área de trabalho fluida no workspace hospitalar.
* **Print Readiness:** Documentos clínicos e financeiros (Receitas Médicas, Recibos de Caixa e Relatórios de Inventário) utilizam layout A4 limpo com cabeçalho institucional timbrado.
