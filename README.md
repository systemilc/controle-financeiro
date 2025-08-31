
-----

# Meu Sistema de Controle Financeiro Pessoal

Este é um sistema simples para gerenciar finanças pessoais, desenvolvido com foco na usabilidade e segurança para uso individual ou familiar. A aplicação é construída com uma arquitetura **full-stack**, garantindo que os dados sejam armazenados de forma persistente e possam ser acessados de diferentes dispositivos.

-----

### Funcionalidades

O sistema conta com as seguintes funcionalidades:

  - **Login Seguro:** Autenticação por senha com criptografia no back-end.
  - **Controle Multi-Contas:** Gerencie múltiplas contas (ex: "Conta Pessoal", "Conta da Esposa"), com resumos individuais e consolidados.
  - **Transações Condicionais:** Adicione transações futuras que só afetam o saldo após serem **confirmadas**.
  - **Histórico Completo:** Visualize todas as movimentações com data, hora e a qual conta pertencem.
  - **Edição e Deleção:** Gerencie transações e contas de forma flexível. Ao deletar uma conta, suas transações são transferidas para outra conta.
  - **Rastreabilidade:** Mantenha um histórico da conta original de uma transação mesmo após ela ser deletada.
  - **Layout Responsivo:** O design foi feito com **Bootstrap 5**, garantindo uma interface moderna e adaptada a qualquer tamanho de tela.
  - **Ícones Visuais:** Utiliza **Font Awesome** para ícones intuitivos de edição, deleção e confirmação.

-----

### Tecnologias

**Front-end:**

  - HTML5, CSS3, JavaScript (ES6+)
  - Bootstrap 5 (para layout responsivo)
  - Font Awesome (para ícones)

**Back-end:**

  - Node.js (ambiente de execução)
  - Express.js (para a API REST)
  - SQLite3 (banco de dados leve)
  - bcrypt.js (para criptografia de senhas)

-----

### Instalação

Siga estes passos para ter o projeto funcionando em seu ambiente local.

#### Pré-requisitos

Certifique-se de que o **Node.js** e o **npm** estejam instalados em seu computador.

#### 1\. Estrutura de Pastas

Organize os arquivos do seu projeto na seguinte estrutura:

```
/meu-projeto
|-- public/
|    |-- index.html
|    |-- style.css
|    |-- script.js
|-- server.js
|-- package.json
|---- financas.db (será criado após a primeira execução)
```

#### 2\. Instalar Dependências

Abra o terminal na pasta raiz do seu projeto e execute o comando para instalar todas as bibliotecas necessárias:

```bash
npm install express bcryptjs sqlite3
```

#### 3\. Configurar o Banco de Dados

Para garantir que a estrutura do banco de dados esteja correta, **delete o arquivo `financas.db`** (se ele já existir). O servidor irá criar um novo com a estrutura necessária na próxima vez que for executado.

-----

### Como Rodar a Aplicação

1.  No terminal, certifique-se de estar na pasta raiz do projeto.
2.  Inicie o servidor com o comando:
    ```bash
    node server.js
    ```
3.  Você verá uma mensagem no terminal:
    ```
    Servidor rodando em http://localhost:3000
    ```
4.  Abra seu navegador e acesse a URL **http://localhost:3000** para utilizar o sistema.

O usuário padrão é `admin` e a senha é `sua-senha-aqui`. Recomendamos que você a altere no arquivo `server.js` antes de usar o sistema em um ambiente de produção.
