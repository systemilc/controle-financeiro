import { state } from './state.js';
import { api } from './api.js';
import { elements, render } from './ui.js';
import { getTodayDate } from './utils.js';

const fetchAllData = async () => {
    try {
        // Verifica se o usuário está logado antes de fazer as chamadas
        if (!state.userId || !state.groupId) {
            console.log('Usuário não está logado, pulando busca de dados');
            return;
        }

        const accountsData = await api.fetchAccounts();
        
        if (Array.isArray(accountsData)) {
            state.allAccounts = accountsData;
            render.populateAccountSelect();
            render.renderAccountsList();
            render.populateTransferSelects(); // Popula os selects de transferência
        } else {
            console.error('Erro ao carregar contas:', accountsData.message);
        }

        const transactionsData = await api.fetchTransactions();
        
        if (Array.isArray(transactionsData)) {
            render.transactions(transactionsData);
            render.calculateBalances(transactionsData);
        } else {
            console.error('Erro ao carregar transações:', transactionsData);
            // Não faz logout por erro de transações, apenas loga o erro
        }

    } catch (error) {
        console.error('Erro de rede ao buscar dados:', error);
        
        // Verifica se é um erro de autenticação (401)
        if (error.message && error.message.includes('401')) {
            console.log('Erro de autenticação, fazendo logout');
            logout();
        } else {
            // Para outros erros, apenas mostra uma mensagem mais amigável
            console.log('Erro de conexão, mas continuando...');
        }
    }
    
    // Busca e renderiza usuários (admin vê todos, user vê seus colaboradores)
    if (state.userId) { // Apenas se houver um usuário logado
        try {
            const usersData = await api.fetchGroupUsers(); // Agora fetchGroupUsers vai retornar o correto para admin/user
            if (Array.isArray(usersData)) {
                if (state.userRole === 'admin') {
                    render.renderAdminUsers(usersData); // Renderiza todos os usuários para o admin
                } else if (state.userRole === 'user') {
                    // usersData já conterá apenas os colaboradores do usuário normal (conforme server.js)
                    render.renderGroupUsers(usersData);
                }
            } else {
                console.error('Erro ao carregar usuários:', usersData);
            }
        } catch (usersError) {
            console.error('Erro ao buscar dados de usuários:', usersError);
        }
    }
};

// Função para deletar usuário do sistema (usada por admin e user)
const deleteSystemUser = async (id, username) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário "${username}" (ID: ${id})?`)) return;

    try {
        const success = await api.deleteUser(id);
        if (success) {
            alert('Usuário deletado com sucesso!');
            fetchAllData(); // Atualiza a lista após deletar
        } else {
            alert('Erro ao deletar usuário.');
        }
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        alert('Erro ao deletar usuário.');
    }
};

// Função para preencher e mostrar a modal de edição de usuário
const editUser = async (id) => {
    try {
        // Busca os dados do usuário
        const userData = await api.fetchUserById(id); // Necessário criar esta função em api.js
        if (!userData) {
            alert('Erro ao buscar dados do usuário para edição.');
            return;
        }

        // Preenche o formulário da modal
        elements.editUsernameInput.value = userData.username;
        elements.editWhatsappInput.value = userData.whatsapp || '';
        elements.editInstagramInput.value = userData.instagram || '';
        elements.editEmailInput.value = userData.email || '';
        elements.editConsentLgpdCheckbox.checked = userData.consent_lgpd === 1;

        // Adiciona um campo oculto para armazenar o ID do usuário
        let userIdInput = elements.editUserForm.querySelector('#edit-user-id');
        if (!userIdInput) {
            userIdInput = document.createElement('input');
            userIdInput.type = 'hidden';
            userIdInput.id = 'edit-user-id';
            elements.editUserForm.appendChild(userIdInput);
        }
        userIdInput.value = userData.id;

        // Controla a visibilidade dos campos de papel e grupo para admin
        if (state.userRole === 'admin') {
            elements.editRoleGroup.style.display = 'block';
            elements.editGroupIdGroup.style.display = 'block';
            elements.editRoleSelect.value = userData.role;
            elements.editGroupIdInput.value = userData.group_id;
        } else {
            elements.editRoleGroup.style.display = 'none';
            elements.editGroupIdGroup.style.display = 'none';
        }

        // Exibe a modal
        const editUserModal = new bootstrap.Modal(elements.editUserModal);
        editUserModal.show();
    } catch (error) {
        console.error('Erro ao preparar edição do usuário:', error);
        alert('Erro ao carregar dados do usuário para edição.');
    }
};

// Função para lidar com o envio do formulário de edição de usuário
const handleEditUserSubmit = async (e) => {
    e.preventDefault();

    const userId = elements.editUserForm.querySelector('#edit-user-id').value; // Pega do hidden input
    const username = elements.editUsernameInput.value;
    const whatsapp = elements.editWhatsappInput.value;
    const instagram = elements.editInstagramInput.value;
    const email = elements.editEmailInput.value;
    const consent_lgpd = elements.editConsentLgpdCheckbox.checked;

    const userData = { username, whatsapp, instagram, email, consent_lgpd };

    // Adiciona role e group_id se for admin
    if (state.userRole === 'admin') {
        userData.role = elements.editRoleSelect.value;
        userData.group_id = elements.editGroupIdInput.value;
    }

    try {
        const success = await api.editUser(userId, userData); // Necessário criar esta função em api.js
        if (success) {
            alert('Usuário atualizado com sucesso!');
            const editUserModal = bootstrap.Modal.getInstance(elements.editUserModal);
            editUserModal.hide();
            fetchAllData(); // Atualiza os dados
        } else {
            render.showEditUserError('Erro ao atualizar usuário.');
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        render.showEditUserError(`Erro ao atualizar usuário: ${error.message || 'Erro desconhecido'}`);
    }
};

// Navegação entre páginas
const handleNavigation = (e) => {
    e.preventDefault();
    const link = e.target.closest('.nav-link');
    if (!link) return;
    
    const pageName = link.getAttribute('data-page');
    if (pageName) {
        render.showPage(pageName);
        // Atualiza a URL sem recarregar a página
        history.pushState({ page: pageName }, '', `#${pageName}`);
        // Fecha o menu mobile se estiver aberto
        closeMobileMenu();
    }
};

// Controle do menu lateral
const toggleSidebar = () => {
    render.toggleSidebar();
};

// Controle do menu lateral para mobile
const toggleSidebarMobile = () => {
    elements.sidebar.classList.toggle('mobile-open');
};

// Fechar menu mobile ao clicar em um link
const closeMobileMenu = () => {
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('mobile-open');
    }
};

const handleAccountFormSubmit = async (e) => {
    e.preventDefault();
    const accountName = elements.accountNameInput.value;
    if (!accountName) return;

    const success = await api.createAccount(accountName);
    if (success) {
        elements.accountNameInput.value = '';
        fetchAllData();
    } else {
        alert('Erro ao adicionar conta.');
    }
};

// Função para verificar a força da senha
const checkPasswordStrength = (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;
    if (password.length >= minLength) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;

    let feedback = '';
    let color = '';

    if (password.length === 0) {
        feedback = '';
    } else if (strength <= 2) {
        feedback = 'Senha fraca.';
        color = 'text-danger';
    } else if (strength === 3) {
        feedback = 'Senha moderada.';
        color = 'text-warning';
    } else if (strength >= 4) {
        feedback = 'Senha forte.';
        color = 'text-success';
    }

    elements.passwordStrength.innerHTML = `<span class="${color}">${feedback}</span>`;

    // Validação formal para o formulário
    const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    elements.registerPasswordInput.setCustomValidity(isValid ? '' : 'A senha deve ter no mínimo 6 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais.');
    return isValid;
};

// Função para verificar a força da senha
const getPasswordStrength = (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);

    let strength = 0;
    if (password.length >= minLength) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;
    return { score: strength, password: password };
};

// Função para exibir a força da senha no HTML
const getPasswordStrengthHTML = (strength) => {
    let feedback = '';
    let color = '';

    if (strength.password.length === 0) {
        return '';
    } else if (strength.score <= 2) {
        feedback = 'Senha fraca.';
        color = 'text-danger';
    } else if (strength.score === 3) {
        feedback = 'Senha moderada.';
        color = 'text-warning';
    } else if (strength.score >= 4) {
        feedback = 'Senha forte.';
        color = 'text-success';
    }
    return `<span class="${color}">${feedback}</span>`;
};

// Função para lidar com o envio do formulário de alteração de senha
const handleChangePasswordSubmit = async (e) => {
    console.log('handleChangePasswordSubmit foi chamado!');
    e.preventDefault();
    render.hideChangePasswordError();

    const currentPassword = elements.currentPasswordInput.value;
    const newPassword = elements.newPasswordInput.value;
    const confirmNewPassword = elements.confirmNewPasswordInput.value;

    console.log('Senhas lidas:', {
        currentPassword,
        newPassword,
        confirmNewPassword
    });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        render.showChangePasswordError('Por favor, preencha todos os campos.');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        elements.confirmNewPasswordInput.setCustomValidity('As novas senhas não coincidem.');
        // elements.confirmNewPasswordInput.reportValidity(); // Removido para evitar popup indesejado
        render.showChangePasswordError('As novas senhas não coincidem.');
        return;
    } else {
        elements.confirmNewPasswordInput.setCustomValidity('');
    }

    const newPasswordStrength = getPasswordStrength(newPassword);
    if (newPasswordStrength.score < 3) {
        elements.newPasswordInput.setCustomValidity('A nova senha é muito fraca.');
        // elements.newPasswordInput.reportValidity(); // Removido para evitar popup indesejado
        render.showChangePasswordError('A nova senha é muito fraca.');
        return;
    } else {
        elements.newPasswordInput.setCustomValidity('');
    }

    try {
        const success = await api.changePassword(state.userId, currentPassword, newPassword); // Necessário criar esta função em api.js
        if (success) {
            alert('Senha alterada com sucesso! Você será desconectado.');
            const changePasswordModal = bootstrap.Modal.getInstance(elements.changePasswordModal);
            changePasswordModal.hide();
            logout();
        } else {
            render.showChangePasswordError('Erro ao alterar senha. Verifique a senha atual e tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        render.showChangePasswordError(`Erro ao alterar senha: ${error.message || 'Erro desconhecido'}`);
    }
};

// Função para lidar com o envio do formulário de registro
const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    const username = elements.registerUsernameInput.value;
    const password = elements.registerPasswordInput.value;
    const confirmPassword = elements.registerConfirmPasswordInput.value;
    const whatsapp = elements.registerWhatsappInput.value;
    const instagram = elements.registerInstagramInput.value;
    const email = elements.registerEmailInput.value;
    const consentLGPD = elements.consentLgpdCheckbox.checked;

    if (!username || !password || !email) {
        render.showLoginError('Por favor, preencha os campos obrigatórios.');
        return;
    }

    if (!checkPasswordStrength(password)) {
        render.showLoginError('A senha não atende aos requisitos de segurança.');
        return;
    }

    if (password !== confirmPassword) {
        render.showLoginError('A senha e a confirmação de senha não coincidem.');
        return;
    }

    if (!consentLGPD) {
        elements.consentLgpdCheckbox.setCustomValidity('Você deve concordar com os termos da LGPD.');
        elements.consentLgpdCheckbox.reportValidity();
        render.showLoginError('Você deve concordar com os termos da LGPD para prosseguir.');
        return;
    } else {
        elements.consentLgpdCheckbox.setCustomValidity('');
    }

    try {
        const success = await api.registerUser(username, password, whatsapp, instagram, email, consentLGPD);
        if (success) {
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            render.showLoginScreen();
        } else {
            render.showLoginError('Erro ao cadastrar usuário. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        render.showLoginError('Erro ao realizar cadastro. Tente novamente.');
    }
};

const handleTransferSubmit = async (e) => {
    e.preventDefault();
    
    const fromAccountId = elements.fromAccountSelect.value;
    const toAccountId = elements.toAccountSelect.value;
    const amount = parseFloat(elements.transferAmountInput.value);
    const description = elements.transferDescriptionInput.value;
    
    if (!fromAccountId || !toAccountId || !amount || !description) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (fromAccountId === toAccountId) {
        alert('Não é possível transferir para a mesma conta.');
        return;
    }
    
    // Busca o saldo atual da conta de origem
    const fromAccount = state.allAccounts.find(acc => acc.id == fromAccountId);
    if (!fromAccount) {
        alert('Conta de origem não encontrada.');
        return;
    }
    
    // Calcula o saldo disponível (apenas transações confirmadas)
    let availableBalance = 0;
    try {
        const transactions = await api.fetchTransactions();
        if (Array.isArray(transactions)) {
            transactions.forEach(transaction => {
                if (transaction.account_id == fromAccountId && transaction.is_confirmed) {
                    if (transaction.type === 'income') {
                        availableBalance += transaction.amount;
                    } else {
                        availableBalance -= transaction.amount;
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao buscar transações para cálculo de saldo:', error);
        alert('Erro ao verificar saldo da conta. Tente novamente.');
        return;
    }
    
    // Validações de segurança
    if (availableBalance <= 0) {
        alert('A conta de origem não possui saldo positivo para transferência.');
        return;
    }
    
    if (amount > availableBalance) {
        alert(`Valor da transferência (R$ ${amount.toFixed(2)}) é maior que o saldo disponível (R$ ${availableBalance.toFixed(2)}).`);
        return;
    }
    
    if (amount <= 0) {
        alert('O valor da transferência deve ser maior que zero.');
        return;
    }
    
    // Confirma a transferência
    if (!confirm(`Confirmar transferência de R$ ${amount.toFixed(2)} da conta "${fromAccount.name}" para a conta de destino?`)) {
        return;
    }
    
    try {
        // Cria duas transações: uma saída da conta de origem e uma entrada na conta de destino
        const outTransaction = {
            description: `Transferência: ${description}`,
            amount: amount,
            type: 'expense',
            account_id: fromAccountId,
            due_date: new Date().toISOString().split('T')[0]
        };
        
        const inTransaction = {
            description: `Transferência recebida: ${description}`,
            amount: amount,
            type: 'income',
            account_id: toAccountId,
            due_date: new Date().toISOString().split('T')[0]
        };
        
        // Cria as transações
        const outSuccess = await api.createTransaction(outTransaction);
        const inSuccess = await api.createTransaction(inTransaction);
        
        if (outSuccess && inSuccess) {
            // Confirma automaticamente as transações de transferência
            // Busca as transações criadas para confirmá-las
            const recentTransactions = await api.fetchTransactions();
            if (Array.isArray(recentTransactions)) {
                const outTrans = recentTransactions.find(t => 
                    t.description === outTransaction.description && 
                    t.account_id == fromAccountId && 
                    t.amount === amount &&
                    !t.is_confirmed
                );
                const inTrans = recentTransactions.find(t => 
                    t.description === inTransaction.description && 
                    t.account_id == toAccountId && 
                    t.amount === amount &&
                    !t.is_confirmed
                );
                
                if (outTrans) await api.confirmTransaction(outTrans.id);
                if (inTrans) await api.confirmTransaction(inTrans.id);
            }
            
            alert('Transferência realizada com sucesso!');
            
            // Limpa o formulário
            render.resetTransferForm();
            
            // Atualiza os dados
            fetchAllData();
        } else {
            alert('Erro ao criar transações de transferência. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro na transferência:', error);
        alert('Erro ao realizar transferência. Tente novamente.');
    }
};

const handleTransactionFormSubmit = async (e) => {
    e.preventDefault();
    const transactionId = elements.transactionIdInput.value;
    const description = elements.descriptionInput.value;
    const amount = parseFloat(elements.amountInput.value);
    const type = elements.typeInput.value;
    const account_id = elements.accountSelect.value;
    const due_date = elements.transactionDateInput.value;

    if (!description || !amount || !account_id || !due_date) return;

    const transactionData = { description, amount, type, account_id, due_date };

    if (transactionId) {
        const success = await api.editTransaction(transactionId, transactionData);
        if (success) {
            render.resetForm();
            fetchAllData();
        } else {
            alert('Erro ao atualizar transação.');
        }
    } else {
        const success = await api.createTransaction(transactionData);
        if (success) {
            render.resetForm();
            fetchAllData();
        } else {
            alert('Erro ao adicionar transação.');
        }
    }
};

const editTransaction = async (id) => {
    const transaction = await api.fetchSingleTransaction(id);
    if (transaction) {
        elements.descriptionInput.value = transaction.description;
        elements.amountInput.value = transaction.amount;
        elements.typeInput.value = transaction.type;
        elements.accountSelect.value = transaction.account_id;
        elements.transactionIdInput.value = transaction.id;
        const displayDate = transaction.due_date ? transaction.due_date : getTodayDate();
        elements.transactionDateInput.value = displayDate;
        elements.transactionDateDisplayInput.value = formatDateForDisplay(displayDate);
        elements.formTitle.textContent = 'Editar Transação';
        elements.submitButton.textContent = 'Atualizar';
        
        // Navega para a página de transações
        render.showPage('transacoes');
    } else {
        alert('Erro ao buscar transação para edição.');
    }
};

const deleteTransaction = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;
    const success = await api.deleteTransaction(id);
    if (success) {
        fetchAllData();
    } else {
        alert('Erro ao deletar transação.');
    }
};

const confirmTransaction = async (id) => {
    const success = await api.confirmTransaction(id);
    if (success) {
        fetchAllData();
    } else {
        alert('Erro ao confirmar transação.');
    }
};

const deleteAccount = async (id, name) => {
    if (state.allAccounts.length <= 1) {
        alert('Não é possível deletar a única conta existente.');
        return;
    }

    if (!confirm(`Tem certeza que deseja deletar a conta "${name}"? Todas as transações serão transferidas para outra conta.`)) {
        return;
    }

    const otherAccounts = state.allAccounts.filter(acc => acc.id != id);
    let accountPromptList = "Para qual conta você gostaria de transferir as transações de \"" + name + "\"? \n\nContas disponíveis:\n";
    otherAccounts.forEach(acc => {
        accountPromptList += `ID ${acc.id} - ${acc.name}\n`;
    });
    accountPromptList += "\nDigite o ID ou o NOME da conta.";
    const input = prompt(accountPromptList);
    if (!input) return;

    let newAccount = null;
    const parsedInput = parseInt(input);
    if (!isNaN(parsedInput)) {
        newAccount = otherAccounts.find(acc => acc.id === parsedInput);
    } else {
        newAccount = otherAccounts.find(acc => acc.name.toLowerCase() === input.toLowerCase());
    }
    
    if (!newAccount) {
        alert('ID ou nome de conta inválido. Operação cancelada.');
        return;
    }

    const response = await api.deleteAccount(id, newAccount.id, name);
    if (response.ok) {
        fetchAllData();
        alert('Conta deletada e transações transferidas com sucesso.');
    } else {
        const error = await response.json();
        alert(`Erro ao deletar conta: ${error.message}`);
    }
};

const handleAddUserFormSubmit = async (e) => {
    e.preventDefault();
    const username = elements.newUsernameInput.value;
    const password = elements.newPasswordInput.value;
    const whatsapp = elements.newWhatsappInput.value;
    const instagram = elements.newInstagramInput.value;
    const email = elements.newEmailInput.value;
    if (!username || !password) return;
    
    const response = await api.addUserToGroup(username, password, whatsapp, instagram, email);
    if (response.ok) {
        elements.newUsernameInput.value = '';
        elements.newPasswordInput.value = '';
        elements.newWhatsappInput.value = '';
        elements.newInstagramInput.value = '';
        elements.newEmailInput.value = '';
        fetchAllData();
        alert('Usuário adicionado ao grupo com sucesso!');
    } else {
        const error = await response.json();
        alert(`Erro ao adicionar usuário: ${error.message}`);
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;

    console.log('--- Tentando fazer login ---');
    console.log('Username enviado:', username);
    console.log('Password enviado:', password);

    let originalText = ''; // Declaração de originalText aqui

    try {
        // Mostra estado de loading
        const submitButton = e.target.querySelector('button[type="submit"]');
        originalText = submitButton.textContent; // Atribuição de valor
        submitButton.textContent = 'Entrando...';
        submitButton.disabled = true;

        const data = await api.login(username, password);

        console.log('Resposta do servidor:', data);

        if (data.userId) {
            state.userId = data.userId;
            state.groupId = data.groupId;
            state.username = username;
            state.userRole = data.userRole; // Salva o papel do usuário no state
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('groupId', data.groupId);
            localStorage.setItem('username', username);
            localStorage.setItem('userRole', data.userRole); // Salva o papel do usuário no localStorage
            
            render.showMainApp();
            render.resetForm();
            render.hideLoginError();
            
            // Busca os dados após login bem-sucedido
            await fetchAllData();
        } else {
            render.showLoginError(data.message || 'Usuário ou senha incorretos. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro na requisição de login:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            render.showLoginError('Erro de conexão com o servidor. Verifique se o servidor está rodando.');
        } else {
            render.showLoginError('Erro de conexão. Tente novamente.');
        }
    } finally {
        // Restaura o botão
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.textContent = originalText; 
        submitButton.disabled = false;
    }
};

const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('groupId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole'); // Limpa o papel do usuário no localStorage
    state.userId = null;
    state.groupId = null;
    state.username = 'Admin';
    state.currentPage = 'dashboard';
    state.accountBalances = {}; // Limpa os saldos das contas
    render.showLoginScreen();
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    render.hideLoginError();
    render.resetForm();
    // Verifica se os elementos existem antes de tentar manipulá-los
    if (elements.accountsSummaryList) elements.accountsSummaryList.innerHTML = '';
    if (elements.transactionList) elements.transactionList.innerHTML = '';
    if (elements.totalIncomeEl) elements.totalIncomeEl.textContent = 'R$ 0,00';
    if (elements.totalExpenseEl) elements.totalExpenseEl.textContent = 'R$ 0,00';
    if (elements.balanceEl) elements.balanceEl.textContent = 'R$ 0,00';
};

// Função para formatar data para exibição
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

// Função para lidar com navegação do browser (voltar/avançar)
const handlePopState = (event) => {
    if (event.state && event.state.page) {
        render.showPage(event.state.page);
    }
};

const init = () => {
    const savedUserId = localStorage.getItem('userId');
    const savedGroupId = localStorage.getItem('groupId');
    const savedUsername = localStorage.getItem('username');
    const savedUserRole = localStorage.getItem('userRole'); // Busca o papel do usuário

    if (savedUserId && savedGroupId) {
        state.userId = savedUserId;
        state.groupId = savedGroupId;
        state.username = savedUsername || 'Admin';
        state.userRole = savedUserRole; // Define o papel do usuário no state
        render.showMainApp();
        render.resetForm();
        fetchAllData();
        
        // Controla a visibilidade do link "Gerenciar Usuários"
        if (state.userRole === 'admin') {
            elements.adminUsersLinkItem.classList.remove('hidden');
        } else {
            elements.adminUsersLinkItem.classList.add('hidden');
        }

        // Controla a visibilidade do formulário "Adicionar ao Grupo" na página de usuários
        if (state.userRole === 'admin' || state.userRole === 'user') {
            elements.addUserForm.classList.remove('hidden');
        } else {
            elements.addUserForm.classList.add('hidden');
        }

        // Verifica se há hash na URL para navegar para a página correta
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'contas', 'transacoes', 'usuarios', 'transferencia', 'register', 'admin-users'].includes(hash)) {
            render.showPage(hash);
        } else {
            render.showPage('dashboard');
        }
    }
};

// Listeners de eventos
elements.loginForm.addEventListener('submit', handleLogin);
elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
elements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);
elements.transferForm.addEventListener('submit', handleTransferSubmit); // Novo listener para transferência
elements.logoutButton.addEventListener('click', logout);
elements.addUserForm.addEventListener('submit', handleAddUserFormSubmit);

// Event listeners para o formulário de registro
elements.showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    render.showRegisterScreen();
});

elements.showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    render.showLoginScreen();
});

elements.registerForm.addEventListener('submit', handleRegistrationSubmit);
elements.registerPasswordInput.addEventListener('input', (e) => checkPasswordStrength(e.target.value));
elements.registerConfirmPasswordInput.addEventListener('input', () => {
    const password = elements.registerPasswordInput.value;
    const confirmPassword = elements.registerConfirmPasswordInput.value;
    if (password !== confirmPassword) {
        elements.registerConfirmPasswordInput.setCustomValidity('As senhas não coincidem.');
        render.showRegisterError('As senhas não coincidem.'); // Exibe o erro
    } else {
        elements.registerConfirmPasswordInput.setCustomValidity('');
        render.hideRegisterError(); // Esconde o erro
    }
});
elements.consentLgpdCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        e.target.setCustomValidity('');
    } else {
        e.target.setCustomValidity('Você deve concordar com os termos da LGPD.');
    }
});

// Event listeners para transferência
elements.fromAccountSelect.addEventListener('change', () => {
    // Atualiza o formulário quando a conta de origem muda
    render.updateTransferForm();
});

elements.toAccountSelect.addEventListener('change', () => {
    // Atualiza o formulário quando a conta de destino muda
    render.updateTransferForm();
});

elements.transferAmountInput.addEventListener('input', () => {
    // Valida o valor em tempo real
    const amount = parseFloat(elements.transferAmountInput.value);
    const fromAccountId = elements.fromAccountSelect.value;
    
    if (fromAccountId && state.accountBalances && state.accountBalances[fromAccountId]) {
        const maxAmount = Math.max(0, state.accountBalances[fromAccountId].balance);
        
        if (amount > maxAmount) {
            elements.transferAmountInput.setCustomValidity(`Valor máximo: R$ ${maxAmount.toFixed(2)}`);
        } else {
            elements.transferAmountInput.setCustomValidity('');
        }
    }
});

// Event listeners para a página de administração de usuários
elements.adminUsersList.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-admin-user-button')) {
        const id = e.target.closest('.delete-admin-user-button').dataset.id;
        const username = e.target.closest('.delete-admin-user-button').dataset.username;
        deleteSystemUser(id, username); // Usar a nova função
    } else if (e.target.closest('.edit-admin-user-button')) {
        const id = e.target.closest('.edit-admin-user-button').dataset.id;
        editUser(id);
    }
});

// Event listeners para a página de usuários (para usuários normais)
elements.groupUsersList.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-collaborator-button')) {
        const id = e.target.closest('.delete-collaborator-button').dataset.id;
        const username = e.target.closest('.delete-collaborator-button').dataset.username;
        deleteSystemUser(id, username); // Usar a nova função
    } else if (e.target.closest('.edit-collaborator-button')) {
        const id = e.target.closest('.edit-collaborator-button').dataset.id;
        editUser(id);
    }
});

// Event listener para o formulário de edição de usuário
elements.editUserForm.addEventListener('submit', handleEditUserSubmit);
elements.changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
console.log('Event listener para changePasswordForm adicionado.', elements.changePasswordForm);

// Event listeners para validação de senha do modal de alteração de senha
if (elements.newPasswordInput) {
    elements.newPasswordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = getPasswordStrength(password);
        if (elements.newPasswordStrength) elements.newPasswordStrength.innerHTML = getPasswordStrengthHTML(strength);
        
        if (strength.score < 3) {
            e.target.setCustomValidity('A nova senha é muito fraca.');
        } else {
            e.target.setCustomValidity('');
        }
        // Dispara o evento input no campo de confirmação para revalidar a correspondência
        if (elements.confirmNewPasswordInput) {
            elements.confirmNewPasswordInput.dispatchEvent(new Event('input'));
        }
    });
}

if (elements.confirmNewPasswordInput && elements.newPasswordInput) {
    elements.confirmNewPasswordInput.addEventListener('input', (e) => {
        if (elements.newPasswordInput.value !== e.target.value) {
            e.target.setCustomValidity('As senhas não coincidem.');
        } else {
            e.target.setCustomValidity('');
        }
    });
}

// Navegação do menu lateral
elements.sidebar.addEventListener('click', handleNavigation);

// Toggle do menu lateral
elements.sidebarToggle.addEventListener('click', toggleSidebar);

// Toggle do menu lateral para mobile
elements.sidebarToggleMobile.addEventListener('click', toggleSidebarMobile);

// Fechar menu mobile ao clicar fora dele
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !elements.sidebar.contains(e.target) && 
        !elements.sidebarToggleMobile.contains(e.target)) {
        elements.sidebar.classList.remove('mobile-open');
    }
});

// Navegação do browser
window.addEventListener('popstate', handlePopState);

// Eventos das transações
elements.transactionList.addEventListener('click', (e) => {
    if (e.target.closest('.edit-button')) {
        const id = e.target.closest('.edit-button').dataset.id;
        editTransaction(id);
    }
    if (e.target.closest('.delete-button')) {
        const id = e.target.closest('.delete-button').dataset.id;
        deleteTransaction(id);
    }
    if (e.target.closest('.confirm-button')) {
        const id = e.target.closest('.confirm-button').dataset.id;
        confirmTransaction(id);
    }
});

// Eventos das contas
elements.accountsList.addEventListener('click', (e) => {
    if (e.target.closest('.delete-account-button')) {
        const id = e.target.closest('.delete-account-button').dataset.id;
        const name = e.target.closest('.delete-account-button').dataset.name;
        deleteAccount(id, name);
    }
});

// Eventos do calendário
elements.transactionDateInput.addEventListener('change', () => {
    elements.transactionDateDisplayInput.value = formatDateForDisplay(elements.transactionDateInput.value);
});

elements.calendarIconBtn.addEventListener('click', () => {
    elements.transactionDateInput.showPicker();
});

// Event listener para o modal de alteração de senha, para resetar o formulário ao fechar
if (elements.changePasswordModal) {
    elements.changePasswordModal.addEventListener('hidden.bs.modal', render.resetChangePasswordForm);
}

// Inicialização
init();