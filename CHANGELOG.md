# Changelog
Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2024-07-29

### Adicionado
-   **Funcionalidade de Registro de Usuários:**
    -   Página de registro com campos para nome de usuário, senha (com validação de segurança), WhatsApp, Instagram e Email.
    -   Checkbox obrigatório para consentimento da LGPD com link para modal de termos.
    -   Validação de senha em tempo real (força da senha e confirmação).
    -   Endpoint `POST /api/register` no backend para criação de novos usuários com role 'user' e `group_id` baseado no seu próprio ID.
-   **Gerenciamento de Usuários (Admin):**
    -   Página "Gerenciar Usuários" visível apenas para o `admin` (ID 1).
    -   Tabela listando todos os usuários do sistema com ID, nome, email, redes sociais, consentimento LGPD, grupo e papel.
    -   Funcionalidade de deletar usuários (exceto o próprio admin) via botão na tabela.
    -   Funcionalidade de editar usuários via modal, permitindo ao admin alterar username, redes sociais, LGPD, role e group_id de qualquer usuário.
-   **Gerenciamento de Colaboradores (Usuários Normais):**
    -   Página "Usuários" (para role 'user') que lista apenas os colaboradores do seu próprio grupo.
    -   Funcionalidade de adicionar novos colaboradores ao seu grupo, com campos para nome de usuário, senha e redes sociais. O novo usuário recebe o papel 'collaborator' e o `group_id` do usuário que o criou.
    -   Funcionalidade de deletar colaboradores do seu grupo (exceto a si mesmo).
    -   Funcionalidade de editar colaboradores via modal, permitindo ao usuário com role 'user' alterar os dados de seus colaboradores.
-   **Autenticação e Autorização:**
    -   Implementação de roles (`admin`, `user`, `collaborator`) e `group_id` para controle de acesso.
    -   Middleware `authenticate` e `authorizeRole` no `server.js` para proteger rotas da API.
    -   Persistência de `userId`, `groupId`, `username` e `userRole` no `localStorage` para manter o estado de login.
    -   Validações robustas no backend para criação e edição de usuários.
-   **Recursos de UI/UX:**
    -   Melhoria no feedback visual para validação de senha.
    -   Limpeza de `localStorage` ao fazer logout para remover resquícios de dados do usuário.
    -   Inclusão de campos de redes sociais no formulário de adicionar colaborador.

### Alterado
-   **Arquitetura SPA:**
    -   Reversão da separação da funcionalidade de transferência para uma página `transferencia.html` externa, reintegrando-a ao `index.html` como uma SPA para manter o menu lateral funcionando.
-   **Endpoints da API:**
    -   Endpoint `PUT /api/users/:id` refatorado para uma lógica de autorização mais síncrona e robusta, permitindo edição por admin (qualquer usuário) e por 'user' (seus próprios dados ou colaboradores do grupo).
    -   Endpoint `GET /api/users/list` unificado para retornar todos os usuários para admin e apenas colaboradores para user.
-   **UI de Edição de Usuário:**
    -   Remoção do campo de `ID` da modal de edição de usuário, exibindo-o apenas como texto estático.
    -   Lógica de preenchimento e submissão da modal de edição de usuário (`editUser`, `handleEditUserSubmit` em `main.js`) ajustada para não depender de um input oculto para o ID.
-   **Inicialização do Admin:**
    -   Ajuste na criação do usuário 'admin' no `server.js` para garantir que ele seja inserido diretamente com `role = 'admin'` e `group_id = 1`.
-   **Visibilidade de Formulários:**
    -   O formulário "Adicionar ao Grupo" (`add-user-form`) agora é ocultado para usuários com o papel 'collaborator' e visível para 'admin' e 'user'.

### Removido
-   Arquivos `public/transferencia.html` e `public/js/transferencia.js`.
-   Arquivos `public/administracao.html` e `public/js/admin.js`.
-   Importação desnecessária de Bootstrap em `public/js/main.js` que causava `TypeError`.
