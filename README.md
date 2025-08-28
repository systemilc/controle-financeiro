Meu Sistema de Controle Financeiro Pessoal
Este é um sistema de gerenciamento de finanças pessoais desenvolvido com HTML, CSS e JavaScript no front-end e Node.js no back-end. Ele foi projetado para ser simples, intuitivo e com todas as funcionalidades essenciais para o controle de receitas e despesas.

Funcionalidades
O sistema possui as seguintes características e recursos:

Login Protegido: Acesso restrito por senha, com criptografia no back-end para maior segurança.

Controle de Contas: Crie, visualize e gerencie múltiplas contas para organizar suas finanças (ex: "Conta Pessoal", "Conta da Esposa").

Transações Futuras: Lance receitas e despesas que só afetam o saldo após serem confirmadas por um botão.

Histórico de Transações: Visualize todas as movimentações, com a data e hora em que foram registradas.

Edição e Deleção: Edite ou exclua transações a qualquer momento.

Integridade dos Dados: Ao deletar uma conta, o sistema solicita para qual conta as transações pendentes devem ser transferidas, garantindo que nenhum dado seja perdido.

Rastreabilidade: Mesmo após a deleção de uma conta, o histórico de transações mantém a informação da conta original, indicando que ela foi excluída.

Resumos Financeiros: Acompanhe o saldo consolidado (total) e o saldo individual de cada conta.

Interface Responsiva: O layout foi construído com Bootstrap, garantindo que o sistema seja visualmente agradável e funcional em qualquer dispositivo ou tamanho de tela.

Ícones Visuais: Utiliza o Font Awesome para substituir botões de texto por ícones (lápis para editar, X para deletar, e um check para confirmar), melhorando a experiência do usuário.

Tecnologias Utilizadas
Front-end:

HTML5: Estrutura da página.

CSS3: Estilização customizada.

JavaScript (ES6+): Lógica da aplicação.

Bootstrap 5: Framework para layout e componentes responsivos.

Font Awesome: Biblioteca de ícones.

Back-end:

Node.js: Ambiente de execução do servidor.

Express.js: Framework para criação de rotas da API.

SQLite3: Banco de dados leve e fácil de usar para armazenamento de dados.

bcryptjs: Biblioteca para criptografar senhas.

Instalação e Configuração
Siga estes passos para ter o sistema rodando em sua máquina local.

Pré-requisitos: Certifique-se de ter o Node.js instalado em seu computador.

Baixar os arquivos: Copie todos os arquivos do projeto para uma pasta no seu computador. A estrutura deve ser a seguinte:

/meu-projeto
|-- public/
|    |-- index.html
|    |-- style.css
|    |-- script.js
|-- server.js
|-- package.json
|-- package-lock.json
Instalar dependências: Abra o terminal na pasta raiz do seu projeto e execute o comando:

Bash

npm install
Configurar o banco de dados: Para garantir que a estrutura do banco de dados esteja correta, delete o arquivo financas.db (se ele existir). O servidor irá criar um novo com todas as colunas necessárias.

Iniciar o servidor: No mesmo terminal, execute o comando:

Bash

node server.js
Você verá a mensagem Servidor rodando em http://localhost:3000 no terminal.

Como Usar
Abra seu navegador e acesse a URL http://localhost:3000.

A tela de login será exibida. A senha padrão para o usuário admin é sua-senha-aqui.

Após o login, você precisará adicionar uma conta antes de poder lançar transações.

Use o formulário "Adicionar Transação" para registrar suas movimentações. Lembre-se de clicar em "Confirmar" para que a transação seja contabilizada no saldo.