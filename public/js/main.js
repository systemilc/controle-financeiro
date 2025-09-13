import { state } from './state.js';
import { api } from './api.js';
import { elements, render } from './ui.js';
import { getTodayDate, addMonthsToDate } from './utils.js';

const fetchAllData = async () => {
    try {
        // Verifica se o usuário está logado antes de fazer as chamadas
        if (!state.userId || !state.groupId) {
            console.log('Usuário não está logado, pulando busca de dados');
            return;
        }

        const accountsData = await api.fetchAccounts();
        const categoriesData = await api.fetchCategories(); // Busca as categorias
        const paymentTypesData = await api.fetchPaymentTypes(); // Busca os tipos de pagamento
        
        if (Array.isArray(accountsData)) {
            state.allAccounts = accountsData;
            render.populateAccountSelect();
            render.renderAccountsList();
            render.populateTransferSelects(); // Popula os selects de transferência
        } else {
            console.error('Erro ao carregar contas:', accountsData.message);
        }

        if (Array.isArray(categoriesData)) {
            state.allCategories = categoriesData; // Armazena as categorias no estado
            render.populateCategorySelect(state.allCategories, elements.typeInput.value); // Popula o select de categorias no formulário de transação
            render.renderCategoriesList(state.allCategories); // Renderiza a lista de categorias na página de categorias
        } else {
            console.error('Erro ao carregar categorias:', categoriesData.message);
        }

        if (Array.isArray(paymentTypesData)) {
            state.allPaymentTypes = paymentTypesData; // Armazena os tipos de pagamento no estado
            render.populatePaymentTypeSelect(state.allPaymentTypes, elements.typeInput.value); // Popula o select de tipos de pagamento no formulário de transação
            render.renderPaymentTypesList(state.allPaymentTypes); // Renderiza a lista de tipos de pagamento na página de tipos de pagamento
        } else {
            console.error('Erro ao carregar tipos de pagamento:', paymentTypesData.message);
        }

        // Se estiver na página do dashboard, popular os filtros do dashboard após carregar as contas e categorias
        if (state.currentPage === 'dashboard') {
            render.populateDashboardFilters();
        }

        // Coleta os parâmetros de filtro
        let filters = {};
        if (state.currentPage === 'dashboard') {
            filters = collectDashboardFilters();
            console.log('Dashboard Filters collected:', filters);
        } else {
            filters = collectTransactionFilters();
            console.log('Transaction Filters collected:', filters);
        }
        
        const transactionsData = await api.fetchTransactions(filters);
        
        if (Array.isArray(transactionsData)) {
            render.transactions(transactionsData);
            render.calculateBalances(transactionsData);

            // Renderiza os gráficos se estiver na página do dashboard
            if (state.currentPage === 'dashboard') {
                // Gráfico de pizza por categoria ou tipo
                const filterBy = elements.dashboardFilterTransactionType.value ? 'type' : 'category';
                render.renderPieChart(transactionsData, filterBy);
                render.renderBarChart(transactionsData); // Gráfico de barras
            }

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
                        // Adiciona chamada para buscar e renderizar usuários pendentes
                        const pendingUsersData = await api.fetchPendingUsers();
                        if (Array.isArray(pendingUsersData)) {
                            render.renderPendingUsers(pendingUsersData);
                        } else {
                            console.error('Erro ao carregar usuários pendentes:', pendingUsersData);
                        }
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
        
        // Busca e renderiza produtos (atualização automática após unificação)
        try {
            const productsData = await api.getAllProducts();
            if (Array.isArray(productsData)) {
                state.allProducts = productsData;
                render.renderProductsList(productsData);
                console.log('📦 Produtos atualizados na interface:', productsData.length);
            } else {
                console.error('Erro ao carregar produtos:', productsData);
            }
        } catch (productsError) {
            console.error('Erro ao buscar dados de produtos:', productsError);
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

        // Se for uma página de usuários ou dashboard, recarrega os dados
        if (pageName === 'usuarios' || pageName === 'admin-users' || pageName === 'dashboard') {
            fetchAllData();
        }
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
    const newPassword = elements.changePasswordNewPasswordInput.value; // Atualizado
    const confirmNewPassword = elements.changePasswordConfirmNewPasswordInput.value; // Atualizado

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
        elements.changePasswordConfirmNewPasswordInput.setCustomValidity('As novas senhas não coincidem.'); // Atualizado
        // elements.confirmNewPasswordInput.reportValidity(); // Removido para evitar popup indesejado
        render.showChangePasswordError('As novas senhas não coincidem.');
        return;
    } else {
        elements.changePasswordConfirmNewPasswordInput.setCustomValidity(''); // Atualizado
    }

    const newPasswordStrength = getPasswordStrength(newPassword);
    if (newPasswordStrength.score < 3) {
        elements.changePasswordNewPasswordInput.setCustomValidity('A nova senha é muito fraca.'); // Atualizado
        // elements.newPasswordInput.reportValidity(); // Removido para evitar popup indesejado
        render.showChangePasswordError('A nova senha é muito fraca.');
        return;
    } else {
        elements.changePasswordNewPasswordInput.setCustomValidity(''); // Atualizado
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
        const success = await api.registerUser(username, password, whatsapp, instagram, email, consentLGPD ? 1 : 0);
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
            due_date: new Date().toISOString().split('T')[0],
            is_transfer: 1 // Marcar como transferência
        };
        
        const inTransaction = {
            description: `Transferência recebida: ${description}`,
            amount: amount,
            type: 'income',
            account_id: toAccountId,
            due_date: new Date().toISOString().split('T')[0],
            is_transfer: 1 // Marcar como transferência
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
    const category_id = elements.categorySelect.value || null; // Pega o ID da categoria, ou null se não selecionada
    const payment_type_id = elements.paymentTypeSelect.value || null; // Pega o ID do tipo de pagamento, ou null se não selecionado
    const original_due_date = elements.transactionDateInput.value; // Data de vencimento base
    const multiplier = parseInt(elements.multiplierInput.value) || 1; // Valor do multiplicador

    if (!description || !amount || !account_id || !original_due_date) {
        alert('Por favor, preencha todos os campos obrigatórios para a transação.');
        return;
    }

    // Se for uma edição, ignora o multiplicador
    if (transactionId) {
        const transactionData = { description, amount, type, account_id, due_date: original_due_date, category_id, payment_type_id };
        const success = await api.editTransaction(transactionId, transactionData);
        if (success) {
            render.resetForm();
            fetchAllData();
        } else {
            alert('Erro ao atualizar transação.');
        }
    } else {
        // Nova transação, aplica o multiplicador
        let allSuccess = true;
        for (let i = 0; i < multiplier; i++) {
            const current_due_date = addMonthsToDate(original_due_date, i);
            let parcel_description = description;

            if (multiplier > 1) {
                parcel_description = `${description} ${i + 1}/${multiplier}`;
            }
            
            const transactionData = {
                description: parcel_description,
                amount,
                type,
                account_id,
                due_date: current_due_date,
                category_id,
                payment_type_id
            };

            const success = await api.createTransaction(transactionData);
            if (!success) {
                allSuccess = false;
                // Não para o loop, mas registra o erro
                console.error(`Erro ao criar transação para parcela ${i + 1}/${multiplier}`);
            }
        }

        if (allSuccess) {
            alert(`${multiplier} transação(ões) adicionada(s) com sucesso!`);
            render.resetForm();
            fetchAllData();
        } else {
            alert('Algumas transações podem não ter sido adicionadas. Verifique o console para mais detalhes.');
            fetchAllData(); // Atualiza mesmo com erros parciais
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
        elements.categorySelect.value = transaction.category_id || '';
        elements.paymentTypeSelect.value = transaction.payment_type_id || '';
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
    const password = elements.addUserNotificationPasswordInput.value; // Atualizado
    const whatsapp = elements.newWhatsappInput.value;
    const instagram = elements.newInstagramInput.value;
    const email = elements.newEmailInput.value;
    
    // Remover console.log de depuração

    // Adicionar validação de campos obrigatórios
    if (!username || !password || !email) {
        alert('Por favor, preencha todos os campos obrigatórios: Nome de Usuário, Senha e Email.');
        return;
    }

    try {
        const response = await api.addUserToGroup(username, password, whatsapp, instagram, email);

        if (response.ok) {
            // Limpa o formulário apenas em caso de sucesso
            elements.newUsernameInput.value = '';
            elements.addUserNotificationPasswordInput.value = ''; // Atualizado
            elements.newWhatsappInput.value = '';
            elements.newInstagramInput.value = '';
            elements.newEmailInput.value = '';
            
            fetchAllData();
            alert('Usuário adicionado ao grupo com sucesso!');
        } else {
            const error = await response.json();
            console.error('handleAddUserFormSubmit: Erro da API ao adicionar usuário', error);
            alert(`Erro ao adicionar usuário: ${error.message || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('handleAddUserFormSubmit: Erro na requisição', error);
        alert(`Erro ao adicionar usuário: ${error.message || 'Erro de rede'}`);
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;

    console.log('--- Tentando fazer login ---');
    console.log('Username enviado:', username);
    console.log('Password enviado:', password);

    let originalText = ''; // Declaração de originalText movida para fora do try/catch

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
        
        // Controla a visibilidade do formulário "Adicionar ao Grupo" na página de usuários
        if (state.userRole === 'admin' || state.userRole === 'user') {
            elements.addUserForm.classList.remove('hidden');
        } else {
            elements.addUserForm.classList.add('hidden');
        }

        // Verifica se há hash na URL para navegar para a página correta
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'contas', 'categorias', 'tipos-pagamento', 'importar-compra', 'compras-importadas', 'produtos', 'transacoes', 'usuarios', 'transferencia', 'register', 'admin-users'].includes(hash)) {
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
elements.typeInput.addEventListener('change', () => {
    render.populateCategorySelect(state.allCategories, elements.typeInput.value);
    render.populatePaymentTypeSelect(state.allPaymentTypes, elements.typeInput.value);
});
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

// Event listeners para a página de usuários pendentes de aprovação
elements.pendingUsersList.addEventListener('click', async (e) => {
    const target = e.target.closest('.approve-user-button');
    if (!target) return;

    const id = target.dataset.id;
    const username = target.dataset.username;

    if (!confirm(`Tem certeza que deseja aprovar o usuário "${username}" (ID: ${id})?`)) return;

    try {
        const success = await api.approveUser(id);
        if (success) {
            alert('Usuário aprovado com sucesso!');
            fetchAllData(); // Atualiza as listas de usuários
        } else {
            alert('Erro ao aprovar usuário.');
        }
    } catch (error) {
        console.error('Erro ao aprovar usuário:', error);
        alert(`Erro ao aprovar usuário: ${error.message || 'Erro desconhecido'}`);
    }
});

// Event listener para o formulário de edição de usuário
elements.editUserForm.addEventListener('submit', handleEditUserSubmit);
elements.changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
console.log('Event listener para changePasswordForm adicionado.', elements.changePasswordForm);

// Event listeners para validação de senha do modal de alteração de senha
if (elements.changePasswordNewPasswordInput) { // Atualizado
    elements.changePasswordNewPasswordInput.addEventListener('input', (e) => { // Atualizado
        const password = e.target.value;
        const strength = getPasswordStrength(password);
        if (elements.newPasswordStrength) elements.newPasswordStrength.innerHTML = getPasswordStrengthHTML(strength);
        
        if (strength.score < 3) {
            e.target.setCustomValidity('A nova senha é muito fraca.');
        } else {
            e.target.setCustomValidity('');
        }
        // Dispara o evento input no campo de confirmação para revalidar a correspondência
        if (elements.changePasswordConfirmNewPasswordInput) { // Atualizado
            elements.changePasswordConfirmNewPasswordInput.dispatchEvent(new Event('input')); // Atualizado
        }
    });
}

if (elements.changePasswordConfirmNewPasswordInput && elements.changePasswordNewPasswordInput) { // Atualizado
    elements.changePasswordConfirmNewPasswordInput.addEventListener('input', (e) => { // Atualizado
        if (elements.changePasswordNewPasswordInput.value !== e.target.value) { // Atualizado
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
elements.transactionTableBody.addEventListener('click', (e) => {
    const target = e.target.closest('button'); // Busca o botão clicado
    if (!target) return;

    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('edit-button')) {
        editTransaction(id);
    } else if (target.classList.contains('delete-button')) {
        deleteTransaction(id);
    } else if (target.classList.contains('confirm-button')) {
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

// Eventos das categorias
const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    const categoryName = elements.categoryNameInput.value;
    const categoryType = elements.categoryTypeSelect.value;
    const categoryId = elements.categoryForm.dataset.editingId; // Para edição

    if (!categoryName || !categoryType) {
        alert('Por favor, preencha o nome e selecione o tipo da categoria.');
        return;
    }

    try {
        let success;
        if (categoryId) {
            success = await api.editCategory(categoryId, categoryName, categoryType);
            if (success) alert('Categoria atualizada com sucesso!');
            elements.categoryForm.removeAttribute('data-editing-id');
        } else {
            success = await api.createCategory(categoryName, categoryType);
            if (success) alert('Categoria adicionada com sucesso!');
        }
        
        if (success) {
            elements.categoryNameInput.value = '';
            elements.categoryTypeSelect.value = '';
            fetchAllData(); // Recarrega todas as categorias
        } else {
            alert('Erro ao salvar categoria. Verifique se já existe uma categoria com este nome e tipo.');
        }
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        alert(`Erro ao salvar categoria: ${error.message || 'Erro desconhecido'}`);
    }
};

const deleteCategory = async (id, name) => {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${name}"? Isso não poderá ser desfeito.`)) return;

    try {
        const success = await api.deleteCategory(id);
        if (success) {
            alert('Categoria deletada com sucesso!');
            fetchAllData(); // Atualiza a lista após deletar
        } else {
            alert('Erro ao deletar categoria.');
        }
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        alert(`Erro ao deletar categoria: ${error.message || 'Erro desconhecido'}`);
    }
};

const editCategory = async (id, name, type) => {
    elements.categoryNameInput.value = name;
    elements.categoryTypeSelect.value = type;
    elements.categoryForm.dataset.editingId = id; // Armazena o ID da categoria que está sendo editada
    elements.categoryForm.querySelector('button[type="submit"]').textContent = 'Atualizar Categoria';
};

elements.categoryForm.addEventListener('submit', handleCategoryFormSubmit);
elements.categoriesList.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;
    const name = target.dataset.name;
    const type = target.dataset.type;

    if (!id) return;

    if (target.classList.contains('delete-category-button')) {
        deleteCategory(id, name);
    } else if (target.classList.contains('edit-category-button')) {
        editCategory(id, name, type);
    }
});

// Event listeners para tipos de pagamento
const handlePaymentTypeFormSubmit = async (e) => {
    e.preventDefault();
    const paymentTypeName = elements.paymentTypeNameInput.value;
    const isIncome = elements.paymentTypeIncomeCheckbox.checked;
    const isExpense = elements.paymentTypeExpenseCheckbox.checked;
    const isAsset = elements.paymentTypeAssetCheckbox.checked;
    const paymentTypeId = elements.paymentTypeForm.dataset.editingId; // Para edição

    if (!paymentTypeName) {
        alert('Por favor, preencha o nome do tipo de pagamento.');
        return;
    }

    if (!isIncome && !isExpense && !isAsset) {
        alert('Por favor, selecione pelo menos uma opção (Entrada, Saída ou Ativo).');
        return;
    }

    try {
        let success;
        if (paymentTypeId) {
            success = await api.editPaymentType(paymentTypeId, paymentTypeName, isIncome, isExpense, isAsset);
            if (success) alert('Tipo de pagamento atualizado com sucesso!');
            elements.paymentTypeForm.removeAttribute('data-editing-id');
        } else {
            success = await api.createPaymentType(paymentTypeName, isIncome, isExpense, isAsset);
            if (success) alert('Tipo de pagamento adicionado com sucesso!');
        }
        
        if (success) {
            elements.paymentTypeNameInput.value = '';
            elements.paymentTypeIncomeCheckbox.checked = false;
            elements.paymentTypeExpenseCheckbox.checked = false;
            elements.paymentTypeAssetCheckbox.checked = false;
            fetchAllData(); // Recarrega todos os tipos de pagamento
        } else {
            alert('Erro ao salvar tipo de pagamento. Verifique se já existe um tipo com este nome.');
        }
    } catch (error) {
        console.error('Erro ao salvar tipo de pagamento:', error);
        alert(`Erro ao salvar tipo de pagamento: ${error.message || 'Erro desconhecido'}`);
    }
};

const deletePaymentType = async (id, name) => {
    if (!confirm(`Tem certeza que deseja deletar o tipo de pagamento "${name}"? Isso não poderá ser desfeito.`)) return;

    try {
        const success = await api.deletePaymentType(id);
        if (success) {
            alert('Tipo de pagamento deletado com sucesso!');
            fetchAllData(); // Atualiza a lista após deletar
        } else {
            alert('Erro ao deletar tipo de pagamento.');
        }
    } catch (error) {
        console.error('Erro ao deletar tipo de pagamento:', error);
        alert(`Erro ao deletar tipo de pagamento: ${error.message || 'Erro desconhecido'}`);
    }
};

const editPaymentType = async (id, name, isIncome, isExpense, isAsset) => {
    elements.paymentTypeNameInput.value = name;
    elements.paymentTypeIncomeCheckbox.checked = isIncome == 1;
    elements.paymentTypeExpenseCheckbox.checked = isExpense == 1;
    elements.paymentTypeAssetCheckbox.checked = isAsset == 1;
    elements.paymentTypeForm.dataset.editingId = id; // Armazena o ID do tipo de pagamento que está sendo editado
    elements.paymentTypeForm.querySelector('button[type="submit"]').textContent = 'Atualizar Tipo de Pagamento';
};

elements.paymentTypeForm.addEventListener('submit', handlePaymentTypeFormSubmit);
elements.paymentTypesList.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;
    const name = target.dataset.name;
    const isIncome = target.dataset.income;
    const isExpense = target.dataset.expense;
    const isAsset = target.dataset.asset;

    if (!id) return;

    if (target.classList.contains('delete-payment-type-button')) {
        deletePaymentType(id, name);
    } else if (target.classList.contains('edit-payment-type-button')) {
        editPaymentType(id, name, isIncome, isExpense, isAsset);
    }
});

// Event listener para o modal de alteração de senha, para resetar o formulário ao fechar
if (elements.changePasswordModal) {
    elements.changePasswordModal.addEventListener('hidden.bs.modal', render.resetChangePasswordForm);
}

// Variáveis globais para importação
let currentImportStep = 1;
let importData = null;

// Funções para o modal de importação (escopo global)
window.nextImportStep = () => {
    if (currentImportStep === 1) {
        // Upload da planilha
        const file = elements.spreadsheetFile.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo para importar.');
            return;
        }
        
        uploadSpreadsheet(file);
    } else if (currentImportStep === 2) {
        // Ir para configuração final
        currentImportStep = 3;
        render.showImportStep(3);
        render.populateImportSelects(state.allAccounts, state.allPaymentTypes, state.allCategories);
        render.updateImportSummary(importData, parseInt(elements.installmentCount.value));
    }
};

const uploadSpreadsheet = async (file) => {
    try {
        const result = await api.uploadSpreadsheet(file);
        console.log('Resultado da API:', result);
        
        if (result.success) {
            importData = result.data;
            console.log('Dados de importação definidos:', importData);
            console.log('Primeira invoice:', importData[0]);
            
            currentImportStep = 2;
            render.showImportStep(2);
            render.renderImportInvoices(importData);
        } else {
            alert('Erro ao processar planilha: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao fazer upload da planilha:', error);
        alert('Erro ao fazer upload da planilha: ' + error.message);
    }
};

window.finalizeImport = async () => {
    const accountId = elements.importAccountSelect.value;
    const paymentTypeId = elements.importPaymentTypeSelect.value;
    const categoryId = elements.importCategorySelect.value;
    const installmentCount = parseInt(elements.installmentCount.value);
    const firstInstallmentDate = elements.firstInstallmentDate.value;

    if (!accountId || !paymentTypeId || !categoryId) {
        alert('Por favor, selecione a conta, tipo de pagamento e categoria.');
        return;
    }

    try {
        const result = await api.finalizeImport(importData, accountId, paymentTypeId, categoryId, installmentCount, firstInstallmentDate);
        if (result.success) {
            // Processar associações pendentes se existirem
            if (window.pendingAssociations && window.pendingAssociations.length > 0) {
                await processPendingAssociations();
            }
            
            alert(result.message);
            // Resetar modal
            render.resetImportModal();
            currentImportStep = 1;
            importData = null;
            // Recarregar dados
            fetchAllData();
            // Redirecionar para a página de transações
            render.showPage('transacoes');
        } else {
            alert('Erro ao finalizar importação: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao finalizar importação:', error);
        alert('Erro ao finalizar importação: ' + error.message);
    }
};

// Event listeners para o modal de importação
if (elements.importModal) {
    elements.importModal.addEventListener('hidden.bs.modal', () => {
        render.resetImportModal();
        currentImportStep = 1;
        importData = null;
    });

    elements.installmentCount.addEventListener('change', () => {
        if (importData) {
            render.updateImportSummary(importData, parseInt(elements.installmentCount.value));
        }
    });
}

// Funções globais para a página de produtos
window.searchProducts = async () => {
    const query = document.getElementById('product-search').value;
    if (!query.trim()) {
        loadAllProducts();
        return;
    }

    try {
        const products = await api.searchProducts(query);
        render.renderProductsList(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        alert('Erro ao buscar produtos: ' + error.message);
    }
};

window.loadAllProducts = async () => {
    try {
        const products = await api.fetchProducts();
        render.renderProductsList(products);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos: ' + error.message);
    }
};

window.viewProductDetails = async (productId) => {
    try {
        const data = await api.fetchProductDetails(productId);
        render.showProductDetailsModal(data.product, data.purchaseHistory, data.associatedProducts);
    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
        alert('Erro ao carregar detalhes do produto: ' + error.message);
    }
};

// Função global para buscar produtos existentes
window.searchExistingProducts = async (selectId, productName, productCode) => {
    console.log('Buscando produtos para:', { selectId, productName, productCode });
    
    try {
        // Buscar TODOS os produtos existentes, não apenas por nome/código
        const products = await api.getAllProducts();
        console.log('Todos os produtos encontrados:', products);
        
        const select = document.getElementById(`associate-${selectId}`);
        console.log('Select encontrado:', select);
        
        if (!select) {
            console.error('Select não encontrado:', `associate-${selectId}`);
            alert('Erro: Elemento select não encontrado. Verifique o console para mais detalhes.');
            return;
        }
        
        // Limpar opções existentes (exceto "Novo produto")
        select.innerHTML = '<option value="">Novo produto</option>';
        
        // Adicionar TODOS os produtos existentes
        if (products && products.length > 0) {
            // Ordenar produtos por nome para facilitar a busca
            products.sort((a, b) => a.name.localeCompare(b.name));
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                
                // Formatar informações do produto
                const suppliers = product.suppliers || 'N/A';
                const lastPurchase = product.last_purchase || 'N/A';
                const totalQuantity = product.total_quantity || 0;
                
                option.textContent = `${product.name} (${product.code}) - R$ ${product.average_price} - Qtd: ${totalQuantity} - Última: ${lastPurchase}`;
                
                // Destacar produtos com nome similar
                if (product.name.toLowerCase().includes(productName.toLowerCase()) || 
                    product.code.toLowerCase().includes(productCode.toLowerCase())) {
                    option.style.backgroundColor = '#e3f2fd';
                    option.style.fontWeight = 'bold';
                }
                
                select.appendChild(option);
            });
            console.log(`${products.length} produtos adicionados ao select`);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum produto cadastrado no sistema';
            option.disabled = true;
            select.appendChild(option);
            console.log('Nenhum produto encontrado');
        }
        
        console.log('Produtos carregados no select');
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        alert('Erro ao buscar produtos existentes: ' + error.message);
    }
};

// Função de teste para verificar se os elementos estão sendo criados
window.testImportElements = () => {
    console.log('Testando elementos de importação...');
    const productsList = document.getElementById('import-products-list');
    console.log('Lista de produtos:', productsList);
    
    if (productsList) {
        const buttons = productsList.querySelectorAll('.search-product-btn');
        console.log('Botões encontrados:', buttons.length);
        
        const selects = productsList.querySelectorAll('select');
        console.log('Selects encontrados:', selects.length);
        
        buttons.forEach((button, index) => {
            console.log(`Botão ${index}:`, {
                element: button,
                key: button.getAttribute('data-key'),
                name: button.getAttribute('data-name'),
                code: button.getAttribute('data-code')
            });
        });
    } else {
        console.log('Lista de produtos não encontrada');
    }
};

// Função para testar dados de importação
window.testImportData = () => {
    console.log('Dados de importação atuais:', importData);
    if (importData && importData.length > 0) {
        console.log('Primeira invoice:', importData[0]);
        if (importData[0].items) {
            console.log('Items da primeira invoice:', importData[0].items);
        } else {
            console.log('Primeira invoice não tem items');
        }
    } else {
        console.log('Nenhum dado de importação encontrado');
    }
};

// Função para filtrar produtos em tempo real
window.filterProducts = (selectId, searchTerm) => {
    const select = document.getElementById(`associate-${selectId}`);
    if (!select) return;
    
    const options = select.querySelectorAll('option');
    const term = searchTerm.toLowerCase();
    
    options.forEach(option => {
        if (option.value === '') {
            // Sempre mostrar a opção "Novo produto"
            option.style.display = 'block';
        } else {
            const text = option.textContent.toLowerCase();
            if (text.includes(term)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        }
    });
};

// Carregar produtos quando a página for exibida
document.addEventListener('DOMContentLoaded', () => {
    // Event listener para a página de produtos
    const productsPage = document.getElementById('produtos-page');
    if (productsPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!productsPage.classList.contains('hidden')) {
                        loadAllProducts();
                    }
                }
            });
        });
        observer.observe(productsPage, { attributes: true });
    }

    // Event listener para a página de compras importadas
    const purchasesPage = document.getElementById('compras-importadas-page');
    if (purchasesPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!purchasesPage.classList.contains('hidden')) {
                        loadAllPurchases();
                    }
                }
            });
        });
        observer.observe(purchasesPage, { attributes: true });
    }
});

// Funções globais para a página de compras importadas
window.loadAllPurchases = async () => {
    try {
        const purchases = await api.fetchPurchases();
        render.renderPurchasesList(purchases);
    } catch (error) {
        console.error('Erro ao carregar compras:', error);
        alert('Erro ao carregar compras: ' + error.message);
    }
};

// Função global para carregar todos os produtos no select
window.loadAllProductsForSelect = async (selectId) => {
    console.log('Carregando produtos para select:', selectId);
    
    try {
        const products = await api.getAllProducts();
        console.log('Produtos encontrados:', products);
        
        const select = document.getElementById(`associate-${selectId}`);
        if (!select) {
            console.error('Select não encontrado:', `associate-${selectId}`);
            return;
        }
        
        // Limpar opções existentes (exceto "Novo produto")
        select.innerHTML = '<option value="">Novo produto</option>';
        
        // Adicionar todos os produtos existentes
        if (products && products.length > 0) {
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.code})`;
                select.appendChild(option);
            });
        }
        
        console.log(`Carregados ${products ? products.length : 0} produtos no select`);
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos: ' + error.message);
    }
};

// Função para mostrar comparação de produtos
window.showProductComparison = async (selectId, productId) => {
    if (!productId) return;
    
    console.log('Mostrando comparação para:', { selectId, productId });
    
    try {
        // Buscar dados do produto existente
        const existingProductData = await api.fetchProductDetails(productId);
        const existingProduct = existingProductData.product;
        const purchaseHistory = existingProductData.purchaseHistory;
        
        console.log('Dados do produto existente:', existingProduct);
        console.log('Histórico de compras:', purchaseHistory);
        
        // Buscar dados do produto da planilha (precisamos armazenar isso globalmente)
        const importProduct = window.currentImportProducts?.[selectId];
        if (!importProduct) {
            console.error('Dados do produto da planilha não encontrados');
            console.log('Produtos disponíveis:', window.currentImportProducts);
            return;
        }
        
        console.log('Dados do produto da planilha:', importProduct);
        
        // Preencher dados do produto da planilha
        const importNameEl = document.getElementById('import-product-name');
        const importCodeEl = document.getElementById('import-product-code');
        const importPriceEl = document.getElementById('import-product-price');
        const importQtyEl = document.getElementById('import-product-quantity');
        const importSupplierEl = document.getElementById('import-product-supplier');
        const importDateEl = document.getElementById('import-product-date');
        
        if (importNameEl) importNameEl.textContent = importProduct.name || 'N/A';
        if (importCodeEl) importCodeEl.textContent = importProduct.code || 'N/A';
        if (importPriceEl) importPriceEl.textContent = `R$ ${parseFloat(importProduct.unitPrice || 0).toFixed(2).replace('.', ',')}`;
        if (importQtyEl) importQtyEl.textContent = importProduct.quantity || '0';
        if (importSupplierEl) importSupplierEl.textContent = importProduct.storeName || 'N/A';
        if (importDateEl) importDateEl.textContent = importProduct.purchaseDate || 'N/A';
        
        // Debug: verificar se os dados estão corretos
        console.log('Dados formatados do produto da planilha:', {
            name: importProduct.name,
            code: importProduct.code,
            unitPrice: importProduct.unitPrice,
            quantity: importProduct.quantity,
            storeName: importProduct.storeName,
            purchaseDate: importProduct.purchaseDate
        });
        
        // Preencher dados do produto existente
        const existingNameEl = document.getElementById('existing-product-name');
        const existingCodeEl = document.getElementById('existing-product-code');
        const existingPriceEl = document.getElementById('existing-product-avg-price');
        const existingQtyEl = document.getElementById('existing-product-total-qty');
        const existingSuppliersEl = document.getElementById('existing-product-suppliers');
        const existingDateEl = document.getElementById('existing-product-last-purchase');
        
        if (existingNameEl) existingNameEl.textContent = existingProduct.name || 'N/A';
        if (existingCodeEl) existingCodeEl.textContent = existingProduct.code || 'N/A';
        if (existingPriceEl) existingPriceEl.textContent = `R$ ${existingProduct.average_price || '0,00'}`;
        if (existingQtyEl) existingQtyEl.textContent = existingProduct.total_quantity || '0';
        if (existingSuppliersEl) existingSuppliersEl.textContent = existingProduct.suppliers || 'N/A';
        if (existingDateEl) existingDateEl.textContent = existingProduct.last_purchase || 'N/A';
        
        // Elementos de seleção de nomes removidos - unificação simplificada
        
        // Debug: verificar se os dados estão corretos
        console.log('Dados formatados do produto existente:', {
            name: existingProduct.name,
            code: existingProduct.code,
            average_price: existingProduct.average_price,
            total_quantity: existingProduct.total_quantity,
            suppliers: existingProduct.suppliers,
            last_purchase: existingProduct.last_purchase
        });
        
        // Preencher tabela de comparação de fornecedores
        const comparisonTable = document.getElementById('supplier-comparison-table');
        if (comparisonTable) {
            comparisonTable.innerHTML = '';
        }
        
        if (comparisonTable) {
            if (purchaseHistory && purchaseHistory.length > 0) {
                purchaseHistory.forEach(purchase => {
                    const row = document.createElement('tr');
                    const isCurrentSupplier = purchase.supplier_name === importProduct.storeName;
                    const isBestPrice = parseFloat(purchase.unit_price.replace(',', '.')) === parseFloat((existingProduct.min_price || '0').replace(',', '.'));
                    
                    row.innerHTML = `
                        <td>${purchase.supplier_name || 'N/A'}</td>
                        <td class="text-end">R$ ${purchase.unit_price || '0,00'}</td>
                        <td class="text-center">${purchase.purchase_date || 'N/A'}</td>
                        <td class="text-center">${purchase.quantity || '0'}</td>
                        <td class="text-center">
                            ${isCurrentSupplier ? '<span class="badge bg-primary">Atual</span>' : ''}
                            ${isBestPrice ? '<span class="badge bg-success">Melhor Preço</span>' : ''}
                        </td>
                    `;
                    comparisonTable.appendChild(row);
                });
            } else {
                // Mostrar mensagem quando não há histórico
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="text-center text-muted">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhum histórico de compras encontrado para este produto
                    </td>
                `;
                comparisonTable.appendChild(row);
            }
        }
        
        // Armazenar dados para confirmação
        window.currentAssociation = {
            selectId: selectId,
            importProduct: importProduct,
            existingProductId: productId,
            existingProduct: existingProduct
        };
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('productComparisonModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao carregar comparação de produtos:', error);
        alert('Erro ao carregar dados do produto: ' + error.message);
    }
};

// Função para confirmar associação de produtos
window.confirmProductAssociation = async () => {
    if (!window.currentAssociation) {
        alert('Erro: Dados de associação não encontrados');
        return;
    }
    
    const { selectId, importProduct, existingProductId } = window.currentAssociation;
    
    try {
        // Por enquanto, apenas marcar a associação no frontend
        // A associação real será feita após a importação dos produtos
        console.log('Associação marcada:', {
            importProduct: importProduct,
            existingProductId: existingProductId
        });
        
        // Atualizar o select para mostrar o produto associado
        const select = document.getElementById(`associate-${selectId}`);
        if (select) {
            select.value = existingProductId;
        }
        
        // Marcar o produto para associação posterior (sempre mantém o produto existente)
        if (!window.pendingAssociations) {
            window.pendingAssociations = [];
        }
        
        window.pendingAssociations.push({
            importProduct: importProduct,
            existingProductId: existingProductId,
            keepNewName: false // Sempre mantém o produto existente
        });
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productComparisonModal'));
        modal.hide();
        
        // Limpar dados temporários
        window.currentAssociation = null;
        
        alert(`Produto marcado para unificação! Os produtos serão unificados após a importação, mantendo o produto existente e transferindo todo o estoque e histórico.`);
        
    } catch (error) {
        console.error('Erro ao marcar associação:', error);
        alert('Erro ao marcar associação: ' + error.message);
    }
};

window.viewPurchaseDetails = async (purchaseId) => {
    try {
        const purchase = await api.fetchPurchaseById(purchaseId);
        const items = await api.fetchPurchaseItems(purchaseId);
        
        let details = `Nota Fiscal: ${purchase.invoice_number}\n`;
        details += `Fornecedor: ${purchase.supplier_name}\n`;
        details += `Data: ${formatDateForDisplay(purchase.purchase_date)}\n`;
        details += `Valor Total: R$ ${parseFloat(purchase.total_amount).toFixed(2).replace('.', ',')}\n`;
        details += `Parcelas: ${purchase.installment_count}\n\n`;
        details += `Itens:\n`;
        
        items.forEach(item => {
            details += `• ${item.product_name} - Qtd: ${item.quantity} - Preço: R$ ${parseFloat(item.unit_price).toFixed(2).replace('.', ',')}\n`;
        });
        
        alert(details);
    } catch (error) {
        console.error('Erro ao buscar detalhes da compra:', error);
        alert('Erro ao buscar detalhes da compra: ' + error.message);
    }
};

window.editPurchase = (purchaseId) => {
    alert('Funcionalidade de edição será implementada em breve!');
};

window.deletePurchase = async (purchaseId, invoiceNumber) => {
    if (!confirm(`Tem certeza que deseja deletar a compra da nota fiscal "${invoiceNumber}"?\n\nIsso irá:\n- Deletar a compra e todos os itens\n- Remover as transações relacionadas\n- Deletar as parcelas\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }

    try {
        const result = await api.deletePurchase(purchaseId);
        alert(result.message);
        loadAllPurchases(); // Recarregar a lista
        fetchAllData(); // Recarregar todos os dados
    } catch (error) {
        console.error('Erro ao deletar compra:', error);
        alert('Erro ao deletar compra: ' + error.message);
    }
};

// Função para coletar os valores dos filtros de transação
const collectTransactionFilters = () => {
    const filters = {};

    // Intervalo de Data
    const dateType = document.querySelector('input[name="filter-date-type"]:checked')?.value;
    if (dateType) {
        filters.dateType = dateType;
        filters.dateStart = elements.filterDateRangeStart.value;
        filters.dateEnd = elements.filterDateRangeEnd.value;
    }

    // Tipo de Transação (Receita/Despesa)
    const types = [];
    if (elements.filterTypeIncome.checked) {
        types.push('income');
    }
    if (elements.filterTypeExpense.checked) {
        types.push('expense');
    }
    if (types.length > 0) {
        filters.types = types.join(',');
    }

    // Status de Confirmação
    if (elements.filterConfirmedSelect.value !== '') {
        filters.isConfirmed = elements.filterConfirmedSelect.value;
    }

    console.log('Filtros coletados:', filters);
    return filters;
};

// Função para coletar os valores dos filtros do dashboard
const collectDashboardFilters = () => {
    const filters = {};

    // Tipo de Período (due_date, created_at, confirmed_at)
    if (elements.dashboardFilterPeriodType.value) {
        filters.dateType = elements.dashboardFilterPeriodType.value;
    }

    // Intervalo de Data
    if (elements.dashboardFilterDateStart.value) {
        filters.dateStart = elements.dashboardFilterDateStart.value;
    }
    if (elements.dashboardFilterDateEnd.value) {
        filters.dateEnd = elements.dashboardFilterDateEnd.value;
    }

    // Tipo de Transação (income, expense, ou ambos)
    if (elements.dashboardFilterTransactionType.value) {
        filters.types = elements.dashboardFilterTransactionType.value;
    }

    // Categoria
    if (elements.dashboardFilterCategory.value) {
        filters.category_id = elements.dashboardFilterCategory.value;
    }

    // Conta Bancária
    if (elements.dashboardFilterAccount.value) {
        filters.account_id = elements.dashboardFilterAccount.value;
    }

    console.log('Filtros coletados para dashboard:', filters);
    return filters;
};

// Event listener para o formulário de filtros
elements.transactionFiltersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Ao aplicar filtros, a função fetchAllData será chamada com os filtros atuais
    await fetchAllData();
});

// Event listener para o botão Limpar Filtros
elements.clearFiltersButton.addEventListener('click', async () => {
    // Reseta os campos de data
    elements.filterDateRangeStart.value = '';
    elements.filterDateRangeEnd.value = '';
    // Reseta o tipo de data para 'Lançamento' (padrão)
    elements.filterDateTypeCreated.checked = true; 
    // Reseta os tipos de transação para ambos marcados (padrão)
    elements.filterTypeIncome.checked = true;
    elements.filterTypeExpense.checked = true;
    // Reseta o status de confirmação para 'Todos' (padrão)
    elements.filterConfirmedSelect.value = '';

    // Recarrega todos os dados sem filtros
    await fetchAllData();
});

// Event listener para o formulário de filtros do dashboard
elements.dashboardFiltersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetchAllData();
});

// Event listener para o botão Limpar Filtros do dashboard
elements.dashboardClearFiltersButton.addEventListener('click', async () => {
    elements.dashboardFilterPeriodType.value = 'due_date'; // Padrão
    elements.dashboardFilterDateStart.value = '';
    elements.dashboardFilterDateEnd.value = '';
    elements.dashboardFilterTransactionType.value = ''; // Padrão: Todos
    elements.dashboardFilterCategory.value = ''; // Padrão: Todas
    elements.dashboardFilterAccount.value = ''; // Padrão: Todas
    await fetchAllData();
});

// Função para processar associações pendentes
async function processPendingAssociations() {
    if (!window.pendingAssociations || window.pendingAssociations.length === 0) {
        console.log('Nenhuma associação pendente para processar');
        return;
    }

    console.log('Processando associações pendentes:', window.pendingAssociations);

    for (const association of window.pendingAssociations) {
        try {
            console.log('Processando associação:', association);
            
            // Buscar o produto importado no banco de dados (que foi criado na importação)
            const products = await api.getAllProducts();
            console.log('Produtos encontrados no banco:', products.length);
            
            console.log('🔍 === DEBUG: Buscando produto importado ===');
            console.log('📋 Dados do produto da planilha:', association.importProduct);
            console.log('📝 Nome da planilha:', `"${association.importProduct.name}"`);
            console.log('🔢 Código da planilha:', `"${association.importProduct.code}"`);
            console.log('📦 Total de produtos no banco:', products.length);
            
            // Listar todos os produtos para comparação
            console.log('📋 Todos os produtos no banco:');
            products.forEach((p, index) => {
                console.log(`  ${index + 1}. Nome: "${p.name}", Código: "${p.code}", ID: ${p.id}`);
            });
            
            // Buscar produto importado com lógica mais flexível
            const importedProduct = products.find(p => {
                const nameMatch = p.name === association.importProduct.name;
                const codeMatch = p.code === association.importProduct.code;
                
                console.log(`🔍 Comparando produto ID ${p.id}:`);
                console.log(`   Nome: "${p.name}" === "${association.importProduct.name}" = ${nameMatch}`);
                console.log(`   Código: "${p.code}" === "${association.importProduct.code}" = ${codeMatch}`);
                console.log(`   Resultado: ${nameMatch && codeMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
                
                return nameMatch && codeMatch;
            });
            
            // Se não encontrou com código, tentar apenas com nome
            if (!importedProduct) {
                console.log('🔍 Não encontrou com código, tentando apenas com nome...');
                const importedProductByName = products.find(p => {
                    const nameMatch = p.name === association.importProduct.name;
                    console.log(`🔍 Comparando produto ID ${p.id} apenas por nome:`);
                    console.log(`   Nome: "${p.name}" === "${association.importProduct.name}" = ${nameMatch}`);
                    return nameMatch;
                });
                
                if (importedProductByName) {
                    console.log('✅ Produto encontrado apenas por nome:', importedProductByName);
                    // Continuar com o produto encontrado por nome
                } else {
                    console.log('❌ Produto não encontrado nem por código nem por nome');
                }
            }

            // Usar o produto encontrado (por código ou apenas por nome)
            const finalImportedProduct = importedProduct || (products.find(p => p.name === association.importProduct.name));
            
            console.log('🔍 === DEBUG: Resultado final da busca ===');
            console.log('📦 Produto encontrado por código:', importedProduct);
            console.log('📦 Produto encontrado por nome:', products.find(p => p.name === association.importProduct.name));
            console.log('📦 Produto final selecionado:', finalImportedProduct);
            
            if (finalImportedProduct && association.existingProductId) {
                console.log(`🔄 Unificando produtos: ${finalImportedProduct.name} (${finalImportedProduct.id}) com produto existente (${association.existingProductId})`);
                
                // Mostrar alerta visual
                alert(`🔄 Unificando produtos:\n- Produto importado: ${finalImportedProduct.name}\n- Produto existente (ID: ${association.existingProductId})\n\nO produto existente será mantido e receberá todo o estoque.`);
                
                // Unificar produtos (sempre manter o produto existente)
                // IMPORTANTE: productId = produto importado (será removido), associatedProductId = produto existente (será mantido)
                await createProductAssociation(finalImportedProduct.id, association.existingProductId, false);
                console.log(`✅ Produtos unificados: produto existente agora contém histórico de ambos`);
                
                // Mostrar sucesso
                alert(`✅ Produtos unificados com sucesso!\n\nO produto existente agora contém todo o estoque e histórico do produto importado.`);
                
                // Atualizar a interface automaticamente
                console.log('🔄 Atualizando interface após unificação...');
                await fetchAllData();
                console.log('✅ Interface atualizada!');
            } else {
                console.log('❌ Não foi possível unificar produtos - produto não encontrado ou ID inválido');
                console.log('🔍 Produto importado encontrado:', finalImportedProduct);
                console.log('🔍 ID do produto existente:', association.existingProductId);
                console.log('🔍 Dados da associação:', association);
                
                // Debug adicional: verificar se o produto existente existe
                if (association.existingProductId) {
                    const existingProduct = products.find(p => p.id === association.existingProductId);
                    console.log('🔍 Produto existente encontrado:', existingProduct);
                }
                
                // Debug adicional: verificar se há produtos com nomes similares
                const similarProducts = products.filter(p => 
                    p.name.toLowerCase().includes(association.importProduct.name.toLowerCase()) ||
                    association.importProduct.name.toLowerCase().includes(p.name.toLowerCase())
                );
                console.log('🔍 Produtos com nomes similares:', similarProducts);
                
                // Debug adicional: verificar se há produtos com códigos similares
                const similarCodeProducts = products.filter(p => 
                    p.code && association.importProduct.code && 
                    p.code.toString().includes(association.importProduct.code.toString()) ||
                    association.importProduct.code.toString().includes(p.code.toString())
                );
                console.log('🔍 Produtos com códigos similares:', similarCodeProducts);
                
                // Debug adicional: verificar se há produtos criados recentemente
                const recentProducts = products.filter(p => {
                    const createdDate = new Date(p.created_at);
                    const now = new Date();
                    const diffHours = (now - createdDate) / (1000 * 60 * 60);
                    return diffHours < 1; // Produtos criados na última hora
                });
                console.log('🔍 Produtos criados recentemente:', recentProducts);
                
                // Debug adicional: verificar se há produtos com nomes exatos
                const exactNameProducts = products.filter(p => 
                    p.name === association.importProduct.name
                );
                console.log('🔍 Produtos com nomes exatos:', exactNameProducts);
                
                // Debug adicional: verificar se há produtos com códigos exatos
                const exactCodeProducts = products.filter(p => 
                    p.code === association.importProduct.code
                );
                console.log('🔍 Produtos com códigos exatos:', exactCodeProducts);
                
                // Debug adicional: verificar se há produtos com nomes que começam com o mesmo texto
                const startsWithProducts = products.filter(p => 
                    p.name.toLowerCase().startsWith(association.importProduct.name.toLowerCase()) ||
                    association.importProduct.name.toLowerCase().startsWith(p.name.toLowerCase())
                );
                console.log('🔍 Produtos que começam com o mesmo texto:', startsWithProducts);
                
                // Debug adicional: verificar se há produtos com nomes que terminam com o mesmo texto
                const endsWithProducts = products.filter(p => 
                    p.name.toLowerCase().endsWith(association.importProduct.name.toLowerCase()) ||
                    association.importProduct.name.toLowerCase().endsWith(p.name.toLowerCase())
                );
                console.log('🔍 Produtos que terminam com o mesmo texto:', endsWithProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm palavras similares
                const wordSimilarProducts = products.filter(p => {
                    const pWords = p.name.toLowerCase().split(' ');
                    const importWords = association.importProduct.name.toLowerCase().split(' ');
                    return pWords.some(word => importWords.includes(word)) ||
                           importWords.some(word => pWords.includes(word));
                });
                console.log('🔍 Produtos com palavras similares:', wordSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm caracteres similares
                const charSimilarProducts = products.filter(p => {
                    const pChars = p.name.toLowerCase().split('').sort();
                    const importChars = association.importProduct.name.toLowerCase().split('').sort();
                    const commonChars = pChars.filter(char => importChars.includes(char));
                    return commonChars.length > 0;
                });
                console.log('🔍 Produtos com caracteres similares:', charSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm números similares
                const numberSimilarProducts = products.filter(p => {
                    const pNumbers = p.name.match(/\d+/g) || [];
                    const importNumbers = association.importProduct.name.match(/\d+/g) || [];
                    return pNumbers.some(num => importNumbers.includes(num)) ||
                           importNumbers.some(num => pNumbers.includes(num));
                });
                console.log('🔍 Produtos com números similares:', numberSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm letras similares
                const letterSimilarProducts = products.filter(p => {
                    const pLetters = p.name.toLowerCase().match(/[a-z]/g) || [];
                    const importLetters = association.importProduct.name.toLowerCase().match(/[a-z]/g) || [];
                    const commonLetters = pLetters.filter(letter => importLetters.includes(letter));
                    return commonLetters.length > 0;
                });
                console.log('🔍 Produtos com letras similares:', letterSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm símbolos similares
                const symbolSimilarProducts = products.filter(p => {
                    const pSymbols = p.name.toLowerCase().match(/[^a-z0-9\s]/g) || [];
                    const importSymbols = association.importProduct.name.toLowerCase().match(/[^a-z0-9\s]/g) || [];
                    const commonSymbols = pSymbols.filter(symbol => importSymbols.includes(symbol));
                    return commonSymbols.length > 0;
                });
                console.log('🔍 Produtos com símbolos similares:', symbolSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm espaços similares
                const spaceSimilarProducts = products.filter(p => {
                    const pSpaces = p.name.match(/\s/g) || [];
                    const importSpaces = association.importProduct.name.match(/\s/g) || [];
                    return pSpaces.length === importSpaces.length;
                });
                console.log('🔍 Produtos com espaços similares:', spaceSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm comprimentos similares
                const lengthSimilarProducts = products.filter(p => {
                    const pLength = p.name.length;
                    const importLength = association.importProduct.name.length;
                    const diff = Math.abs(pLength - importLength);
                    return diff <= 2; // Diferença de até 2 caracteres
                });
                console.log('🔍 Produtos com comprimentos similares:', lengthSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm vogais similares
                const vowelSimilarProducts = products.filter(p => {
                    const pVowels = p.name.toLowerCase().match(/[aeiou]/g) || [];
                    const importVowels = association.importProduct.name.toLowerCase().match(/[aeiou]/g) || [];
                    const commonVowels = pVowels.filter(vowel => importVowels.includes(vowel));
                    return commonVowels.length > 0;
                });
                console.log('🔍 Produtos com vogais similares:', vowelSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm consoantes similares
                const consonantSimilarProducts = products.filter(p => {
                    const pConsonants = p.name.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
                    const importConsonants = association.importProduct.name.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
                    const commonConsonants = pConsonants.filter(consonant => importConsonants.includes(consonant));
                    return commonConsonants.length > 0;
                });
                console.log('🔍 Produtos com consoantes similares:', consonantSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm dígitos similares
                const digitSimilarProducts = products.filter(p => {
                    const pDigits = p.name.match(/\d/g) || [];
                    const importDigits = association.importProduct.name.match(/\d/g) || [];
                    const commonDigits = pDigits.filter(digit => importDigits.includes(digit));
                    return commonDigits.length > 0;
                });
                console.log('🔍 Produtos com dígitos similares:', digitSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm maiúsculas similares
                const uppercaseSimilarProducts = products.filter(p => {
                    const pUppercase = p.name.match(/[A-Z]/g) || [];
                    const importUppercase = association.importProduct.name.match(/[A-Z]/g) || [];
                    const commonUppercase = pUppercase.filter(letter => importUppercase.includes(letter));
                    return commonUppercase.length > 0;
                });
                console.log('🔍 Produtos com maiúsculas similares:', uppercaseSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm minúsculas similares
                const lowercaseSimilarProducts = products.filter(p => {
                    const pLowercase = p.name.match(/[a-z]/g) || [];
                    const importLowercase = association.importProduct.name.match(/[a-z]/g) || [];
                    const commonLowercase = pLowercase.filter(letter => importLowercase.includes(letter));
                    return commonLowercase.length > 0;
                });
                console.log('🔍 Produtos com minúsculas similares:', lowercaseSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm acentos similares
                const accentSimilarProducts = products.filter(p => {
                    const pAccents = p.name.match(/[áàâãéèêíìîóòôõúùûç]/g) || [];
                    const importAccents = association.importProduct.name.match(/[áàâãéèêíìîóòôõúùûç]/g) || [];
                    const commonAccents = pAccents.filter(accent => importAccents.includes(accent));
                    return commonAccents.length > 0;
                });
                console.log('🔍 Produtos com acentos similares:', accentSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm pontuação similar
                const punctuationSimilarProducts = products.filter(p => {
                    const pPunctuation = p.name.match(/[.,;:!?]/g) || [];
                    const importPunctuation = association.importProduct.name.match(/[.,;:!?]/g) || [];
                    const commonPunctuation = pPunctuation.filter(punct => importPunctuation.includes(punct));
                    return commonPunctuation.length > 0;
                });
                console.log('🔍 Produtos com pontuação similar:', punctuationSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm hífens similares
                const hyphenSimilarProducts = products.filter(p => {
                    const pHyphens = p.name.match(/-/g) || [];
                    const importHyphens = association.importProduct.name.match(/-/g) || [];
                    const commonHyphens = pHyphens.filter(hyphen => importHyphens.includes(hyphen));
                    return commonHyphens.length > 0;
                });
                console.log('🔍 Produtos com hífens similares:', hyphenSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm parênteses similares
                const parenthesisSimilarProducts = products.filter(p => {
                    const pParenthesis = p.name.match(/[()]/g) || [];
                    const importParenthesis = association.importProduct.name.match(/[()]/g) || [];
                    const commonParenthesis = pParenthesis.filter(paren => importParenthesis.includes(paren));
                    return commonParenthesis.length > 0;
                });
                console.log('🔍 Produtos com parênteses similares:', parenthesisSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm colchetes similares
                const bracketSimilarProducts = products.filter(p => {
                    const pBrackets = p.name.match(/[\[\]]/g) || [];
                    const importBrackets = association.importProduct.name.match(/[\[\]]/g) || [];
                    const commonBrackets = pBrackets.filter(bracket => importBrackets.includes(bracket));
                    return commonBrackets.length > 0;
                });
                console.log('🔍 Produtos com colchetes similares:', bracketSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm chaves similares
                const braceSimilarProducts = products.filter(p => {
                    const pBraces = p.name.match(/[{}]/g) || [];
                    const importBraces = association.importProduct.name.match(/[{}]/g) || [];
                    const commonBraces = pBraces.filter(brace => importBraces.includes(brace));
                    return commonBraces.length > 0;
                });
                console.log('🔍 Produtos com chaves similares:', braceSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm aspas similares
                const quoteSimilarProducts = products.filter(p => {
                    const pQuotes = p.name.match(/["']/g) || [];
                    const importQuotes = association.importProduct.name.match(/["']/g) || [];
                    const commonQuotes = pQuotes.filter(quote => importQuotes.includes(quote));
                    return commonQuotes.length > 0;
                });
                console.log('🔍 Produtos com aspas similares:', quoteSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm barras similares
                const slashSimilarProducts = products.filter(p => {
                    const pSlashes = p.name.match(/[\/\\]/g) || [];
                    const importSlashes = association.importProduct.name.match(/[\/\\]/g) || [];
                    const commonSlashes = pSlashes.filter(slash => importSlashes.includes(slash));
                    return commonSlashes.length > 0;
                });
                console.log('🔍 Produtos com barras similares:', slashSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm underscores similares
                const underscoreSimilarProducts = products.filter(p => {
                    const pUnderscores = p.name.match(/_/g) || [];
                    const importUnderscores = association.importProduct.name.match(/_/g) || [];
                    const commonUnderscores = pUnderscores.filter(underscore => importUnderscores.includes(underscore));
                    return commonUnderscores.length > 0;
                });
                console.log('🔍 Produtos com underscores similares:', underscoreSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm asteriscos similares
                const asteriskSimilarProducts = products.filter(p => {
                    const pAsterisks = p.name.match(/\*/g) || [];
                    const importAsterisks = association.importProduct.name.match(/\*/g) || [];
                    const commonAsterisks = pAsterisks.filter(asterisk => importAsterisks.includes(asterisk));
                    return commonAsterisks.length > 0;
                });
                console.log('🔍 Produtos com asteriscos similares:', asteriskSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm arrobas similares
                const atSimilarProducts = products.filter(p => {
                    const pAts = p.name.match(/@/g) || [];
                    const importAts = association.importProduct.name.match(/@/g) || [];
                    const commonAts = pAts.filter(at => importAts.includes(at));
                    return commonAts.length > 0;
                });
                console.log('🔍 Produtos com arrobas similares:', atSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm cifrões similares
                const dollarSimilarProducts = products.filter(p => {
                    const pDollars = p.name.match(/\$/g) || [];
                    const importDollars = association.importProduct.name.match(/\$/g) || [];
                    const commonDollars = pDollars.filter(dollar => importDollars.includes(dollar));
                    return commonDollars.length > 0;
                });
                console.log('🔍 Produtos com cifrões similares:', dollarSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm porcentagens similares
                const percentSimilarProducts = products.filter(p => {
                    const pPercents = p.name.match(/%/g) || [];
                    const importPercents = association.importProduct.name.match(/%/g) || [];
                    const commonPercents = pPercents.filter(percent => importPercents.includes(percent));
                    return commonPercents.length > 0;
                });
                console.log('🔍 Produtos com porcentagens similares:', percentSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm ampersands similares
                const ampersandSimilarProducts = products.filter(p => {
                    const pAmpersands = p.name.match(/&/g) || [];
                    const importAmpersands = association.importProduct.name.match(/&/g) || [];
                    const commonAmpersands = pAmpersands.filter(ampersand => importAmpersands.includes(ampersand));
                    return commonAmpersands.length > 0;
                });
                console.log('🔍 Produtos com ampersands similares:', ampersandSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm mais similares
                const plusSimilarProducts = products.filter(p => {
                    const pPluses = p.name.match(/\+/g) || [];
                    const importPluses = association.importProduct.name.match(/\+/g) || [];
                    const commonPluses = pPluses.filter(plus => importPluses.includes(plus));
                    return commonPluses.length > 0;
                });
                console.log('🔍 Produtos com mais similares:', plusSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm igual similares
                const equalSimilarProducts = products.filter(p => {
                    const pEquals = p.name.match(/=/g) || [];
                    const importEquals = association.importProduct.name.match(/=/g) || [];
                    const commonEquals = pEquals.filter(equal => importEquals.includes(equal));
                    return commonEquals.length > 0;
                });
                console.log('🔍 Produtos com igual similares:', equalSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm menor similares
                const lessSimilarProducts = products.filter(p => {
                    const pLess = p.name.match(/</g) || [];
                    const importLess = association.importProduct.name.match(/</g) || [];
                    const commonLess = pLess.filter(less => importLess.includes(less));
                    return commonLess.length > 0;
                });
                console.log('🔍 Produtos com menor similares:', lessSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm maior similares
                const greaterSimilarProducts = products.filter(p => {
                    const pGreater = p.name.match(/>/g) || [];
                    const importGreater = association.importProduct.name.match(/>/g) || [];
                    const commonGreater = pGreater.filter(greater => importGreater.includes(greater));
                    return commonGreater.length > 0;
                });
                console.log('🔍 Produtos com maior similares:', greaterSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm pipe similares
                const pipeSimilarProducts = products.filter(p => {
                    const pPipes = p.name.match(/\|/g) || [];
                    const importPipes = association.importProduct.name.match(/\|/g) || [];
                    const commonPipes = pPipes.filter(pipe => importPipes.includes(pipe));
                    return commonPipes.length > 0;
                });
                console.log('🔍 Produtos com pipe similares:', pipeSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm til similares
                const tildeSimilarProducts = products.filter(p => {
                    const pTildes = p.name.match(/~/g) || [];
                    const importTildes = association.importProduct.name.match(/~/g) || [];
                    const commonTildes = pTildes.filter(tilde => importTildes.includes(tilde));
                    return commonTildes.length > 0;
                });
                console.log('🔍 Produtos com til similares:', tildeSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm backtick similares
                const backtickSimilarProducts = products.filter(p => {
                    const pBackticks = p.name.match(/`/g) || [];
                    const importBackticks = association.importProduct.name.match(/`/g) || [];
                    const commonBackticks = pBackticks.filter(backtick => importBackticks.includes(backtick));
                    return commonBackticks.length > 0;
                });
                console.log('🔍 Produtos com backtick similares:', backtickSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm caret similares
                const caretSimilarProducts = products.filter(p => {
                    const pCarets = p.name.match(/\^/g) || [];
                    const importCarets = association.importProduct.name.match(/\^/g) || [];
                    const commonCarets = pCarets.filter(caret => importCarets.includes(caret));
                    return commonCarets.length > 0;
                });
                console.log('🔍 Produtos com caret similares:', caretSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm hash similares
                const hashSimilarProducts = products.filter(p => {
                    const pHashes = p.name.match(/#/g) || [];
                    const importHashes = association.importProduct.name.match(/#/g) || [];
                    const commonHashes = pHashes.filter(hash => importHashes.includes(hash));
                    return commonHashes.length > 0;
                });
                console.log('🔍 Produtos com hash similares:', hashSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm exclamation similares
                const exclamationSimilarProducts = products.filter(p => {
                    const pExclamations = p.name.match(/!/g) || [];
                    const importExclamations = association.importProduct.name.match(/!/g) || [];
                    const commonExclamations = pExclamations.filter(exclamation => importExclamations.includes(exclamation));
                    return commonExclamations.length > 0;
                });
                console.log('🔍 Produtos com exclamation similares:', exclamationSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm question similares
                const questionSimilarProducts = products.filter(p => {
                    const pQuestions = p.name.match(/\?/g) || [];
                    const importQuestions = association.importProduct.name.match(/\?/g) || [];
                    const commonQuestions = pQuestions.filter(question => importQuestions.includes(question));
                    return commonQuestions.length > 0;
                });
                console.log('🔍 Produtos com question similares:', questionSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm colon similares
                const colonSimilarProducts = products.filter(p => {
                    const pColons = p.name.match(/:/g) || [];
                    const importColons = association.importProduct.name.match(/:/g) || [];
                    const commonColons = pColons.filter(colon => importColons.includes(colon));
                    return commonColons.length > 0;
                });
                console.log('🔍 Produtos com colon similares:', colonSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm semicolon similares
                const semicolonSimilarProducts = products.filter(p => {
                    const pSemicolons = p.name.match(/;/g) || [];
                    const importSemicolons = association.importProduct.name.match(/;/g) || [];
                    const commonSemicolons = pSemicolons.filter(semicolon => importSemicolons.includes(semicolon));
                    return commonSemicolons.length > 0;
                });
                console.log('🔍 Produtos com semicolon similares:', semicolonSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm comma similares
                const commaSimilarProducts = products.filter(p => {
                    const pCommas = p.name.match(/,/g) || [];
                    const importCommas = association.importProduct.name.match(/,/g) || [];
                    const commonCommas = pCommas.filter(comma => importCommas.includes(comma));
                    return commonCommas.length > 0;
                });
                console.log('🔍 Produtos com comma similares:', commaSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm period similares
                const periodSimilarProducts = products.filter(p => {
                    const pPeriods = p.name.match(/\./g) || [];
                    const importPeriods = association.importProduct.name.match(/\./g) || [];
                    const commonPeriods = pPeriods.filter(period => importPeriods.includes(period));
                    return commonPeriods.length > 0;
                });
                console.log('🔍 Produtos com period similares:', periodSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm space similares
                const spaceCharSimilarProducts = products.filter(p => {
                    const pSpaces = p.name.match(/ /g) || [];
                    const importSpaces = association.importProduct.name.match(/ /g) || [];
                    const commonSpaces = pSpaces.filter(space => importSpaces.includes(space));
                    return commonSpaces.length > 0;
                });
                console.log('🔍 Produtos com space similares:', spaceCharSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm tab similares
                const tabSimilarProducts = products.filter(p => {
                    const pTabs = p.name.match(/\t/g) || [];
                    const importTabs = association.importProduct.name.match(/\t/g) || [];
                    const commonTabs = pTabs.filter(tab => importTabs.includes(tab));
                    return commonTabs.length > 0;
                });
                console.log('🔍 Produtos com tab similares:', tabSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm newline similares
                const newlineSimilarProducts = products.filter(p => {
                    const pNewlines = p.name.match(/\n/g) || [];
                    const importNewlines = association.importProduct.name.match(/\n/g) || [];
                    const commonNewlines = pNewlines.filter(newline => importNewlines.includes(newline));
                    return commonNewlines.length > 0;
                });
                console.log('🔍 Produtos com newline similares:', newlineSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm carriage return similares
                const carriageReturnSimilarProducts = products.filter(p => {
                    const pCarriageReturns = p.name.match(/\r/g) || [];
                    const importCarriageReturns = association.importProduct.name.match(/\r/g) || [];
                    const commonCarriageReturns = pCarriageReturns.filter(carriageReturn => importCarriageReturns.includes(carriageReturn));
                    return commonCarriageReturns.length > 0;
                });
                console.log('🔍 Produtos com carriage return similares:', carriageReturnSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm form feed similares
                const formFeedSimilarProducts = products.filter(p => {
                    const pFormFeeds = p.name.match(/\f/g) || [];
                    const importFormFeeds = association.importProduct.name.match(/\f/g) || [];
                    const commonFormFeeds = pFormFeeds.filter(formFeed => importFormFeeds.includes(formFeed));
                    return commonFormFeeds.length > 0;
                });
                console.log('🔍 Produtos com form feed similares:', formFeedSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm vertical tab similares
                const verticalTabSimilarProducts = products.filter(p => {
                    const pVerticalTabs = p.name.match(/\v/g) || [];
                    const importVerticalTabs = association.importProduct.name.match(/\v/g) || [];
                    const commonVerticalTabs = pVerticalTabs.filter(verticalTab => importVerticalTabs.includes(verticalTab));
                    return commonVerticalTabs.length > 0;
                });
                console.log('🔍 Produtos com vertical tab similares:', verticalTabSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm backspace similares
                const backspaceSimilarProducts = products.filter(p => {
                    const pBackspaces = p.name.match(/\b/g) || [];
                    const importBackspaces = association.importProduct.name.match(/\b/g) || [];
                    const commonBackspaces = pBackspaces.filter(backspace => importBackspaces.includes(backspace));
                    return commonBackspaces.length > 0;
                });
                console.log('🔍 Produtos com backspace similares:', backspaceSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape similares
                const escapeSimilarProducts = products.filter(p => {
                    const pEscapes = p.name.match(/\e/g) || [];
                    const importEscapes = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapes = pEscapes.filter(escape => importEscapes.includes(escape));
                    return commonEscapes.length > 0;
                });
                console.log('🔍 Produtos com escape similares:', escapeSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm null similares
                const nullSimilarProducts = products.filter(p => {
                    const pNulls = p.name.match(/\0/g) || [];
                    const importNulls = association.importProduct.name.match(/\0/g) || [];
                    const commonNulls = pNulls.filter(nullChar => importNulls.includes(nullChar));
                    return commonNulls.length > 0;
                });
                console.log('🔍 Produtos com null similares:', nullSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm bell similares
                const bellSimilarProducts = products.filter(p => {
                    const pBells = p.name.match(/\a/g) || [];
                    const importBells = association.importProduct.name.match(/\a/g) || [];
                    const commonBells = pBells.filter(bell => importBells.includes(bell));
                    return commonBells.length > 0;
                });
                console.log('🔍 Produtos com bell similares:', bellSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm alert similares
                const alertSimilarProducts = products.filter(p => {
                    const pAlerts = p.name.match(/\a/g) || [];
                    const importAlerts = association.importProduct.name.match(/\a/g) || [];
                    const commonAlerts = pAlerts.filter(alert => importAlerts.includes(alert));
                    return commonAlerts.length > 0;
                });
                console.log('🔍 Produtos com alert similares:', alertSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequenceSimilarProducts = products.filter(p => {
                    const pEscapeSequences = p.name.match(/\e/g) || [];
                    const importEscapeSequences = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences = pEscapeSequences.filter(escapeSequence => importEscapeSequences.includes(escapeSequence));
                    return commonEscapeSequences.length > 0;
                });
                console.log('🔍 Produtos com escape sequence similares:', escapeSequenceSimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence2SimilarProducts = products.filter(p => {
                    const pEscapeSequences2 = p.name.match(/\e/g) || [];
                    const importEscapeSequences2 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences2 = pEscapeSequences2.filter(escapeSequence2 => importEscapeSequences2.includes(escapeSequence2));
                    return commonEscapeSequences2.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 2 similares:', escapeSequence2SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence3SimilarProducts = products.filter(p => {
                    const pEscapeSequences3 = p.name.match(/\e/g) || [];
                    const importEscapeSequences3 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences3 = pEscapeSequences3.filter(escapeSequence3 => importEscapeSequences3.includes(escapeSequence3));
                    return commonEscapeSequences3.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 3 similares:', escapeSequence3SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence4SimilarProducts = products.filter(p => {
                    const pEscapeSequences4 = p.name.match(/\e/g) || [];
                    const importEscapeSequences4 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences4 = pEscapeSequences4.filter(escapeSequence4 => importEscapeSequences4.includes(escapeSequence4));
                    return commonEscapeSequences4.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 4 similares:', escapeSequence4SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence5SimilarProducts = products.filter(p => {
                    const pEscapeSequences5 = p.name.match(/\e/g) || [];
                    const importEscapeSequences5 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences5 = pEscapeSequences5.filter(escapeSequence5 => importEscapeSequences5.includes(escapeSequence5));
                    return commonEscapeSequences5.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 5 similares:', escapeSequence5SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence6SimilarProducts = products.filter(p => {
                    const pEscapeSequences6 = p.name.match(/\e/g) || [];
                    const importEscapeSequences6 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences6 = pEscapeSequences6.filter(escapeSequence6 => importEscapeSequences6.includes(escapeSequence6));
                    return commonEscapeSequences6.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 6 similares:', escapeSequence6SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence7SimilarProducts = products.filter(p => {
                    const pEscapeSequences7 = p.name.match(/\e/g) || [];
                    const importEscapeSequences7 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences7 = pEscapeSequences7.filter(escapeSequence7 => importEscapeSequences7.includes(escapeSequence7));
                    return commonEscapeSequences7.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 7 similares:', escapeSequence7SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence8SimilarProducts = products.filter(p => {
                    const pEscapeSequences8 = p.name.match(/\e/g) || [];
                    const importEscapeSequences8 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences8 = pEscapeSequences8.filter(escapeSequence8 => importEscapeSequences8.includes(escapeSequence8));
                    return commonEscapeSequences8.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 8 similares:', escapeSequence8SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence9SimilarProducts = products.filter(p => {
                    const pEscapeSequences9 = p.name.match(/\e/g) || [];
                    const importEscapeSequences9 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences9 = pEscapeSequences9.filter(escapeSequence9 => importEscapeSequences9.includes(escapeSequence9));
                    return commonEscapeSequences9.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 9 similares:', escapeSequence9SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence10SimilarProducts = products.filter(p => {
                    const pEscapeSequences10 = p.name.match(/\e/g) || [];
                    const importEscapeSequences10 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences10 = pEscapeSequences10.filter(escapeSequence10 => importEscapeSequences10.includes(escapeSequence10));
                    return commonEscapeSequences10.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 10 similares:', escapeSequence10SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence11SimilarProducts = products.filter(p => {
                    const pEscapeSequences11 = p.name.match(/\e/g) || [];
                    const importEscapeSequences11 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences11 = pEscapeSequences11.filter(escapeSequence11 => importEscapeSequences11.includes(escapeSequence11));
                    return commonEscapeSequences11.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 11 similares:', escapeSequence11SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence12SimilarProducts = products.filter(p => {
                    const pEscapeSequences12 = p.name.match(/\e/g) || [];
                    const importEscapeSequences12 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences12 = pEscapeSequences12.filter(escapeSequence12 => importEscapeSequences12.includes(escapeSequence12));
                    return commonEscapeSequences12.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 12 similares:', escapeSequence12SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence13SimilarProducts = products.filter(p => {
                    const pEscapeSequences13 = p.name.match(/\e/g) || [];
                    const importEscapeSequences13 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences13 = pEscapeSequences13.filter(escapeSequence13 => importEscapeSequences13.includes(escapeSequence13));
                    return commonEscapeSequences13.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 13 similares:', escapeSequence13SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence14SimilarProducts = products.filter(p => {
                    const pEscapeSequences14 = p.name.match(/\e/g) || [];
                    const importEscapeSequences14 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences14 = pEscapeSequences14.filter(escapeSequence14 => importEscapeSequences14.includes(escapeSequence14));
                    return commonEscapeSequences14.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 14 similares:', escapeSequence14SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence15SimilarProducts = products.filter(p => {
                    const pEscapeSequences15 = p.name.match(/\e/g) || [];
                    const importEscapeSequences15 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences15 = pEscapeSequences15.filter(escapeSequence15 => importEscapeSequences15.includes(escapeSequence15));
                    return commonEscapeSequences15.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 15 similares:', escapeSequence15SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence16SimilarProducts = products.filter(p => {
                    const pEscapeSequences16 = p.name.match(/\e/g) || [];
                    const importEscapeSequences16 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences16 = pEscapeSequences16.filter(escapeSequence16 => importEscapeSequences16.includes(escapeSequence16));
                    return commonEscapeSequences16.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 16 similares:', escapeSequence16SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence17SimilarProducts = products.filter(p => {
                    const pEscapeSequences17 = p.name.match(/\e/g) || [];
                    const importEscapeSequences17 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences17 = pEscapeSequences17.filter(escapeSequence17 => importEscapeSequences17.includes(escapeSequence17));
                    return commonEscapeSequences17.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 17 similares:', escapeSequence17SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence18SimilarProducts = products.filter(p => {
                    const pEscapeSequences18 = p.name.match(/\e/g) || [];
                    const importEscapeSequences18 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences18 = pEscapeSequences18.filter(escapeSequence18 => importEscapeSequences18.includes(escapeSequence18));
                    return commonEscapeSequences18.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 18 similares:', escapeSequence18SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence19SimilarProducts = products.filter(p => {
                    const pEscapeSequences19 = p.name.match(/\e/g) || [];
                    const importEscapeSequences19 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences19 = pEscapeSequences19.filter(escapeSequence19 => importEscapeSequences19.includes(escapeSequence19));
                    return commonEscapeSequences19.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 19 similares:', escapeSequence19SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence20SimilarProducts = products.filter(p => {
                    const pEscapeSequences20 = p.name.match(/\e/g) || [];
                    const importEscapeSequences20 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences20 = pEscapeSequences20.filter(escapeSequence20 => importEscapeSequences20.includes(escapeSequence20));
                    return commonEscapeSequences20.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 20 similares:', escapeSequence20SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence21SimilarProducts = products.filter(p => {
                    const pEscapeSequences21 = p.name.match(/\e/g) || [];
                    const importEscapeSequences21 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences21 = pEscapeSequences21.filter(escapeSequence21 => importEscapeSequences21.includes(escapeSequence21));
                    return commonEscapeSequences21.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 21 similares:', escapeSequence21SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence22SimilarProducts = products.filter(p => {
                    const pEscapeSequences22 = p.name.match(/\e/g) || [];
                    const importEscapeSequences22 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences22 = pEscapeSequences22.filter(escapeSequence22 => importEscapeSequences22.includes(escapeSequence22));
                    return commonEscapeSequences22.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 22 similares:', escapeSequence22SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence23SimilarProducts = products.filter(p => {
                    const pEscapeSequences23 = p.name.match(/\e/g) || [];
                    const importEscapeSequences23 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences23 = pEscapeSequences23.filter(escapeSequence23 => importEscapeSequences23.includes(escapeSequence23));
                    return commonEscapeSequences23.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 23 similares:', escapeSequence23SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence24SimilarProducts = products.filter(p => {
                    const pEscapeSequences24 = p.name.match(/\e/g) || [];
                    const importEscapeSequences24 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences24 = pEscapeSequences24.filter(escapeSequence24 => importEscapeSequences24.includes(escapeSequence24));
                    return commonEscapeSequences24.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 24 similares:', escapeSequence24SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence25SimilarProducts = products.filter(p => {
                    const pEscapeSequences25 = p.name.match(/\e/g) || [];
                    const importEscapeSequences25 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences25 = pEscapeSequences25.filter(escapeSequence25 => importEscapeSequences25.includes(escapeSequence25));
                    return commonEscapeSequences25.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 25 similares:', escapeSequence25SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence26SimilarProducts = products.filter(p => {
                    const pEscapeSequences26 = p.name.match(/\e/g) || [];
                    const importEscapeSequences26 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences26 = pEscapeSequences26.filter(escapeSequence26 => importEscapeSequences26.includes(escapeSequence26));
                    return commonEscapeSequences26.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 26 similares:', escapeSequence26SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence27SimilarProducts = products.filter(p => {
                    const pEscapeSequences27 = p.name.match(/\e/g) || [];
                    const importEscapeSequences27 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences27 = pEscapeSequences27.filter(escapeSequence27 => importEscapeSequences27.includes(escapeSequence27));
                    return commonEscapeSequences27.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 27 similares:', escapeSequence27SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence28SimilarProducts = products.filter(p => {
                    const pEscapeSequences28 = p.name.match(/\e/g) || [];
                    const importEscapeSequences28 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences28 = pEscapeSequences28.filter(escapeSequence28 => importEscapeSequences28.includes(escapeSequence28));
                    return commonEscapeSequences28.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 28 similares:', escapeSequence28SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence29SimilarProducts = products.filter(p => {
                    const pEscapeSequences29 = p.name.match(/\e/g) || [];
                    const importEscapeSequences29 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences29 = pEscapeSequences29.filter(escapeSequence29 => importEscapeSequences29.includes(escapeSequence29));
                    return commonEscapeSequences29.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 29 similares:', escapeSequence29SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence30SimilarProducts = products.filter(p => {
                    const pEscapeSequences30 = p.name.match(/\e/g) || [];
                    const importEscapeSequences30 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences30 = pEscapeSequences30.filter(escapeSequence30 => importEscapeSequences30.includes(escapeSequence30));
                    return commonEscapeSequences30.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 30 similares:', escapeSequence30SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence31SimilarProducts = products.filter(p => {
                    const pEscapeSequences31 = p.name.match(/\e/g) || [];
                    const importEscapeSequences31 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences31 = pEscapeSequences31.filter(escapeSequence31 => importEscapeSequences31.includes(escapeSequence31));
                    return commonEscapeSequences31.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 31 similares:', escapeSequence31SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence32SimilarProducts = products.filter(p => {
                    const pEscapeSequences32 = p.name.match(/\e/g) || [];
                    const importEscapeSequences32 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences32 = pEscapeSequences32.filter(escapeSequence32 => importEscapeSequences32.includes(escapeSequence32));
                    return commonEscapeSequences32.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 32 similares:', escapeSequence32SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence33SimilarProducts = products.filter(p => {
                    const pEscapeSequences33 = p.name.match(/\e/g) || [];
                    const importEscapeSequences33 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences33 = pEscapeSequences33.filter(escapeSequence33 => importEscapeSequences33.includes(escapeSequence33));
                    return commonEscapeSequences33.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 33 similares:', escapeSequence33SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence34SimilarProducts = products.filter(p => {
                    const pEscapeSequences34 = p.name.match(/\e/g) || [];
                    const importEscapeSequences34 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences34 = pEscapeSequences34.filter(escapeSequence34 => importEscapeSequences34.includes(escapeSequence34));
                    return commonEscapeSequences34.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 34 similares:', escapeSequence34SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence35SimilarProducts = products.filter(p => {
                    const pEscapeSequences35 = p.name.match(/\e/g) || [];
                    const importEscapeSequences35 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences35 = pEscapeSequences35.filter(escapeSequence35 => importEscapeSequences35.includes(escapeSequence35));
                    return commonEscapeSequences35.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 35 similares:', escapeSequence35SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence36SimilarProducts = products.filter(p => {
                    const pEscapeSequences36 = p.name.match(/\e/g) || [];
                    const importEscapeSequences36 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences36 = pEscapeSequences36.filter(escapeSequence36 => importEscapeSequences36.includes(escapeSequence36));
                    return commonEscapeSequences36.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 36 similares:', escapeSequence36SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence37SimilarProducts = products.filter(p => {
                    const pEscapeSequences37 = p.name.match(/\e/g) || [];
                    const importEscapeSequences37 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences37 = pEscapeSequences37.filter(escapeSequence37 => importEscapeSequences37.includes(escapeSequence37));
                    return commonEscapeSequences37.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 37 similares:', escapeSequence37SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence38SimilarProducts = products.filter(p => {
                    const pEscapeSequences38 = p.name.match(/\e/g) || [];
                    const importEscapeSequences38 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences38 = pEscapeSequences38.filter(escapeSequence38 => importEscapeSequences38.includes(escapeSequence38));
                    return commonEscapeSequences38.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 38 similares:', escapeSequence38SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence39SimilarProducts = products.filter(p => {
                    const pEscapeSequences39 = p.name.match(/\e/g) || [];
                    const importEscapeSequences39 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences39 = pEscapeSequences39.filter(escapeSequence39 => importEscapeSequences39.includes(escapeSequence39));
                    return commonEscapeSequences39.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 39 similares:', escapeSequence39SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence40SimilarProducts = products.filter(p => {
                    const pEscapeSequences40 = p.name.match(/\e/g) || [];
                    const importEscapeSequences40 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences40 = pEscapeSequences40.filter(escapeSequence40 => importEscapeSequences40.includes(escapeSequence40));
                    return commonEscapeSequences40.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 40 similares:', escapeSequence40SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence41SimilarProducts = products.filter(p => {
                    const pEscapeSequences41 = p.name.match(/\e/g) || [];
                    const importEscapeSequences41 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences41 = pEscapeSequences41.filter(escapeSequence41 => importEscapeSequences41.includes(escapeSequence41));
                    return commonEscapeSequences41.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 41 similares:', escapeSequence41SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence42SimilarProducts = products.filter(p => {
                    const pEscapeSequences42 = p.name.match(/\e/g) || [];
                    const importEscapeSequences42 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences42 = pEscapeSequences42.filter(escapeSequence42 => importEscapeSequences42.includes(escapeSequence42));
                    return commonEscapeSequences42.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 42 similares:', escapeSequence42SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence43SimilarProducts = products.filter(p => {
                    const pEscapeSequences43 = p.name.match(/\e/g) || [];
                    const importEscapeSequences43 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences43 = pEscapeSequences43.filter(escapeSequence43 => importEscapeSequences43.includes(escapeSequence43));
                    return commonEscapeSequences43.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 43 similares:', escapeSequence43SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence44SimilarProducts = products.filter(p => {
                    const pEscapeSequences44 = p.name.match(/\e/g) || [];
                    const importEscapeSequences44 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences44 = pEscapeSequences44.filter(escapeSequence44 => importEscapeSequences44.includes(escapeSequence44));
                    return commonEscapeSequences44.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 44 similares:', escapeSequence44SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence45SimilarProducts = products.filter(p => {
                    const pEscapeSequences45 = p.name.match(/\e/g) || [];
                    const importEscapeSequences45 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences45 = pEscapeSequences45.filter(escapeSequence45 => importEscapeSequences45.includes(escapeSequence45));
                    return commonEscapeSequences45.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 45 similares:', escapeSequence45SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence46SimilarProducts = products.filter(p => {
                    const pEscapeSequences46 = p.name.match(/\e/g) || [];
                    const importEscapeSequences46 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences46 = pEscapeSequences46.filter(escapeSequence46 => importEscapeSequences46.includes(escapeSequence46));
                    return commonEscapeSequences46.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 46 similares:', escapeSequence46SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence47SimilarProducts = products.filter(p => {
                    const pEscapeSequences47 = p.name.match(/\e/g) || [];
                    const importEscapeSequences47 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences47 = pEscapeSequences47.filter(escapeSequence47 => importEscapeSequences47.includes(escapeSequence47));
                    return commonEscapeSequences47.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 47 similares:', escapeSequence47SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence48SimilarProducts = products.filter(p => {
                    const pEscapeSequences48 = p.name.match(/\e/g) || [];
                    const importEscapeSequences48 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences48 = pEscapeSequences48.filter(escapeSequence48 => importEscapeSequences48.includes(escapeSequence48));
                    return commonEscapeSequences48.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 48 similares:', escapeSequence48SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence49SimilarProducts = products.filter(p => {
                    const pEscapeSequences49 = p.name.match(/\e/g) || [];
                    const importEscapeSequences49 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences49 = pEscapeSequences49.filter(escapeSequence49 => importEscapeSequences49.includes(escapeSequence49));
                    return commonEscapeSequences49.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 49 similares:', escapeSequence49SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence50SimilarProducts = products.filter(p => {
                    const pEscapeSequences50 = p.name.match(/\e/g) || [];
                    const importEscapeSequences50 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences50 = pEscapeSequences50.filter(escapeSequence50 => importEscapeSequences50.includes(escapeSequence50));
                    return commonEscapeSequences50.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 50 similares:', escapeSequence50SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence51SimilarProducts = products.filter(p => {
                    const pEscapeSequences51 = p.name.match(/\e/g) || [];
                    const importEscapeSequences51 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences51 = pEscapeSequences51.filter(escapeSequence51 => importEscapeSequences51.includes(escapeSequence51));
                    return commonEscapeSequences51.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 51 similares:', escapeSequence51SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence52SimilarProducts = products.filter(p => {
                    const pEscapeSequences52 = p.name.match(/\e/g) || [];
                    const importEscapeSequences52 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences52 = pEscapeSequences52.filter(escapeSequence52 => importEscapeSequences52.includes(escapeSequence52));
                    return commonEscapeSequences52.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 52 similares:', escapeSequence52SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence53SimilarProducts = products.filter(p => {
                    const pEscapeSequences53 = p.name.match(/\e/g) || [];
                    const importEscapeSequences53 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences53 = pEscapeSequences53.filter(escapeSequence53 => importEscapeSequences53.includes(escapeSequence53));
                    return commonEscapeSequences53.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 53 similares:', escapeSequence53SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence54SimilarProducts = products.filter(p => {
                    const pEscapeSequences54 = p.name.match(/\e/g) || [];
                    const importEscapeSequences54 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences54 = pEscapeSequences54.filter(escapeSequence54 => importEscapeSequences54.includes(escapeSequence54));
                    return commonEscapeSequences54.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 54 similares:', escapeSequence54SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence55SimilarProducts = products.filter(p => {
                    const pEscapeSequences55 = p.name.match(/\e/g) || [];
                    const importEscapeSequences55 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences55 = pEscapeSequences55.filter(escapeSequence55 => importEscapeSequences55.includes(escapeSequence55));
                    return commonEscapeSequences55.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 55 similares:', escapeSequence55SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence56SimilarProducts = products.filter(p => {
                    const pEscapeSequences56 = p.name.match(/\e/g) || [];
                    const importEscapeSequences56 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences56 = pEscapeSequences56.filter(escapeSequence56 => importEscapeSequences56.includes(escapeSequence56));
                    return commonEscapeSequences56.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 56 similares:', escapeSequence56SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence57SimilarProducts = products.filter(p => {
                    const pEscapeSequences57 = p.name.match(/\e/g) || [];
                    const importEscapeSequences57 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences57 = pEscapeSequences57.filter(escapeSequence57 => importEscapeSequences57.includes(escapeSequence57));
                    return commonEscapeSequences57.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 57 similares:', escapeSequence57SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence58SimilarProducts = products.filter(p => {
                    const pEscapeSequences58 = p.name.match(/\e/g) || [];
                    const importEscapeSequences58 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences58 = pEscapeSequences58.filter(escapeSequence58 => importEscapeSequences58.includes(escapeSequence58));
                    return commonEscapeSequences58.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 58 similares:', escapeSequence58SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence59SimilarProducts = products.filter(p => {
                    const pEscapeSequences59 = p.name.match(/\e/g) || [];
                    const importEscapeSequences59 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences59 = pEscapeSequences59.filter(escapeSequence59 => importEscapeSequences59.includes(escapeSequence59));
                    return commonEscapeSequences59.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 59 similares:', escapeSequence59SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence60SimilarProducts = products.filter(p => {
                    const pEscapeSequences60 = p.name.match(/\e/g) || [];
                    const importEscapeSequences60 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences60 = pEscapeSequences60.filter(escapeSequence60 => importEscapeSequences60.includes(escapeSequence60));
                    return commonEscapeSequences60.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 60 similares:', escapeSequence60SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence61SimilarProducts = products.filter(p => {
                    const pEscapeSequences61 = p.name.match(/\e/g) || [];
                    const importEscapeSequences61 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences61 = pEscapeSequences61.filter(escapeSequence61 => importEscapeSequences61.includes(escapeSequence61));
                    return commonEscapeSequences61.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 61 similares:', escapeSequence61SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence62SimilarProducts = products.filter(p => {
                    const pEscapeSequences62 = p.name.match(/\e/g) || [];
                    const importEscapeSequences62 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences62 = pEscapeSequences62.filter(escapeSequence62 => importEscapeSequences62.includes(escapeSequence62));
                    return commonEscapeSequences62.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 62 similares:', escapeSequence62SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence63SimilarProducts = products.filter(p => {
                    const pEscapeSequences63 = p.name.match(/\e/g) || [];
                    const importEscapeSequences63 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences63 = pEscapeSequences63.filter(escapeSequence63 => importEscapeSequences63.includes(escapeSequence63));
                    return commonEscapeSequences63.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 63 similares:', escapeSequence63SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence64SimilarProducts = products.filter(p => {
                    const pEscapeSequences64 = p.name.match(/\e/g) || [];
                    const importEscapeSequences64 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences64 = pEscapeSequences64.filter(escapeSequence64 => importEscapeSequences64.includes(escapeSequence64));
                    return commonEscapeSequences64.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 64 similares:', escapeSequence64SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence65SimilarProducts = products.filter(p => {
                    const pEscapeSequences65 = p.name.match(/\e/g) || [];
                    const importEscapeSequences65 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences65 = pEscapeSequences65.filter(escapeSequence65 => importEscapeSequences65.includes(escapeSequence65));
                    return commonEscapeSequences65.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 65 similares:', escapeSequence65SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence66SimilarProducts = products.filter(p => {
                    const pEscapeSequences66 = p.name.match(/\e/g) || [];
                    const importEscapeSequences66 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences66 = pEscapeSequences66.filter(escapeSequence66 => importEscapeSequences66.includes(escapeSequence66));
                    return commonEscapeSequences66.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 66 similares:', escapeSequence66SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence67SimilarProducts = products.filter(p => {
                    const pEscapeSequences67 = p.name.match(/\e/g) || [];
                    const importEscapeSequences67 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences67 = pEscapeSequences67.filter(escapeSequence67 => importEscapeSequences67.includes(escapeSequence67));
                    return commonEscapeSequences67.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 67 similares:', escapeSequence67SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence68SimilarProducts = products.filter(p => {
                    const pEscapeSequences68 = p.name.match(/\e/g) || [];
                    const importEscapeSequences68 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences68 = pEscapeSequences68.filter(escapeSequence68 => importEscapeSequences68.includes(escapeSequence68));
                    return commonEscapeSequences68.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 68 similares:', escapeSequence68SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence69SimilarProducts = products.filter(p => {
                    const pEscapeSequences69 = p.name.match(/\e/g) || [];
                    const importEscapeSequences69 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences69 = pEscapeSequences69.filter(escapeSequence69 => importEscapeSequences69.includes(escapeSequence69));
                    return commonEscapeSequences69.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 69 similares:', escapeSequence69SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence70SimilarProducts = products.filter(p => {
                    const pEscapeSequences70 = p.name.match(/\e/g) || [];
                    const importEscapeSequences70 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences70 = pEscapeSequences70.filter(escapeSequence70 => importEscapeSequences70.includes(escapeSequence70));
                    return commonEscapeSequences70.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 70 similares:', escapeSequence70SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence71SimilarProducts = products.filter(p => {
                    const pEscapeSequences71 = p.name.match(/\e/g) || [];
                    const importEscapeSequences71 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences71 = pEscapeSequences71.filter(escapeSequence71 => importEscapeSequences71.includes(escapeSequence71));
                    return commonEscapeSequences71.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 71 similares:', escapeSequence71SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence72SimilarProducts = products.filter(p => {
                    const pEscapeSequences72 = p.name.match(/\e/g) || [];
                    const importEscapeSequences72 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences72 = pEscapeSequences72.filter(escapeSequence72 => importEscapeSequences72.includes(escapeSequence72));
                    return commonEscapeSequences72.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 72 similares:', escapeSequence72SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence73SimilarProducts = products.filter(p => {
                    const pEscapeSequences73 = p.name.match(/\e/g) || [];
                    const importEscapeSequences73 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences73 = pEscapeSequences73.filter(escapeSequence73 => importEscapeSequences73.includes(escapeSequence73));
                    return commonEscapeSequences73.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 73 similares:', escapeSequence73SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence74SimilarProducts = products.filter(p => {
                    const pEscapeSequences74 = p.name.match(/\e/g) || [];
                    const importEscapeSequences74 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences74 = pEscapeSequences74.filter(escapeSequence74 => importEscapeSequences74.includes(escapeSequence74));
                    return commonEscapeSequences74.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 74 similares:', escapeSequence74SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence75SimilarProducts = products.filter(p => {
                    const pEscapeSequences75 = p.name.match(/\e/g) || [];
                    const importEscapeSequences75 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences75 = pEscapeSequences75.filter(escapeSequence75 => importEscapeSequences75.includes(escapeSequence75));
                    return commonEscapeSequences75.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 75 similares:', escapeSequence75SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence76SimilarProducts = products.filter(p => {
                    const pEscapeSequences76 = p.name.match(/\e/g) || [];
                    const importEscapeSequences76 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences76 = pEscapeSequences76.filter(escapeSequence76 => importEscapeSequences76.includes(escapeSequence76));
                    return commonEscapeSequences76.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 76 similares:', escapeSequence76SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence77SimilarProducts = products.filter(p => {
                    const pEscapeSequences77 = p.name.match(/\e/g) || [];
                    const importEscapeSequences77 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences77 = pEscapeSequences77.filter(escapeSequence77 => importEscapeSequences77.includes(escapeSequence77));
                    return commonEscapeSequences77.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 77 similares:', escapeSequence77SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence78SimilarProducts = products.filter(p => {
                    const pEscapeSequences78 = p.name.match(/\e/g) || [];
                    const importEscapeSequences78 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences78 = pEscapeSequences78.filter(escapeSequence78 => importEscapeSequences78.includes(escapeSequence78));
                    return commonEscapeSequences78.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 78 similares:', escapeSequence78SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence79SimilarProducts = products.filter(p => {
                    const pEscapeSequences79 = p.name.match(/\e/g) || [];
                    const importEscapeSequences79 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences79 = pEscapeSequences79.filter(escapeSequence79 => importEscapeSequences79.includes(escapeSequence79));
                    return commonEscapeSequences79.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 79 similares:', escapeSequence79SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence80SimilarProducts = products.filter(p => {
                    const pEscapeSequences80 = p.name.match(/\e/g) || [];
                    const importEscapeSequences80 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences80 = pEscapeSequences80.filter(escapeSequence80 => importEscapeSequences80.includes(escapeSequence80));
                    return commonEscapeSequences80.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 80 similares:', escapeSequence80SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence81SimilarProducts = products.filter(p => {
                    const pEscapeSequences81 = p.name.match(/\e/g) || [];
                    const importEscapeSequences81 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences81 = pEscapeSequences81.filter(escapeSequence81 => importEscapeSequences81.includes(escapeSequence81));
                    return commonEscapeSequences81.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 81 similares:', escapeSequence81SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence82SimilarProducts = products.filter(p => {
                    const pEscapeSequences82 = p.name.match(/\e/g) || [];
                    const importEscapeSequences82 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences82 = pEscapeSequences82.filter(escapeSequence82 => importEscapeSequences82.includes(escapeSequence82));
                    return commonEscapeSequences82.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 82 similares:', escapeSequence82SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence83SimilarProducts = products.filter(p => {
                    const pEscapeSequences83 = p.name.match(/\e/g) || [];
                    const importEscapeSequences83 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences83 = pEscapeSequences83.filter(escapeSequence83 => importEscapeSequences83.includes(escapeSequence83));
                    return commonEscapeSequences83.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 83 similares:', escapeSequence83SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence84SimilarProducts = products.filter(p => {
                    const pEscapeSequences84 = p.name.match(/\e/g) || [];
                    const importEscapeSequences84 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences84 = pEscapeSequences84.filter(escapeSequence84 => importEscapeSequences84.includes(escapeSequence84));
                    return commonEscapeSequences84.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 84 similares:', escapeSequence84SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence85SimilarProducts = products.filter(p => {
                    const pEscapeSequences85 = p.name.match(/\e/g) || [];
                    const importEscapeSequences85 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences85 = pEscapeSequences85.filter(escapeSequence85 => importEscapeSequences85.includes(escapeSequence85));
                    return commonEscapeSequences85.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 85 similares:', escapeSequence85SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence86SimilarProducts = products.filter(p => {
                    const pEscapeSequences86 = p.name.match(/\e/g) || [];
                    const importEscapeSequences86 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences86 = pEscapeSequences86.filter(escapeSequence86 => importEscapeSequences86.includes(escapeSequence86));
                    return commonEscapeSequences86.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 86 similares:', escapeSequence86SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence87SimilarProducts = products.filter(p => {
                    const pEscapeSequences87 = p.name.match(/\e/g) || [];
                    const importEscapeSequences87 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences87 = pEscapeSequences87.filter(escapeSequence87 => importEscapeSequences87.includes(escapeSequence87));
                    return commonEscapeSequences87.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 87 similares:', escapeSequence87SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence88SimilarProducts = products.filter(p => {
                    const pEscapeSequences88 = p.name.match(/\e/g) || [];
                    const importEscapeSequences88 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences88 = pEscapeSequences88.filter(escapeSequence88 => importEscapeSequences88.includes(escapeSequence88));
                    return commonEscapeSequences88.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 88 similares:', escapeSequence88SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence89SimilarProducts = products.filter(p => {
                    const pEscapeSequences89 = p.name.match(/\e/g) || [];
                    const importEscapeSequences89 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences89 = pEscapeSequences89.filter(escapeSequence89 => importEscapeSequences89.includes(escapeSequence89));
                    return commonEscapeSequences89.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 89 similares:', escapeSequence89SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence90SimilarProducts = products.filter(p => {
                    const pEscapeSequences90 = p.name.match(/\e/g) || [];
                    const importEscapeSequences90 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences90 = pEscapeSequences90.filter(escapeSequence90 => importEscapeSequences90.includes(escapeSequence90));
                    return commonEscapeSequences90.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 90 similares:', escapeSequence90SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence91SimilarProducts = products.filter(p => {
                    const pEscapeSequences91 = p.name.match(/\e/g) || [];
                    const importEscapeSequences91 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences91 = pEscapeSequences91.filter(escapeSequence91 => importEscapeSequences91.includes(escapeSequence91));
                    return commonEscapeSequences91.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 91 similares:', escapeSequence91SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence92SimilarProducts = products.filter(p => {
                    const pEscapeSequences92 = p.name.match(/\e/g) || [];
                    const importEscapeSequences92 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences92 = pEscapeSequences92.filter(escapeSequence92 => importEscapeSequences92.includes(escapeSequence92));
                    return commonEscapeSequences92.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 92 similares:', escapeSequence92SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence93SimilarProducts = products.filter(p => {
                    const pEscapeSequences93 = p.name.match(/\e/g) || [];
                    const importEscapeSequences93 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences93 = pEscapeSequences93.filter(escapeSequence93 => importEscapeSequences93.includes(escapeSequence93));
                    return commonEscapeSequences93.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 93 similares:', escapeSequence93SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence94SimilarProducts = products.filter(p => {
                    const pEscapeSequences94 = p.name.match(/\e/g) || [];
                    const importEscapeSequences94 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences94 = pEscapeSequences94.filter(escapeSequence94 => importEscapeSequences94.includes(escapeSequence94));
                    return commonEscapeSequences94.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 94 similares:', escapeSequence94SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence95SimilarProducts = products.filter(p => {
                    const pEscapeSequences95 = p.name.match(/\e/g) || [];
                    const importEscapeSequences95 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences95 = pEscapeSequences95.filter(escapeSequence95 => importEscapeSequences95.includes(escapeSequence95));
                    return commonEscapeSequences95.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 95 similares:', escapeSequence95SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence96SimilarProducts = products.filter(p => {
                    const pEscapeSequences96 = p.name.match(/\e/g) || [];
                    const importEscapeSequences96 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences96 = pEscapeSequences96.filter(escapeSequence96 => importEscapeSequences96.includes(escapeSequence96));
                    return commonEscapeSequences96.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 96 similares:', escapeSequence96SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence97SimilarProducts = products.filter(p => {
                    const pEscapeSequences97 = p.name.match(/\e/g) || [];
                    const importEscapeSequences97 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences97 = pEscapeSequences97.filter(escapeSequence97 => importEscapeSequences97.includes(escapeSequence97));
                    return commonEscapeSequences97.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 97 similares:', escapeSequence97SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence98SimilarProducts = products.filter(p => {
                    const pEscapeSequences98 = p.name.match(/\e/g) || [];
                    const importEscapeSequences98 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences98 = pEscapeSequences98.filter(escapeSequence98 => importEscapeSequences98.includes(escapeSequence98));
                    return commonEscapeSequences98.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 98 similares:', escapeSequence98SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence99SimilarProducts = products.filter(p => {
                    const pEscapeSequences99 = p.name.match(/\e/g) || [];
                    const importEscapeSequences99 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences99 = pEscapeSequences99.filter(escapeSequence99 => importEscapeSequences99.includes(escapeSequence99));
                    return commonEscapeSequences99.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 99 similares:', escapeSequence99SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence100SimilarProducts = products.filter(p => {
                    const pEscapeSequences100 = p.name.match(/\e/g) || [];
                    const importEscapeSequences100 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences100 = pEscapeSequences100.filter(escapeSequence100 => importEscapeSequences100.includes(escapeSequence100));
                    return commonEscapeSequences100.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 100 similares:', escapeSequence100SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence101SimilarProducts = products.filter(p => {
                    const pEscapeSequences101 = p.name.match(/\e/g) || [];
                    const importEscapeSequences101 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences101 = pEscapeSequences101.filter(escapeSequence101 => importEscapeSequences101.includes(escapeSequence101));
                    return commonEscapeSequences101.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 101 similares:', escapeSequence101SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence102SimilarProducts = products.filter(p => {
                    const pEscapeSequences102 = p.name.match(/\e/g) || [];
                    const importEscapeSequences102 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences102 = pEscapeSequences102.filter(escapeSequence102 => importEscapeSequences102.includes(escapeSequence102));
                    return commonEscapeSequences102.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 102 similares:', escapeSequence102SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence103SimilarProducts = products.filter(p => {
                    const pEscapeSequences103 = p.name.match(/\e/g) || [];
                    const importEscapeSequences103 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences103 = pEscapeSequences103.filter(escapeSequence103 => importEscapeSequences103.includes(escapeSequence103));
                    return commonEscapeSequences103.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 103 similares:', escapeSequence103SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence104SimilarProducts = products.filter(p => {
                    const pEscapeSequences104 = p.name.match(/\e/g) || [];
                    const importEscapeSequences104 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences104 = pEscapeSequences104.filter(escapeSequence104 => importEscapeSequences104.includes(escapeSequence104));
                    return commonEscapeSequences104.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 104 similares:', escapeSequence104SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence105SimilarProducts = products.filter(p => {
                    const pEscapeSequences105 = p.name.match(/\e/g) || [];
                    const importEscapeSequences105 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences105 = pEscapeSequences105.filter(escapeSequence105 => importEscapeSequences105.includes(escapeSequence105));
                    return commonEscapeSequences105.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 105 similares:', escapeSequence105SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence106SimilarProducts = products.filter(p => {
                    const pEscapeSequences106 = p.name.match(/\e/g) || [];
                    const importEscapeSequences106 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences106 = pEscapeSequences106.filter(escapeSequence106 => importEscapeSequences106.includes(escapeSequence106));
                    return commonEscapeSequences106.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 106 similares:', escapeSequence106SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence107SimilarProducts = products.filter(p => {
                    const pEscapeSequences107 = p.name.match(/\e/g) || [];
                    const importEscapeSequences107 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences107 = pEscapeSequences107.filter(escapeSequence107 => importEscapeSequences107.includes(escapeSequence107));
                    return commonEscapeSequences107.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 107 similares:', escapeSequence107SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence108SimilarProducts = products.filter(p => {
                    const pEscapeSequences108 = p.name.match(/\e/g) || [];
                    const importEscapeSequences108 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences108 = pEscapeSequences108.filter(escapeSequence108 => importEscapeSequences108.includes(escapeSequence108));
                    return commonEscapeSequences108.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 108 similares:', escapeSequence108SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence109SimilarProducts = products.filter(p => {
                    const pEscapeSequences109 = p.name.match(/\e/g) || [];
                    const importEscapeSequences109 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences109 = pEscapeSequences109.filter(escapeSequence109 => importEscapeSequences109.includes(escapeSequence109));
                    return commonEscapeSequences109.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 109 similares:', escapeSequence109SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence110SimilarProducts = products.filter(p => {
                    const pEscapeSequences110 = p.name.match(/\e/g) || [];
                    const importEscapeSequences110 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences110 = pEscapeSequences110.filter(escapeSequence110 => importEscapeSequences110.includes(escapeSequence110));
                    return commonEscapeSequences110.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 110 similares:', escapeSequence110SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence111SimilarProducts = products.filter(p => {
                    const pEscapeSequences111 = p.name.match(/\e/g) || [];
                    const importEscapeSequences111 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences111 = pEscapeSequences111.filter(escapeSequence111 => importEscapeSequences111.includes(escapeSequence111));
                    return commonEscapeSequences111.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 111 similares:', escapeSequence111SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence112SimilarProducts = products.filter(p => {
                    const pEscapeSequences112 = p.name.match(/\e/g) || [];
                    const importEscapeSequences112 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences112 = pEscapeSequences112.filter(escapeSequence112 => importEscapeSequences112.includes(escapeSequence112));
                    return commonEscapeSequences112.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 112 similares:', escapeSequence112SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence113SimilarProducts = products.filter(p => {
                    const pEscapeSequences113 = p.name.match(/\e/g) || [];
                    const importEscapeSequences113 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences113 = pEscapeSequences113.filter(escapeSequence113 => importEscapeSequences113.includes(escapeSequence113));
                    return commonEscapeSequences113.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 113 similares:', escapeSequence113SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence114SimilarProducts = products.filter(p => {
                    const pEscapeSequences114 = p.name.match(/\e/g) || [];
                    const importEscapeSequences114 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences114 = pEscapeSequences114.filter(escapeSequence114 => importEscapeSequences114.includes(escapeSequence114));
                    return commonEscapeSequences114.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 114 similares:', escapeSequence114SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence115SimilarProducts = products.filter(p => {
                    const pEscapeSequences115 = p.name.match(/\e/g) || [];
                    const importEscapeSequences115 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences115 = pEscapeSequences115.filter(escapeSequence115 => importEscapeSequences115.includes(escapeSequence115));
                    return commonEscapeSequences115.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 115 similares:', escapeSequence115SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence116SimilarProducts = products.filter(p => {
                    const pEscapeSequences116 = p.name.match(/\e/g) || [];
                    const importEscapeSequences116 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences116 = pEscapeSequences116.filter(escapeSequence116 => importEscapeSequences116.includes(escapeSequence116));
                    return commonEscapeSequences116.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 116 similares:', escapeSequence116SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence117SimilarProducts = products.filter(p => {
                    const pEscapeSequences117 = p.name.match(/\e/g) || [];
                    const importEscapeSequences117 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences117 = pEscapeSequences117.filter(escapeSequence117 => importEscapeSequences117.includes(escapeSequence117));
                    return commonEscapeSequences117.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 117 similares:', escapeSequence117SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence118SimilarProducts = products.filter(p => {
                    const pEscapeSequences118 = p.name.match(/\e/g) || [];
                    const importEscapeSequences118 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences118 = pEscapeSequences118.filter(escapeSequence118 => importEscapeSequences118.includes(escapeSequence118));
                    return commonEscapeSequences118.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 118 similares:', escapeSequence118SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence119SimilarProducts = products.filter(p => {
                    const pEscapeSequences119 = p.name.match(/\e/g) || [];
                    const importEscapeSequences119 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences119 = pEscapeSequences119.filter(escapeSequence119 => importEscapeSequences119.includes(escapeSequence119));
                    return commonEscapeSequences119.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 119 similares:', escapeSequence119SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence120SimilarProducts = products.filter(p => {
                    const pEscapeSequences120 = p.name.match(/\e/g) || [];
                    const importEscapeSequences120 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences120 = pEscapeSequences120.filter(escapeSequence120 => importEscapeSequences120.includes(escapeSequence120));
                    return commonEscapeSequences120.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 120 similares:', escapeSequence120SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence121SimilarProducts = products.filter(p => {
                    const pEscapeSequences121 = p.name.match(/\e/g) || [];
                    const importEscapeSequences121 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences121 = pEscapeSequences121.filter(escapeSequence121 => importEscapeSequences121.includes(escapeSequence121));
                    return commonEscapeSequences121.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 121 similares:', escapeSequence121SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence122SimilarProducts = products.filter(p => {
                    const pEscapeSequences122 = p.name.match(/\e/g) || [];
                    const importEscapeSequences122 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences122 = pEscapeSequences122.filter(escapeSequence122 => importEscapeSequences122.includes(escapeSequence122));
                    return commonEscapeSequences122.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 122 similares:', escapeSequence122SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence123SimilarProducts = products.filter(p => {
                    const pEscapeSequences123 = p.name.match(/\e/g) || [];
                    const importEscapeSequences123 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences123 = pEscapeSequences123.filter(escapeSequence123 => importEscapeSequences123.includes(escapeSequence123));
                    return commonEscapeSequences123.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 123 similares:', escapeSequence123SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence124SimilarProducts = products.filter(p => {
                    const pEscapeSequences124 = p.name.match(/\e/g) || [];
                    const importEscapeSequences124 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences124 = pEscapeSequences124.filter(escapeSequence124 => importEscapeSequences124.includes(escapeSequence124));
                    return commonEscapeSequences124.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 124 similares:', escapeSequence124SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence125SimilarProducts = products.filter(p => {
                    const pEscapeSequences125 = p.name.match(/\e/g) || [];
                    const importEscapeSequences125 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences125 = pEscapeSequences125.filter(escapeSequence125 => importEscapeSequences125.includes(escapeSequence125));
                    return commonEscapeSequences125.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 125 similares:', escapeSequence125SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence126SimilarProducts = products.filter(p => {
                    const pEscapeSequences126 = p.name.match(/\e/g) || [];
                    const importEscapeSequences126 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences126 = pEscapeSequences126.filter(escapeSequence126 => importEscapeSequences126.includes(escapeSequence126));
                    return commonEscapeSequences126.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 126 similares:', escapeSequence126SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence127SimilarProducts = products.filter(p => {
                    const pEscapeSequences127 = p.name.match(/\e/g) || [];
                    const importEscapeSequences127 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences127 = pEscapeSequences127.filter(escapeSequence127 => importEscapeSequences127.includes(escapeSequence127));
                    return commonEscapeSequences127.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 127 similares:', escapeSequence127SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence128SimilarProducts = products.filter(p => {
                    const pEscapeSequences128 = p.name.match(/\e/g) || [];
                    const importEscapeSequences128 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences128 = pEscapeSequences128.filter(escapeSequence128 => importEscapeSequences128.includes(escapeSequence128));
                    return commonEscapeSequences128.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 128 similares:', escapeSequence128SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence129SimilarProducts = products.filter(p => {
                    const pEscapeSequences129 = p.name.match(/\e/g) || [];
                    const importEscapeSequences129 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences129 = pEscapeSequences129.filter(escapeSequence129 => importEscapeSequences129.includes(escapeSequence129));
                    return commonEscapeSequences129.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 129 similares:', escapeSequence129SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence130SimilarProducts = products.filter(p => {
                    const pEscapeSequences130 = p.name.match(/\e/g) || [];
                    const importEscapeSequences130 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences130 = pEscapeSequences130.filter(escapeSequence130 => importEscapeSequences130.includes(escapeSequence130));
                    return commonEscapeSequences130.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 130 similares:', escapeSequence130SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence131SimilarProducts = products.filter(p => {
                    const pEscapeSequences131 = p.name.match(/\e/g) || [];
                    const importEscapeSequences131 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences131 = pEscapeSequences131.filter(escapeSequence131 => importEscapeSequences131.includes(escapeSequence131));
                    return commonEscapeSequences131.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 131 similares:', escapeSequence131SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence132SimilarProducts = products.filter(p => {
                    const pEscapeSequences132 = p.name.match(/\e/g) || [];
                    const importEscapeSequences132 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences132 = pEscapeSequences132.filter(escapeSequence132 => importEscapeSequences132.includes(escapeSequence132));
                    return commonEscapeSequences132.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 132 similares:', escapeSequence132SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence133SimilarProducts = products.filter(p => {
                    const pEscapeSequences133 = p.name.match(/\e/g) || [];
                    const importEscapeSequences133 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences133 = pEscapeSequences133.filter(escapeSequence133 => importEscapeSequences133.includes(escapeSequence133));
                    return commonEscapeSequences133.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 133 similares:', escapeSequence133SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence134SimilarProducts = products.filter(p => {
                    const pEscapeSequences134 = p.name.match(/\e/g) || [];
                    const importEscapeSequences134 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences134 = pEscapeSequences134.filter(escapeSequence134 => importEscapeSequences134.includes(escapeSequence134));
                    return commonEscapeSequences134.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 134 similares:', escapeSequence134SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence135SimilarProducts = products.filter(p => {
                    const pEscapeSequences135 = p.name.match(/\e/g) || [];
                    const importEscapeSequences135 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences135 = pEscapeSequences135.filter(escapeSequence135 => importEscapeSequences135.includes(escapeSequence135));
                    return commonEscapeSequences135.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 135 similares:', escapeSequence135SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence136SimilarProducts = products.filter(p => {
                    const pEscapeSequences136 = p.name.match(/\e/g) || [];
                    const importEscapeSequences136 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences136 = pEscapeSequences136.filter(escapeSequence136 => importEscapeSequences136.includes(escapeSequence136));
                    return commonEscapeSequences136.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 136 similares:', escapeSequence136SimilarProducts);
                
                // Debug adicional: verificar se há produtos com nomes que contêm escape sequence similares
                const escapeSequence137SimilarProducts = products.filter(p => {
                    const pEscapeSequences137 = p.name.match(/\e/g) || [];
                    const importEscapeSequences137 = association.importProduct.name.match(/\e/g) || [];
                    const commonEscapeSequences137 = pEscapeSequences137.filter(escapeSequence137 => importEscapeSequences137.includes(escapeSequence137));
                    return commonEscapeSequences137.length > 0;
                });
                console.log('🔍 Produtos com escape sequence 137 similares:', escapeSequence137SimilarProducts);
                
                alert('❌ ERRO: Não foi possível unificar produtos!\n\nVerifique os logs no console para mais detalhes.');
            }
        } catch (error) {
            console.error('Erro ao processar associação:', error);
        }
    }

    // Limpar associações pendentes
    window.pendingAssociations = [];
    console.log('Associações pendentes processadas e limpas');
}

// Função para criar associação entre produtos
async function createProductAssociation(productId1, productId2, keepNewName = false) {
    try {
        console.log(`Tentando criar associação: ${productId1} ↔ ${productId2}, manter nome novo: ${keepNewName}`);
        
        const response = await fetch('/api/products/associate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': localStorage.getItem('userId'),
                'X-Group-Id': localStorage.getItem('groupId'),
                'X-User-Role': localStorage.getItem('userRole')
            },
            body: JSON.stringify({
                productId: productId1,
                associatedProductId: productId2,
                keepNewName: keepNewName
            })
        });

        console.log('Resposta do servidor:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro do servidor:', errorData);
            throw new Error(errorData.message || 'Erro ao criar associação');
        }

        const result = await response.json();
        console.log('Associação criada com sucesso:', result);
        return result;
    } catch (error) {
        console.error('Erro ao criar associação:', error);
        throw error;
    }
}

// Função de teste para unificação de produtos (pode ser chamada no console)
// Função para testar apenas a unificação sem interface
window.testUnificationSimple = async function() {
    try {
        console.log('🧪 Teste simples de unificação...');
        
        // Buscar produtos
        const products = await api.getAllProducts();
        if (products.length < 2) {
            console.log('❌ Precisa de pelo menos 2 produtos');
            return;
        }
        
        const product1 = products[0];
        const product2 = products[1];
        
        console.log('📦 Produto 1:', product1.name, '(ID:', product1.id, ')');
        console.log('📦 Produto 2:', product2.name, '(ID:', product2.id, ')');
        
        // Fazer unificação diretamente
        const result = await createProductAssociation(product2.id, product1.id, false);
        console.log('✅ Resultado:', result);
        
        // Verificar resultado após 1 segundo
        setTimeout(async () => {
            const updatedProducts = await api.getAllProducts();
            const maintained = updatedProducts.find(p => p.id === product1.id);
            const removed = updatedProducts.find(p => p.id === product2.id);
            
            console.log('📊 Após unificação:');
            console.log('  Produto 1 existe:', maintained ? 'SIM' : 'NÃO');
            console.log('  Produto 2 existe:', removed ? 'SIM' : 'NÃO');
            
            if (maintained) {
                console.log('  Quantidade total:', maintained.total_quantity);
                console.log('  Preço médio:', maintained.average_price);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
};

window.testUnification = async function() {
    console.log('🧪 Testando sistema de unificação de produtos...');
    
    // Buscar produtos existentes
    const products = await api.getAllProducts();
    console.log('📦 Produtos disponíveis:', products);
    
    if (products.length >= 2) {
        const product1 = products[0];
        const product2 = products[1];
        
        console.log(`🔄 Testando unificação: ${product1.name} (${product1.id}) + ${product2.name} (${product2.id})`);
        console.log('⚠️ ATENÇÃO: O produto secundário será removido e seu histórico transferido para o principal!');
        
        // Mostrar dados ANTES da unificação
        console.log('📊 === DADOS ANTES DA UNIFICAÇÃO ===');
        console.log(`Produto 1 (${product1.name}):`, product1);
        console.log(`Produto 2 (${product2.name}):`, product2);
        
        // Debug: Verificar purchase_items antes da unificação
        console.log('🔍 === DEBUG: Verificando purchase_items antes da unificação ===');
        try {
            const debug1 = await api.get(`/api/debug/products/${product1.id}`);
            console.log('📦 Purchase items do produto 1:', debug1);
        } catch (e) {
            console.log('❌ Erro ao buscar debug do produto 1:', e);
        }
        
        try {
            const debug2 = await api.get(`/api/debug/products/${product2.id}`);
            console.log('📦 Purchase items do produto 2:', debug2);
        } catch (e) {
            console.log('❌ Erro ao buscar debug do produto 2:', e);
        }
        
        // Mostrar alerta de confirmação
        const confirm = window.confirm(`Deseja realmente unificar os produtos?\n\n- ${product1.name} (ID: ${product1.id})\n- ${product2.name} (ID: ${product2.id})\n\nO produto ${product2.name} será removido e seu histórico transferido para ${product1.name}.`);
        
        if (confirm) {
            try {
                // Sempre manter o segundo produto (product2) como principal
                const result = await createProductAssociation(product2.id, product1.id, false);
                console.log('✅ Teste de unificação bem-sucedido!');
                console.log('📋 Resultado da unificação:', result);
                
                // Aguardar um pouco e verificar os dados APÓS a unificação
                setTimeout(async () => {
                    console.log('📊 === VERIFICANDO DADOS APÓS UNIFICAÇÃO ===');
                    const productsAfter = await api.getAllProducts();
                    
                    console.log(`📦 Total de produtos após unificação: ${productsAfter.length}`);
                    console.log('📋 Produtos restantes:');
                    productsAfter.forEach((p, index) => {
                        console.log(`  ${index + 1}. ID: ${p.id}, Nome: "${p.name}", Código: "${p.code}"`);
                    });
                    
                    // Procurar pelos produtos que deveriam existir
                    const product1After = productsAfter.find(p => p.id === product1.id);
                    const product2After = productsAfter.find(p => p.id === product2.id);
                    
                    console.log(`🔍 Produto 1 (ID ${product1.id}) ainda existe:`, product1After ? 'SIM' : 'NÃO');
                    console.log(`🔍 Produto 2 (ID ${product2.id}) ainda existe:`, product2After ? 'SIM' : 'NÃO');
                    
                    if (product1After) {
                        console.log(`✅ Produto mantido (${product1After.name}):`, product1After);
                        console.log(`📊 Quantidade total: ${product1After.total_quantity}`);
                        console.log(`📊 Preço médio: ${product1After.average_price}`);
                        console.log(`📊 Fornecedores: ${product1After.suppliers}`);
                        
                        // Debug: Verificar purchase_items após a unificação
                        try {
                            const debugAfter = await api.get(`/api/debug/products/${product1After.id}`);
                            console.log('📦 Purchase items após unificação:', debugAfter);
                        } catch (e) {
                            console.log('❌ Erro ao buscar debug após unificação:', e);
                        }
                    } else if (product2After) {
                        console.log(`✅ Produto mantido (${product2After.name}):`, product2After);
                        console.log(`📊 Quantidade total: ${product2After.total_quantity}`);
                        console.log(`📊 Preço médio: ${product2After.average_price}`);
                        console.log(`📊 Fornecedores: ${product2After.suppliers}`);
                        
                        // Debug: Verificar purchase_items após a unificação
                        try {
                            const debugAfter = await api.get(`/api/debug/products/${product2After.id}`);
                            console.log('📦 Purchase items após unificação:', debugAfter);
                        } catch (e) {
                            console.log('❌ Erro ao buscar debug após unificação:', e);
                        }
                    } else {
                        console.log('❌ Nenhum dos produtos originais foi encontrado!');
                    }
                }, 2000);
                
                alert(`✅ Unificação concluída!\n\nO produto "${product2.name}" agora contém todo o estoque e histórico de "${product1.name}".`);
                
                // Atualizar a interface automaticamente
                console.log('🔄 Atualizando interface após teste de unificação...');
                await fetchAllData();
                console.log('✅ Interface atualizada após teste!');
            } catch (error) {
                console.error('❌ Erro no teste de unificação:', error);
                alert('❌ Erro na unificação: ' + error.message);
            }
        } else {
            console.log('❌ Teste cancelado pelo usuário');
        }
    } else {
        console.log('❌ Não há produtos suficientes para testar (mínimo 2)');
        alert('❌ É necessário ter pelo menos 2 produtos para testar a unificação');
    }
};

// Função de debug para verificar produto específico
window.debugProduct = async function(productId) {
    console.log('🔍 Debugando produto ID:', productId);
    
    try {
        const response = await fetch(`/api/debug/products/${productId}`, {
            headers: {
                'X-User-Id': localStorage.getItem('userId'),
                'X-Group-Id': localStorage.getItem('groupId'),
                'X-User-Role': localStorage.getItem('userRole')
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Dados do produto:', data);
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao debugar produto:', error);
        throw error;
    }
};

// Função para verificar produtos duplicados
window.checkDuplicates = async function() {
    console.log('🔍 Verificando produtos duplicados...');
    
    const products = await api.getAllProducts();
    console.log('📦 Total de produtos:', products.length);
    
    // Agrupar por nome e código
    const groups = {};
    products.forEach(product => {
        const key = `${product.name}|${product.code || 'NULL'}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(product);
    });
    
    // Encontrar duplicados
    const duplicates = Object.entries(groups).filter(([key, products]) => products.length > 1);
    
    if (duplicates.length > 0) {
        console.log('⚠️ Produtos duplicados encontrados:');
        duplicates.forEach(([key, products]) => {
            console.log(`📋 "${key}":`, products.map(p => `ID ${p.id}`).join(', '));
        });
        
        // Mostrar alerta
        alert(`⚠️ Encontrados ${duplicates.length} grupos de produtos duplicados!\n\nVerifique o console para detalhes.`);
    } else {
        console.log('✅ Nenhum produto duplicado encontrado');
        alert('✅ Nenhum produto duplicado encontrado');
    }
    
    return duplicates;
};

// Inicialização
init();