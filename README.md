# Sistema de Controle Financeiro - Multi-Contas

Um sistema completo e robusto para gerenciar finanças pessoais e de grupo, desenvolvido com foco na usabilidade, segurança e colaboração. A aplicação é construída com uma arquitetura **full-stack**, garantindo que os dados sejam armazenados de forma persistente e possam ser acessados de diferentes dispositivos.

---

## 🚀 Funcionalidades Principais

### 👥 Sistema de Usuários e Grupos
- **3 tipos de usuário**: `admin`, `user`, `collaborator`
- **Sistema de grupos**: Cada usuário pertence a um grupo isolado
- **Aprovação de usuários**: Admin aprova novos cadastros
- **LGPD**: Consentimento obrigatório para cadastro
- **Gestão completa**: Edição, exclusão e visualização de usuários

### 🏦 Gestão de Contas Bancárias
- **Múltiplas contas** por grupo
- **Transferência entre contas** com validação de saldo
- **Cálculo automático** de saldos
- **Proteção contra exclusão** da última conta
- **Rastreabilidade** de contas excluídas

### 💰 Sistema de Transações
- **Tipos**: Receita e Despesa
- **Categorias**: Sistema completo de categorização
- **Confirmação**: Transações precisam ser confirmadas
- **Multiplicador**: Criação de parcelas automáticas
- **Transferências**: Marcadas como transferências internas
- **Filtros avançados**: Por data, tipo, categoria, conta e status

### 📊 Dashboard Avançado
- **Resumo consolidado**: Totais por grupo
- **Resumo por conta**: Detalhamento individual
- **Filtros dinâmicos**: Data, tipo, categoria, conta
- **Gráficos interativos**: 
  - Pizza (distribuição por categoria/tipo)
  - Barras (evolução mensal)
- **Tabela detalhada**: Status e saldos por conta

### 🏷️ Sistema de Categorias
- **Tipos**: Income (Receita) e Expense (Despesa)
- **Validação**: Nome único por grupo/tipo
- **Proteção**: Não permite deletar categorias em uso
- **Gestão completa**: CRUD completo

### 🔐 Segurança e Validação
- **Senhas criptografadas** com bcrypt
- **Validação de força** de senha
- **Autenticação baseada** em headers
- **Autorização por papéis** para endpoints
- **Validação LGPD** obrigatória

---

## 🛠️ Tecnologias

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Bootstrap 5** (layout responsivo)
- **Font Awesome** (ícones)
- **Chart.js** (gráficos interativos)

### Backend
- **Node.js** (ambiente de execução)
- **Express.js** (API REST)
- **SQLite3** (banco de dados)
- **bcryptjs** (criptografia de senhas)

---

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js e npm instalados

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd controle-financeiro
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Inicie o servidor
```bash
npm start
```

### 4. Acesse o sistema
Abra seu navegador e acesse: **http://localhost:3000**

---

## 🎯 Como Usar

### Primeiro Acesso
- **Usuário**: `admin`
- **Senha**: `123456`

### Fluxo de Uso
1. **Login** com usuário admin
2. **Criar contas** bancárias
3. **Criar categorias** (receita/despesa)
4. **Registrar transações** com confirmação
5. **Visualizar dashboard** com gráficos
6. **Gerenciar usuários** e grupos

### Funcionalidades por Página

#### 🏠 Dashboard
- Resumo consolidado de receitas e despesas
- Gráficos de distribuição e evolução
- Filtros avançados para análise
- Tabela detalhada por conta

#### 🏦 Contas Bancárias
- Adicionar/editar contas
- Transferir saldo entre contas
- Visualizar saldos individuais

#### 🏷️ Categorias
- Criar categorias de receita/despesa
- Editar e excluir categorias
- Validação de uso em transações

#### 💰 Transações
- Registrar receitas e despesas
- Usar multiplicador para parcelas
- Confirmar transações
- Filtrar por diversos critérios

#### 👥 Usuários
- **Admin**: Gerencia todos os usuários
- **User**: Gerencia colaboradores do grupo
- Aprovação de novos cadastros

---

## 🗄️ Estrutura do Banco de Dados

```sql
-- Usuários
users (id, username, password, group_id, role, is_approved, whatsapp, instagram, email, consent_lgpd)

-- Contas
accounts (id, name, group_id)

-- Categorias  
categories (id, group_id, name, type)

-- Transações
transactions (id, user_id, account_id, category_id, description, amount, type, is_confirmed, created_at, due_date, confirmed_at, is_transfer, original_account_name)
```

---

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
controle-financeiro/
├── public/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── main.js
│       ├── api.js
│       ├── ui.js
│       ├── state.js
│       └── utils.js
├── server.js
├── package.json
└── financas.db
```

### Scripts Disponíveis
```bash
npm start    # Inicia o servidor
npm install  # Instala dependências
```

---

## 📱 Interface

- **Design responsivo** com menu lateral colapsável
- **Validação em tempo real** de formulários
- **Filtros avançados** em todas as listagens
- **Confirmações** para ações destrutivas
- **Feedback visual** para todas as operações
- **Gráficos interativos** no dashboard

---

## 🚀 Status do Projeto

✅ **Sistema completo e funcional**
✅ **Todas as funcionalidades implementadas**
✅ **Interface responsiva e moderna**
✅ **Sistema de segurança robusto**
✅ **Banco de dados otimizado**
✅ **Documentação completa**

---

## 📄 Licença

Este projeto está sob a licença ISC.

---

## 👨‍💻 Desenvolvido por

Sistema desenvolvido com foco na experiência do usuário e robustez técnica.