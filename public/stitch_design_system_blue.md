# Design System Corporativo — SGH (Atualizado: Paleta Azul Clínico)

Documento oficial de diretrizes visuais, tokens, acabamentos de componentes e iconografia padronizada para o ecossistema SGH (Workspaces Multi-Tenant Hospitalares).

---

## 1. Princípios Fundamentais de Design

1. **Clareza Clínica e Ausência de Ruído (*Zero Noise*):** 
   - A informação médica e operacional deve ser assimilada em frações de segundo sem distrações cosméticas.
   - Eliminação de gradientes espalhafatosos, sombras profundas e decorações arbitrárias.
2. **Respiro Visual e Ritmo de Espaçamento (*Whitespace Rhythm*):**
   - Separação preferencialmente conseguida por espaços generosos e linhas ultra-finas (`1px border`) em vez de blocos de cor carregados.
3. **Semântica Rigorosa:**
   - A cor primária institucional é o **Azul Clínico** (`#0284C7`), transmitindo serenidade, rigor técnico e autoridade hospitalar.
   - Cores de aviso e alerta têm significado vital (triagem, alergias, ruturas de stock) e nunca devem ser usadas para propósitos decorativos.

---

## 2. Paleta de Cores e Tokens do Sistema (Atualizada)

### 2.1. Identidade Principal (Paleta Institucional Azul)
* **Primária / CTA Principal (`#0284C7` | Hover: `#0369A1` | Active: `#075985`):**
  - Aplicação: Botões primários, itens de navegação ativos, caixas de seleção ativas, cabeçalhos de destaque.
* **Secundária / Apoio de Marca (`#38BDF8` / `#7DD3FC`):**
  - Aplicação: Destaques de apoio, barras de progresso secundárias, gráficos de tendência estável.
* **Tons Suaves de Superfície (`#F0F9FF` e `#E0F2FE`):**
  - Aplicação: Fundo de cartões informativos, destaques de linhas ativas em tabelas, badges neutros de sistema.
* **Superfície Base & Neutros:**
  - `Surface Base`: `#F8FAFC` (Fundo geral da aplicação, descanso visual óptico)
  - `Card Background`: `#FFFFFF` (Superfície limpa de trabalho)
  - `Bordas / Divisórias`: `#E2E8F0` / `#F1F5F9` (Linhas de 1px ultra-sutis)
  - `Texto Principal`: `#0F172A` (Slate 900 — contraste e legibilidade impecáveis)
  - `Texto Secundário`: `#64748B` (Slate 500 — legendas, metadados, timestamps)

### 2.2. Cores Semânticas & Triagem Clínica (Manchester Protocol)
* **Crítico / Perigo / Alergia / Rutura (`#EF4444` / `#DC2626`):**
  - Uso: Alertas de alergias a medicamentos (ex.: Penicilina), rutura de stock iminente na farmácia, triagem Manchester Vermelho (Emergência imediata), ações destrutivas (Rejeitar requisição, cancelar consulta).
* **Atenção / Pendência / Aviso (`#F59E0B` / `#D97706`):**
  - Uso: Triagem Manchester Amarelo (Urgente), pedidos de compra aguardando despacho da Direção, medicamentos atingindo o stock de segurança.
* **Estável / Sucesso / Triagem Verde (`#10B981`):**
  - Uso: Triagem Manchester Verde (Pouco urgente), consultas concluídas, requisições entregues.

---

## 3. Acabamento de Componentes & Anatomia

### 3.1. Cartões e Painéis (Containers)
- **Fundo:** `#FFFFFF`.
- **Borda:** `1px solid #E2E8F0`.
- **Cantos Arredondados:** `rounded-lg` (8px–10px) para cartões de conteúdo; `rounded-md` (6px) para tabelas e inputs.
- **Sombra:** `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03)` (quase imperceptível).

### 3.2. Botões (Actions & CTAs)
- **Primary Button:**
  - Fundo `#0284C7`, texto branco, altura 36px–40px, cantos `rounded-md`, peso 500.
  - Hover: escurecimento sutil (background `#0369A1`).
- **Secondary / Ghost Button:**
  - Fundo transparente ou `#FFFFFF`, borda `1px solid #E2E8F0`, texto `#334155`.
  - Hover: fundo `#F8FAFC`, texto `#0F172A`.
- **Destructive / Negative Action:**
  - Estilo sutil: texto `#DC2626`, fundo transparente ou `#FEF2F2` suave.

### 3.3. Badges de Triagem e Estado
- Altura: 22px–24px.
- Padding: `px-2.5 py-0.5`.
- Cantos: `rounded-md` ou `rounded-full`.
- Tipografia: 11px, weight 600.

### 3.4. Campos de Entrada (Formulários & Anamnese)
- Fundo: `#FFFFFF`.
- Borda de repouso: `1px solid #CBD5E1`.
- Foco: Borda `#0284C7` com anel externo sutil de foco (`ring-2 ring-[#0284C7]/15`).
