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
- **Alteração de senha**: Sistema seguro para mudança de senhas

### 🏦 Gestão de Contas Bancárias
- **Múltiplas contas** por grupo
- **Transferência entre contas** com validação de saldo
- **Cálculo automático** de saldos
- **Proteção contra exclusão** da última conta
- **Rastreabilidade** de contas excluídas
- **Validação de saldo positivo** para transferências

### 💰 Sistema de Transações
- **Tipos**: Receita e Despesa
- **Categorias**: Sistema completo de categorização
- **Tipos de Pagamento**: Gestão de formas de pagamento (Entrada, Saída, Ativo)
- **Confirmação**: Transações precisam ser confirmadas
- **Multiplicador**: Criação de parcelas automáticas
- **Transferências**: Marcadas como transferências internas
- **Filtros avançados**: Por data, tipo, categoria, conta e status
- **Edição e exclusão**: Gestão completa de transações

### 📊 Dashboard Avançado
- **Resumo consolidado**: Totais por grupo
- **Resumo por conta**: Detalhamento individual
- **Filtros dinâmicos**: Data, tipo, categoria, conta
- **Gráficos interativos**: 
  - Pizza (distribuição por categoria/tipo)
  - Barras (evolução mensal)
- **Tabela detalhada**: Status e saldos por conta
- **Múltiplos períodos**: Lançamento, vencimento e confirmação

### 🏷️ Sistema de Categorias
- **Tipos**: Income (Receita) e Expense (Despesa)
- **Validação**: Nome único por grupo/tipo
- **Proteção**: Não permite deletar categorias em uso
- **Gestão completa**: CRUD completo

### 💳 Tipos de Pagamento
- **Gestão completa**: CRUD para formas de pagamento
- **Aplicabilidade**: Entrada, Saída e Ativo
- **Integração**: Vinculação com transações e importações

### 📋 Importação de Planilhas
- **Formatos suportados**: Excel (.xlsx, .xls) e CSV
- **Validação automática**: Verificação de colunas obrigatórias
- **Processamento inteligente**: Agrupamento por notas fiscais
- **Associação de produtos**: Unificação com produtos existentes
- **Configuração flexível**: Parcelas, contas e categorias
- **Rastreabilidade completa**: Histórico de importações

### 📦 Gestão de Produtos
- **Cadastro automático**: Produtos criados via importação
- **Histórico de compras**: Rastreamento completo por produto
- **Comparação de preços**: Análise entre fornecedores
- **Produtos associados**: Unificação de produtos similares
- **Estatísticas avançadas**: Preço médio, última compra, fornecedores
- **Busca inteligente**: Filtros por nome e código

### 🛒 Compras Importadas
- **Visualização completa**: Lista de todas as compras importadas
- **Detalhamento**: Notas fiscais, fornecedores, valores
- **Gestão de parcelas**: Controle de pagamentos parcelados
- **Filtros avançados**: Por período, fornecedor, status

### 🔐 Segurança e Validação
- **Senhas criptografadas** com bcrypt
- **Validação de força** de senha
- **Autenticação baseada** em headers
- **Autorização por papéis** para endpoints
- **Validação LGPD** obrigatória
- **Proteção de rotas** com middleware de autenticação

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
- **Multer** (upload de arquivos)
- **XLSX** (processamento de planilhas Excel)

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
- Múltiplos tipos de período (lançamento, vencimento, confirmação)

#### 🏦 Contas Bancárias
- Adicionar/editar contas
- Transferir saldo entre contas
- Visualizar saldos individuais
- Validação de saldo positivo para transferências

#### 🏷️ Categorias
- Criar categorias de receita/despesa
- Editar e excluir categorias
- Validação de uso em transações

#### 💳 Tipos de Pagamento
- Criar tipos de pagamento (Entrada, Saída, Ativo)
- Editar e excluir tipos
- Aplicabilidade configurável

#### 📋 Importar Compra
- Upload de planilhas Excel/CSV
- Validação automática de colunas
- Processamento inteligente de dados
- Associação de produtos existentes
- Configuração de parcelas e categorias

#### 🛒 Compras Importadas
- Visualização de todas as compras importadas
- Detalhamento por nota fiscal
- Gestão de parcelas
- Filtros avançados

#### 📦 Produtos
- Listagem de produtos importados
- Histórico de compras por produto
- Comparação de preços entre fornecedores
- Unificação de produtos similares
- Estatísticas avançadas

#### 💰 Transações
- Registrar receitas e despesas
- Usar multiplicador para parcelas
- Confirmar transações
- Filtrar por diversos critérios
- Editar e excluir transações
- Tipos de pagamento integrados

#### 🔄 Transferência
- Transferir saldo entre contas
- Validação de saldo disponível
- Criação automática de transações
- Rastreabilidade completa

#### 👥 Usuários
- **Admin**: Gerencia todos os usuários
- **User**: Gerencia colaboradores do grupo
- Aprovação de novos cadastros
- Alteração de senha segura

---

## 🗄️ Estrutura do Banco de Dados

```sql
-- Usuários
users (id, username, password, group_id, role, is_approved, whatsapp, instagram, email, consent_lgpd)

-- Contas
accounts (id, name, group_id)

-- Categorias  
categories (id, group_id, name, type)

-- Tipos de Pagamento
payment_types (id, group_id, name, is_income, is_expense, is_asset)

-- Transações
transactions (id, user_id, account_id, category_id, payment_type_id, description, amount, type, is_confirmed, created_at, due_date, confirmed_at, is_transfer, original_account_name)

-- Fornecedores
suppliers (id, group_id, name)

-- Produtos
products (id, group_id, name, code, created_at)

-- Produtos Associados
product_associations (id, primary_product_id, associated_product_id)

-- Compras
purchases (id, group_id, supplier_id, invoice_number, total_amount, purchase_date, installment_count, first_installment_date, account_id, payment_type_id, category_id, created_at)

-- Itens de Compra
purchase_items (id, purchase_id, product_id, quantity, unit_price, total_price)
```

---

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
controle-financeiro/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── js/
│       ├── main.js
│       ├── api.js
│       ├── ui.js
│       ├── state.js
│       └── utils.js
├── server.js
├── package.json
├── financas.db
├── uploads/ (arquivos de planilhas)
├── CHANGELOG.md
├── TESTE_DASHBOARD.md
├── TRANSFERENCIA_ENTRE_CONTAS.md
└── README.md
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
- **Upload de arquivos** com validação
- **Modais informativos** para LGPD e termos
- **Tabelas responsivas** com scroll horizontal
- **Sistema de etapas** para importação
- **Comparação visual** de produtos

---

## 🚀 Status do Projeto

✅ **Sistema completo e funcional**
✅ **Todas as funcionalidades implementadas**
✅ **Interface responsiva e moderna**
✅ **Sistema de segurança robusto**
✅ **Banco de dados otimizado**
✅ **Documentação completa**
✅ **Importação de planilhas Excel/CSV**
✅ **Gestão avançada de produtos**
✅ **Sistema de transferências entre contas**
✅ **Dashboard com gráficos interativos**
✅ **Sistema de usuários e grupos**
✅ **Conformidade com LGPD**

---

## 📄 Licença

Este projeto está sob a licença ISC.

---

## 👨‍💻 Desenvolvido por

Sistema desenvolvido com foco na experiência do usuário e robustez técnica.

---

---

**Smartvirtua Informática** - Todos os direitos reservados - 2025  
**Versão do sistema:** 1.0.0