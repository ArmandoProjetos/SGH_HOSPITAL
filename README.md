# SGH — Sistema Integrado de Gestão Hospitalar & Clínica

Plataforma web integrada para gestão clínica, operacional e financeira de unidades hospitalares, centros médicos e policlínicas, estruturada segundo o padrão arquitectural **MVC (Model-View-Controller)** e persistência relacional em **PostgreSQL (Supabase)**.

---

## 🏗️ Arquitectura MVC (Model – View – Controller)

O código-fonte está organizado nas três camadas clássicas do padrão **MVC**:

### 1. Model (`src/models/`)
Responsável pela estrutura de dados, regras de validação de domínio e comunicação directa com a base de dados relacional:
- **`src/models/index.ts`** — Definição das entidades (`Hospital`, `Perfil`, `Especialidade`, `Medico`, `Paciente`, `Consulta`, `Atendimento`, `PrescricaoItem`, `Medicamento`, `Requisicao`, `Pagamento`, `RegistoAuditoria`) e matrizes de permissões RBAC.
- **`src/models/ValidadoresModel.ts`** — Validação de campos obrigatórios, formatos específicos (Email, BI/Passaporte, NUIT de 9 dígitos, Telefone, Nº de Ordem OMM), prevenção de duplicados e verificação de integridade referencial antes da eliminação (`verificarRestricaoEliminacao`).
- **`src/models/DatabaseModel.ts`** — Camada de acesso e persistência de dados (`listar`, `inserir`, `actualizar`, `eliminar`, autenticação encriptada via Supabase Auth / PostgreSQL e sincronização multi-dispositivo).

### 2. View (`src/views/` e `src/pages/`)
Responsável exclusivamente pela interface gráfica (paleta clínica Azul `#0284C7` e Branco `#FFFFFF`), recolha de entradas em formulários e apresentação de listagens, pesquisas e relatórios:
- **`src/views/index.ts`** — Exportação centralizada das vistas (`LandingView`, `WorkspaceShellView`, `PainelView`, `PacientesView`, `ConsultasView`, `AtendimentoView`, `MedicosView`, `MedicamentosView`, `RequisicoesView`, `PagamentosView`, `RelatoriosView`, `UtilizadoresView`, `AuditoriaView`, `DefinicoesView`).

### 3. Controller (`src/controllers/`)
Responsável por coordenar as acções do utilizador vindas das Views, invocar validações do Model, actualizar o estado da aplicação e registar a trilha de auditoria:
- **`src/controllers/AuthController.ts`** — Gestão de sessão, login/registo seguro e aplicação das permissões por perfil (`ADMINISTRADOR`, `MEDICO`, `FARMACEUTICO`, `RECEPCIONISTA`).
- **`src/controllers/DadosController.ts`** — Controlador central das operações CRUD (`criar`, `editar`, `eliminar`, `recarregar`), verificação de restrições relacionais na eliminação e geração automática de números sequenciais (`P2026-XXXX`, `R2026-XXXX`, `REQ-2026-XXXX`).

---

## 🔐 Perfis de Acesso (RBAC) e Credenciais de Demonstração

| Perfil | E-mail | Palavra-passe | Permissões Principais |
| :--- | :--- | :--- | :--- |
| **Direcção / Administrador** | `admin@hospital.com` | `admin123` | Acesso total, aprovação de requisições, relatórios executivos, gestão de equipa, auditoria e definições. |
| **Médico / Corpo Clínico** | `medico@hospital.com` | `medico123` | Consultório médico, prontuário electrónico, sinais vitais, diagnóstico, prescrição de receitas e pedidos. |
| **Farmacêutico / Stock** | `farmacia@hospital.com` | `farmacia123` | Catálogo de medicamentos, controlo de stock mínimo, entradas de stock e requisições à Direcção. |
| **Recepcionista & Caixa** | `recepcao@hospital.com` | `recepcao123` | Admissão e edição de pacientes, marcação de consultas, check-in para fila de espera e emissão de recibos. |

---

## 🗄️ Base de Dados (`supabase/schema.sql`)

- **Motor:** PostgreSQL (Supabase Cloud + Persistência Local de Salvaguarda).
- **Segurança:** Palavras-passe processadas com hash seguro (`bcrypt` via `auth.users`), Row Level Security (RLS) por `hospital_id` e restrições de chave estrangeira (`ON DELETE RESTRICT` / `ON DELETE CASCADE`).

---

## 🚀 Como Executar

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Iniciar servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Compilar para produção:
   ```bash
   npm run build
   ```
