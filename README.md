
-----

# Controle de Finanças - Multi-Contas

Este é um sistema robusto para gerenciar finanças pessoais e de grupo, desenvolvido com foco na usabilidade, segurança e colaboração. A aplicação é construída com uma arquitetura **full-stack**, garantindo que os dados sejam armazenados de forma persistente e possam ser acessados de diferentes dispositivos.

---

### Novidades e Recursos Atuais

O sistema foi expandido para oferecer uma gama completa de funcionalidades:

*   **Sistema de Aprovação de Usuários (NOVO):** Novos usuários registrados precisam ser aprovados por um administrador antes de poderem fazer login.
*   **Notificação por E-mail (NOVO):** Administradores recebem notificações por e-mail (`isaac.systemilc@gmail.com`) sobre novos usuários aguardando aprovação.
*   **Gerenciamento de Usuários Abrangente:**
    *   Registro e Login seguros com validação de senha e criptografia (`bcryptjs`).
    *   Edição de perfis de usuário por administradores.
    *   Exclusão de usuários (com controles de segurança para evitar exclusão de si mesmo ou do administrador principal).
    *   Listagem detalhada de usuários do grupo, incluindo papel e status de aprovação.
*   **Controle Multi-Contas:** Gerencie múltiplas contas (ex: "Conta Pessoal", "Conta da Esposa"), com resumos individuais e consolidados.
*   **Gerenciamento de Categorias (NOVO):** Crie, edite e delete categorias de receita/despesa para melhor organização financeira.
*   **Transações Detalhadas:**
    *   Adicione transações de receita e despesa com descrição, valor, conta, categoria e data de vencimento.
    *   Funcionalidade de **multiplicador** para parcelamento de transações.
    *   **Transações Condicionais:** Marque transações como "confirmadas" para que afetem o saldo.
    *   Edição e Deleção flexível de transações.
    *   Filtros avançados para o histórico de transações (por período, tipo de data, tipo de transação, conta, categoria e status de confirmação).
*   **Transferência de Saldo (NOVO):** Realize transferências entre suas contas com registros automáticos de entrada e saída.
*   **Dashboard Interativo:**
    *   Resumo consolidado de receita, despesa e saldo total.
    *   Gráficos visuais (pizza por categoria/tipo, barras de evolução mensal) para uma análise rápida.
    *   Filtros dinâmicos para personalizar a visualização do dashboard.
*   **Rastreabilidade:** Mantenha um histórico da conta original de uma transação mesmo após ela ser deletada.
*   **Segurança Robusta:** Autenticação baseada em `userId`, `groupId` e `userRole`, com autorização por papéis para proteger endpoints críticos.
*   **Interface Moderna e Responsiva:**
    *   Desenvolvido com **Bootstrap 5** para um layout adaptável a qualquer tela.
    *   Ícones intuitivos com **Font Awesome**.

---

### Tecnologias

**Front-end:**

*   HTML5, CSS3, JavaScript (ES6+)
*   Bootstrap 5 (para layout responsivo)
*   Font Awesome (para ícones)
*   Chart.js (para gráficos interativos)

**Back-end:**

*   Node.js (ambiente de execução)
*   Express.js (para a API REST)
*   SQLite3 (banco de dados leve)
*   `bcryptjs` (para criptografia de senhas)
*   `nodemailer` (para envio de e-mails de notificação)

---

### Instalação e Configuração

Siga estes passos para ter o projeto funcionando em seu ambiente local.

#### Pré-requisitos

Certifique-se de que o **Node.js** e o **npm** estejam instalados em seu computador.

#### 1. Estrutura de Pastas

Organize os arquivos do seu projeto na seguinte estrutura:

```
/meu-projeto
|-- public/
|    |-- index.html
|    |-- style.css
|    |-- script.js
|    |-- js/ (arquivos JavaScript do frontend)
|-- server.js
|-- package.json
|-- package-lock.json
|-- financas.db (será criado após a primeira execução)
```

#### 2. Instalar Dependências

Abra o terminal na pasta raiz do seu projeto e execute o comando para instalar todas as bibliotecas necessárias:

```bash
npm install
```

#### 3. Configurar Variáveis de Ambiente para E-mail (OBRIGATÓRIO para notificações)

Para que o sistema possa enviar e-mails de notificação de novos usuários, você precisa configurar as seguintes variáveis de ambiente:

*   `EMAIL_USER`: Seu endereço de e-mail que será usado para enviar as notificações (ex: `seu.email@gmail.com`).
*   `EMAIL_PASS`: A senha de aplicativo gerada para o seu e-mail. **Não use a senha principal da sua conta.** Para o Gmail, você pode gerar uma senha de aplicativo aqui: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**Como definir as variáveis de ambiente (exemplo):**

*   **Windows (PowerShell):**
    ```powershell
    $env:EMAIL_USER="seu.email@gmail.com"
    $env:EMAIL_PASS="sua_senha_de_aplicativo"
    node server.js
    ```
*   **Linux/macOS:**
    ```bash
    export EMAIL_USER="seu.email@gmail.com"
    export EMAIL_PASS="sua_senha_de_aplicativo"
    node server.js
    ```
    *Para manter essas variáveis persistentes, considere adicioná-las ao seu `.bashrc`, `.zshrc` ou equivalente.*

#### 4. Configurar o Banco de Dados (Recomendado na primeira execução)

Para garantir que a estrutura do banco de dados esteja correta (especialmente para o novo recurso de aprovação de usuários), é **altamente recomendado** que você:

1.  **Delete o arquivo `financas.db`** (se ele já existir na raiz do projeto).
2.  O servidor irá criar um novo banco de dados com a estrutura necessária e o usuário `admin` já aprovado na próxima vez que for executado.

---

### Como Usar o Sistema

#### 1. Iniciar a Aplicação

1.  No terminal, navegue até a pasta raiz do projeto.
2.  Defina as variáveis de ambiente `EMAIL_USER` e `EMAIL_PASS` (conforme item 3 da instalação).
3.  Inicie o servidor com o comando:
    ```bash
    node server.js
    ```
4.  Você verá uma mensagem no terminal: `Servidor rodando em http://localhost:3000`.
5.  Abra seu navegador e acesse a URL **http://localhost:3000**.

#### 2. Primeiro Acesso (Usuário Administrador Padrão)

*   **Usuário:** `admin`
*   **Senha:** `123456`
    *   (Este usuário é criado automaticamente na primeira execução do `server.js` e já vem aprovado. É altamente recomendável alterar a senha assim que possível.)

#### 3. Fluxo de Registro e Aprovação de Novos Usuários (OBRIGATÓRIO)

1.  **Registro:** Novos usuários se registram através da interface "Crie uma aqui" na tela de login.
2.  **Aprovação Pendente:** Após o registro, o novo usuário **não poderá fazer login imediatamente**. Sua conta estará `pendente de aprovação`.
3.  **Notificação ao Administrador:** Um e-mail será enviado para `isaac.systemilc@gmail.com` notificando sobre o novo registro.
4.  **Login do Administrador:** O administrador (`admin` / `123456`) deve fazer login no sistema.
5.  **Aprovação:** No menu lateral, o administrador deve navegar até a página "Gerenciar Usuários" (ou equivalente). Lá, haverá uma seção "Usuários Pendentes de Aprovação" onde ele poderá ver e **aprovar** os novos usuários.
6.  **Acesso Liberado:** Somente após a aprovação pelo administrador, o novo usuário poderá fazer login no sistema.

#### 4. Gerenciamento de Dados

*   **Contas Bancárias:** Adicione suas contas em "Contas Bancárias". Mínimo de uma conta é obrigatório para registrar transações.
*   **Categorias:** Crie categorias (Receita/Despesa) em "Categorias" para classificar suas transações.
*   **Transações:** Registre todas as suas movimentações financeiras em "Transações".
    *   **Campos Obrigatórios:** Descrição, Valor, Tipo (Receita/Despesa), Conta, Data da Transação.
    *   **Multiplicador:** Use para registrar despesas parceladas.
    *   **Confirmar Transação:** Marque as transações como "Confirmadas" para que seus valores sejam considerados nos saldos e gráficos.
*   **Transferência:** Use a página "Transferência" para mover dinheiro entre suas contas.

#### 5. Visualização e Análise

*   **Dashboard:** Acesse o "Dashboard" para ter uma visão geral das suas finanças, com resumos e gráficos. Use os filtros para analisar dados específicos.
*   **Histórico de Transações:** Na página "Transações", visualize o histórico completo e use os filtros para encontrar registros específicos.

---

### Desenvolvimento

Para contribuir ou realizar modificações:

1.  Clone o repositório.
2.  Instale as dependências (`npm install`).
3.  Faça suas modificações no código-fonte.
4.  Reinicie o `node server.js` para aplicar as mudanças.

---
