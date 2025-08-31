import { state } from './state.js';
import { formatDateForDisplay, getTodayDate } from './utils.js';

export const elements = {
    // Login
    loginScreen: document.getElementById('login-screen'),
    mainApp: document.getElementById('main-app'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginForm: document.getElementById('login-form'),
    errorMessage: document.getElementById('error-message'),
    
    // Registro
    registerScreen: document.getElementById('register-screen'),
    registerForm: document.getElementById('register-form'),
    registerUsernameInput: document.getElementById('register-username'),
    registerPasswordInput: document.getElementById('register-password'),
    registerConfirmPasswordInput: document.getElementById('register-confirm-password'),
    registerWhatsappInput: document.getElementById('register-whatsapp'),
    registerInstagramInput: document.getElementById('register-instagram'),
    registerEmailInput: document.getElementById('register-email'),
    consentLgpdCheckbox: document.getElementById('consent-lgpd'),
    registerErrorMessage: document.getElementById('register-error-message'),
    passwordStrength: document.getElementById('password-strength'),
    showRegisterLink: document.getElementById('show-register-link'),
    showLoginLink: document.getElementById('show-login-link'),

    // Menu e navegação
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    sidebarToggleMobile: document.getElementById('sidebar-toggle-mobile'),
    mainContent: document.getElementById('main-content'),
    pageTitle: document.getElementById('page-title'),
    currentUser: document.getElementById('current-user'),
    adminUsersLinkItem: document.getElementById('admin-users-link-item'), // Novo elemento para o link Gerenciar Usuários
    
    // Páginas
    dashboardPage: document.getElementById('dashboard-page'),
    contasPage: document.getElementById('contas-page'),
    transacoesPage: document.getElementById('transacoes-page'),
    usuariosPage: document.getElementById('usuarios-page'),
    
    // Dashboard
    totalIncomeEl: document.getElementById('total-income'),
    totalExpenseEl: document.getElementById('total-expense'),
    balanceEl: document.getElementById('balance'),
    accountsSummaryList: document.getElementById('accounts-summary-list'),
    accountsDetailedSummary: document.getElementById('accounts-detailed-summary'),
    accountsDetailedTable: document.getElementById('accounts-detailed-table'),
    grandTotalIncome: document.getElementById('grand-total-income'),
    grandTotalExpense: document.getElementById('grand-total-expense'),
    grandTotalBalance: document.getElementById('grand-total-balance'),
    grandTotalStatus: document.getElementById('grand-total-status'),
    
    // Contas
    accountNameInput: document.getElementById('account-name'),
    accountForm: document.getElementById('account-form'),
    accountsList: document.getElementById('accounts-list'),
    
    // Transferência
    transferForm: document.getElementById('transfer-form'),
    fromAccountSelect: document.getElementById('from-account'),
    toAccountSelect: document.getElementById('to-account'),
    transferAmountInput: document.getElementById('transfer-amount'),
    transferDescriptionInput: document.getElementById('transfer-description'),
    transferButton: document.getElementById('transfer-button'),
    fromAccountBalance: document.getElementById('from-account-balance'),
    maxTransferAmount: document.getElementById('max-transfer-amount'),
    
    // Transações
    transactionIdInput: document.getElementById('transaction-id'),
    accountSelect: document.getElementById('account-select'),
    descriptionInput: document.getElementById('description'),
    amountInput: document.getElementById('amount'),
    typeInput: document.getElementById('type'),
    transactionDateInput: document.getElementById('transaction-date'),
    transactionDateDisplayInput: document.getElementById('transaction-date-display'),
    formTitle: document.getElementById('form-title'),
    submitButton: document.getElementById('submit-button'),
    transactionForm: document.getElementById('transaction-form'),
    transactionList: document.getElementById('transaction-list'),
    calendarIconBtn: document.querySelector('.calendar-icon-btn'),
    numParcelsInput: document.getElementById('num-parcels'), // Novo elemento
    
    // Usuários
    newUsernameInput: document.getElementById('new-username'),
    newPasswordInput: document.getElementById('new-password'),
    newWhatsappInput: document.getElementById('new-whatsapp'),
    newInstagramInput: document.getElementById('new-instagram'),
    newEmailInput: document.getElementById('new-email'),
    addUserForm: document.getElementById('add-user-form'),
    groupUsersList: document.getElementById('group-users-list'),
    
    // Gerenciamento de Usuários (Admin)
    adminUsersPage: document.getElementById('admin-users-page'),
    adminUsersList: document.getElementById('admin-users-list'),

    // Botões
    logoutButton: document.getElementById('logout-button'),

    // Edição de Usuário (Modal)
    editUserModal: document.getElementById('editUserModal'),
    editUserForm: document.getElementById('edit-user-form'),
    editUsernameInput: document.getElementById('edit-username'),
    editWhatsappInput: document.getElementById('edit-whatsapp'),
    editInstagramInput: document.getElementById('edit-instagram'),
    editEmailInput: document.getElementById('edit-email'),
    editConsentLgpdCheckbox: document.getElementById('edit-consent-lgpd'),
    editRoleGroup: document.getElementById('edit-role-group'),
    editRoleSelect: document.getElementById('edit-role'),
    editGroupIdGroup: document.getElementById('edit-group-id-group'),
    editGroupIdInput: document.getElementById('edit-group-id'),
    editUserErrorMessage: document.getElementById('edit-user-error-message'),

    // Gerenciar Categorias
    categoryNameInput: document.getElementById('category-name'),
    categoryTypeIncomeCheckbox: document.getElementById('category-type-income'), // Novo
    categoryTypeExpenseCheckbox: document.getElementById('category-type-expense'), // Novo
    categoryForm: document.getElementById('category-form'),
    categoriesList: document.getElementById('categories-list'),
    categorySelect: document.getElementById('category-select'), // Select de categoria no formulário de transações

    // Alterar Senha (Modal)
    changePasswordModal: document.getElementById('changePasswordModal'),
    changePasswordForm: document.getElementById('change-password-form'),
    currentPasswordInput: document.getElementById('current-password'),
    newPasswordInput: document.getElementById('change-new-password'), // ID atualizado
    confirmNewPasswordInput: document.getElementById('confirm-new-password'),
    changePasswordErrorMessage: document.getElementById('change-password-error-message'),
    newPasswordStrength: document.getElementById('new-password-strength'),
};

// Função auxiliar para renderizar o resumo detalhado
const renderDetailedAccountsSummary = (accountBalances, totalIncome, totalExpense, totalBalance) => {
    console.log('--- Renderizando resumo detalhado ---');
    console.log('Account Balances:', accountBalances);
    console.log('Total Income:', totalIncome);
    console.log('Total Expense:', totalExpense);
    console.log('Total Balance:', totalBalance);
    
    // Renderiza o resumo compacto (card superior direito)
    let summaryHTML = '';
    Object.values(accountBalances).forEach(account => {
        const balanceClass = account.balance >= 0 ? 'text-success' : 'text-danger';
        const balanceText = account.balance >= 0 ? 
            `+R$ ${account.balance.toFixed(2).replace('.', ',')}` : 
            `-R$ ${Math.abs(account.balance).toFixed(2).replace('.', ',')}`;
        
        summaryHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-medium">${account.name}</span>
                <span class="${balanceClass} fw-bold">${balanceText}</span>
            </div>
        `;
    });
    
    console.log('Summary HTML:', summaryHTML);
    elements.accountsDetailedSummary.innerHTML = summaryHTML;
    
    // Renderiza a tabela detalhada
    let tableHTML = '';
    Object.values(accountBalances).forEach(account => {
        const balanceClass = account.balance >= 0 ? 'text-success' : 'text-danger';
        const balanceText = account.balance >= 0 ? 
            `+R$ ${account.balance.toFixed(2).replace('.', ',')}` : 
            `-R$ ${Math.abs(account.balance).toFixed(2).replace('.', ',')}`;
        
        const statusClass = account.balance >= 0 ? 'bg-success' : 'bg-danger';
        const statusText = account.balance >= 0 ? 'Positivo' : 'Negativo';
        
        tableHTML += `
            <tr>
                <td class="fw-medium">${account.name}</td>
                <td class="text-center text-success">R$ ${account.income.toFixed(2).replace('.', ',')}</td>
                <td class="text-center text-danger">R$ ${account.expense.toFixed(2).replace('.', ',')}</td>
                <td class="text-center ${balanceClass} fw-bold">${balanceText}</td>
                <td class="text-center">
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
            </tr>
        `;
    });
    
    console.log('Table HTML:', tableHTML);
    elements.accountsDetailedTable.innerHTML = tableHTML;
    
    // Atualiza os totais gerais
    elements.grandTotalIncome.textContent = `R$ ${totalIncome.toFixed(2).replace('.', ',')}`;
    elements.grandTotalExpense.textContent = `R$ ${totalExpense.toFixed(2).replace('.', ',')}`;
    elements.grandTotalBalance.textContent = `R$ ${totalBalance.toFixed(2).replace('.', ',')}`;
    
    // Status geral
    const grandStatusClass = totalBalance >= 0 ? 'bg-success' : 'bg-danger';
    const grandStatusText = totalBalance >= 0 ? 'Positivo' : 'Negativo';
    elements.grandTotalStatus.className = `badge ${grandStatusClass}`;
    elements.grandTotalStatus.textContent = grandStatusText;
    
    console.log('--- Resumo detalhado renderizado com sucesso ---');
};

export const render = {
    // Navegação
    showPage: (pageName) => {
        // Esconde todas as páginas
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Remove classe active de todos os links
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Mostra a página selecionada
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        // Controla a visibilidade das páginas de usuários com base no papel
        if (pageName === 'admin-users' && state.userRole !== 'admin') {
            // Se não for admin, redireciona para dashboard e esconde a página admin
            elements.adminUsersPage.classList.add('hidden');
            render.showPage('dashboard');
            alert('Acesso negado. Apenas administradores podem gerenciar usuários do sistema.');
            return;
        } else if (pageName === 'usuarios' && state.userRole === 'admin') {
            // Se for admin e tentar acessar usuarios-page, redireciona para admin-users
            elements.usuariosPage.classList.add('hidden');
            render.showPage('admin-users');
            return;
        } else if (pageName === 'usuarios' && state.userRole !== 'admin' && state.userRole !== 'user') {
            // Se não for admin nem user, redireciona para dashboard
            elements.usuariosPage.classList.add('hidden');
            render.showPage('dashboard');
            alert('Acesso negado. Você não tem permissão para ver usuários.');
            return;
        }
        
        // Ativa o link correspondente
        const targetLink = document.querySelector(`[data-page="${pageName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Atualiza o título da página
        const pageTitles = {
            'dashboard': 'Dashboard',
            'contas': 'Contas Bancárias',
            'transacoes': 'Transações',
            'usuarios': 'Usuários do Grupo',
            'transferencia': 'Transferência de Saldo',
            'register': 'Criar Nova Conta',
            'login': 'Acesso Protegido',
            'admin-users': 'Gerenciar Usuários'
        };
        
        if (elements.pageTitle) {
            elements.pageTitle.textContent = pageTitles[pageName] || 'Página';
        }
        
        state.currentPage = pageName;
        
        // Se navegou para a página de contas, atualiza o formulário de transferência
        if (pageName === 'contas' && state.accountBalances) {
            render.updateTransferForm();
        }
    },
    
    // Menu lateral
    toggleSidebar: () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        
        if (state.sidebarCollapsed) {
            elements.sidebar.classList.add('collapsed');
            elements.mainContent.classList.add('expanded');
        } else {
            elements.sidebar.classList.remove('collapsed');
            elements.mainContent.classList.remove('expanded');
        }
    },
    
    // Login/Logout
    showMainApp: () => {
        elements.loginScreen.classList.add('hidden');
        elements.mainApp.classList.remove('hidden');
        elements.currentUser.textContent = state.username;
    },
    
    showLoginScreen: () => {
        elements.mainApp.classList.add('hidden');
        elements.loginScreen.classList.remove('hidden');
    },
    
    showLoginError: (message) => {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.remove('hidden');
    },
    
    hideLoginError: () => {
        elements.errorMessage.classList.add('hidden');
    },

    showRegisterScreen: () => {
        elements.loginScreen.classList.add('hidden');
        elements.mainApp.classList.add('hidden');
        elements.registerScreen.classList.remove('hidden');
        elements.registerErrorMessage.classList.add('hidden'); // Esconde erro anterior
        render.resetRegistrationForm();
    },

    showLoginScreen: () => {
        elements.registerScreen.classList.add('hidden');
        elements.mainApp.classList.add('hidden');
        elements.loginScreen.classList.remove('hidden');
        elements.errorMessage.classList.add('hidden'); // Esconde erro anterior
        render.resetForm(); // Reset do formulário de login
    },
    
    // Dashboard
    calculateBalances: (transactions) => {
        console.log('--- INICIANDO CÁLCULO DE SALDOS ---');
        console.log('Transações recebidas:', transactions);
        console.log('Estado das contas:', state.allAccounts);
        
        let totalIncome = 0;
        let totalExpense = 0;
        
        // Verifica se existem contas
        if (!state.allAccounts || state.allAccounts.length === 0) {
            console.log('ERRO: Nenhuma conta encontrada no state');
            elements.totalIncomeEl.textContent = 'R$ 0,00';
            elements.totalExpenseEl.textContent = 'R$ 0,00';
            elements.balanceEl.textContent = 'R$ 0,00';
            renderDetailedAccountsSummary({}, 0, 0, 0);
            return;
        }
        
        // Inicializa o objeto para armazenar dados por conta
        const accountBalances = {};
        state.allAccounts.forEach(account => {
            console.log('Inicializando conta:', account);
            accountBalances[account.id] = {
                name: account.name,
                income: 0,
                expense: 0,
                balance: 0
            };
        });
        
        console.log('Contas inicializadas:', accountBalances);
        
        // Processa as transações
        if (transactions && Array.isArray(transactions)) {
            transactions.forEach(transaction => {
                console.log('Processando transação:', transaction);
                
                // Só considera transações confirmadas
                if (transaction.is_confirmed) {
                    const amount = parseFloat(transaction.amount) || 0;
                    console.log(`Transação confirmada: ${transaction.description}, Tipo: ${transaction.type}, Valor: ${amount}`);
                    
                    if (transaction.type === 'income') {
                        totalIncome += amount;
                        if (accountBalances[transaction.account_id]) {
                            accountBalances[transaction.account_id].income += amount;
                            console.log(`Receita adicionada à conta ${transaction.account_id}: +${amount}`);
                        } else {
                            console.log(`AVISO: Conta ${transaction.account_id} não encontrada para receita`);
                        }
                    } else if (transaction.type === 'expense') {
                        totalExpense += amount;
                        if (accountBalances[transaction.account_id]) {
                            accountBalances[transaction.account_id].expense += amount;
                            console.log(`Despesa adicionada à conta ${transaction.account_id}: +${amount}`);
                        } else {
                            console.log(`AVISO: Conta ${transaction.account_id} não encontrada para despesa`);
                        }
                    }
                } else {
                    console.log(`Transação ${transaction.description} não está confirmada`);
                }
            });
        } else {
            console.log('AVISO: Nenhuma transação encontrada ou array inválido');
        }
        
        // Calcula o saldo de cada conta
        Object.values(accountBalances).forEach(account => {
            account.balance = account.income - account.expense;
            console.log(`Saldo da conta ${account.name}: ${account.balance} (${account.income} - ${account.expense})`);
        });
        
        // Salva os saldos no state para uso na transferência
        state.accountBalances = accountBalances;
        
        const totalBalance = totalIncome - totalExpense;
        
        console.log('TOTAIS CALCULADOS:');
        console.log(`Total Income: ${totalIncome}`);
        console.log(`Total Expense: ${totalExpense}`);
        console.log(`Total Balance: ${totalBalance}`);
        console.log('Account Balances:', accountBalances);
        
        // Atualiza o resumo consolidado
        elements.totalIncomeEl.textContent = `R$ ${totalIncome.toFixed(2).replace('.', ',')}`;
        elements.totalExpenseEl.textContent = `R$ ${totalExpense.toFixed(2).replace('.', ',')}`;
        elements.balanceEl.textContent = `R$ ${totalBalance.toFixed(2).replace('.', ',')}`;
        
        // Renderiza o resumo detalhado por conta
        renderDetailedAccountsSummary(accountBalances, totalIncome, totalExpense, totalBalance);
        
        // Se estiver na página de contas, atualiza o formulário de transferência
        if (state.currentPage === 'contas') {
            render.updateTransferForm();
        }
        
        console.log('--- CÁLCULO DE SALDOS CONCLUÍDO ---');
    },
    
    // Contas
    populateAccountSelect: () => {
        elements.accountSelect.innerHTML = '<option value="">Selecione uma conta</option>';
        state.allAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            elements.accountSelect.appendChild(option);
        });
    },
    
    renderAccountsList: () => {
        elements.accountsList.innerHTML = '';
        state.allAccounts.forEach(account => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${account.name}</span>
                <button class="btn btn-danger btn-sm delete-account-button" data-id="${account.id}" data-name="${account.name}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            elements.accountsList.appendChild(li);
        });
    },

    // Categorias
    renderCategoriesList: (categories) => {
        elements.categoriesList.innerHTML = '';
        if (!categories || categories.length === 0) {
            elements.categoriesList.innerHTML = '<li class="list-group-item text-center">Nenhuma categoria encontrada.</li>';
            return;
        }
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${category.name}</span>
                <div>
                    <button class="btn btn-danger btn-sm delete-category-button" data-id="${category.id}" data-name="${category.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            elements.categoriesList.appendChild(li);
        });
    },

    populateCategorySelect: (transactionType) => {
        const selectElement = elements.categorySelect;
        selectElement.innerHTML = '<option value="">Selecione a Categoria</option>';

        const filteredCategories = state.allCategories.filter(cat => 
            cat.type === 'both' || cat.type === transactionType
        );

        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name; // Apenas o nome da categoria
            selectElement.appendChild(option);
        });
    },
    
    // Funções de transferência
    populateTransferSelects: () => {
        elements.fromAccountSelect.innerHTML = '<option value="">Selecione a conta de origem</option>';
        elements.toAccountSelect.innerHTML = '<option value="">Selecione a conta de destino</option>';
        
        state.allAccounts.forEach(account => {
            const fromOption = document.createElement('option');
            fromOption.value = account.id;
            fromOption.textContent = account.name;
            elements.fromAccountSelect.appendChild(fromOption);
            
            const toOption = document.createElement('option');
            toOption.value = account.id;
            toOption.textContent = account.name;
            elements.toAccountSelect.appendChild(toOption);
        });
    },
    
    updateTransferForm: () => {
        const fromAccountId = elements.fromAccountSelect.value;
        const toAccountId = elements.toAccountSelect.value;
        
        // Usa o state
        const balances = state.accountBalances;
        
        if (fromAccountId && balances[fromAccountId]) {
            const balance = balances[fromAccountId].balance;
            elements.fromAccountBalance.textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
            elements.maxTransferAmount.textContent = `R$ ${Math.max(0, balance).toFixed(2).replace('.', ',')}`;
            
            const maxTransfer = Math.max(0, balance);
            elements.transferButton.disabled = maxTransfer <= 0 || !toAccountId || fromAccountId === toAccountId;
        } else {
            elements.fromAccountBalance.textContent = 'R$ 0,00';
            elements.maxTransferAmount.textContent = 'R$ 0,00';
            elements.transferButton.disabled = true;
        }
        
        if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
            elements.transferButton.disabled = true;
        }
    },
    
    // Transações
    transactions: (transactions) => {
        elements.transactionList.innerHTML = '';
        
        transactions.forEach(transaction => {
            const li = document.createElement('li');
            li.className = 'list-group-item transaction-item p-3';
            
            const accountName = transaction.account_name || transaction.original_account_name || 'Conta não encontrada';
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            const confirmButton = transaction.is_confirmed ? 
                '<span class="badge bg-success">Confirmada</span>' : 
                // Botão Confirmar como ícone transparente
                `<a href="#" class="btn-action confirm-button text-success me-2" data-id="${transaction.id}" title="Confirmar"><i class="fas fa-check"></i></a>`;
            
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${transaction.description}</h6>
                        <small class="text-muted">
                            Conta: ${accountName} | 
                            Criado por: ${transaction.creator_name || 'N/A'} | 
                            Data: ${transaction.due_date || 'N/A'} | 
                            Categoria: ${transaction.category_name || 'N/A'}
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="transaction-amount ${amountClass} mb-2">
                            ${amountPrefix}R$ ${transaction.amount.toFixed(2).replace('.', ',')}
                        </div>
                        <div class="transaction-actions">
                            ${confirmButton}
                            <!-- Botão Editar como ícone transparente -->
                            <a href="#" class="btn-action edit-button text-warning me-2" data-id="${transaction.id}" title="Editar">
                                <i class="fas fa-pencil-alt"></i>
                            </a>
                            <!-- Botão Deletar como ícone transparente -->
                            <a href="#" class="btn-action delete-button text-danger" data-id="${transaction.id}" title="Deletar">
                                <i class="fas fa-times"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            elements.transactionList.appendChild(li);
        });
    },
    
    // Usuários
    renderGroupUsers: (users) => {
        elements.groupUsersList.innerHTML = '';
        if (!users || users.length === 0) {
            elements.groupUsersList.innerHTML = '<li class="list-group-item text-center">Nenhum colaborador encontrado.</li>';
            return;
        }
        users.forEach(user => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <strong>${user.username}</strong> 
                    <small class="text-muted">(${user.role})</small><br>
                    <small class="text-muted">ID: ${user.id}</small><br>
                    <small class="text-muted">Email: ${user.email || 'N/A'}</small><br>
                    <small class="text-muted">WhatsApp: ${user.whatsapp || 'N/A'}</small><br>
                    <small class="text-muted">Instagram: ${user.instagram || 'N/A'}</small><br>
                    <small class="text-muted">LGPD: ${user.consent_lgpd === 1 ? 'Sim' : 'Não'}</small>
                </div>
                <div>
                   <button class="btn btn-info btn-sm me-2 edit-collaborator-button" data-id="${user.id}">
                       <i class="fas fa-edit"></i> Editar
                   </button>
                    ${user.id == state.userId ? 
                        '<span class="badge bg-secondary">Não pode deletar</span>' : 
                        `<button class="btn btn-danger btn-sm delete-collaborator-button" data-id="${user.id}" data-username="${user.username}">
                            <i class="fas fa-trash"></i> Deletar
                        </button>`
                    }
                </div>
            `;
            elements.groupUsersList.appendChild(li);
        });
    },
    
    // Formulários
    resetForm: () => {
        elements.transactionIdInput.value = '';
        elements.descriptionInput.value = '';
        elements.amountInput.value = '';
        elements.typeInput.value = 'income';
        elements.accountSelect.value = '';
        elements.categorySelect.value = ''; // Limpa a seleção de categoria
        elements.transactionDateInput.value = '';
        elements.transactionDateDisplayInput.value = '';
        elements.formTitle.textContent = 'Adicionar Transação';
        elements.submitButton.textContent = 'Adicionar';
        elements.newUsernameInput.value = ''; // Limpa o campo de nome de usuário do formulário de adicionar usuário
        elements.newPasswordInput.value = ''; // Limpa o campo de senha do formulário de adicionar usuário
        elements.newWhatsappInput.value = ''; // Limpa o campo de WhatsApp do formulário de adicionar usuário
        elements.newWhatsappInput.closest('.mb-3').style.display = 'block'; // Garante que o campo WhatsApp esteja visível
        elements.newInstagramInput.value = ''; // Limpa o campo de Instagram do formulário de adicionar usuário
        elements.newInstagramInput.closest('.mb-3').style.display = 'block'; // Garante que o campo Instagram esteja visível
        elements.newEmailInput.value = ''; // Limpa o campo de Email do formulário de adicionar usuário
        elements.newEmailInput.closest('.mb-3').style.display = 'block'; // Garante que o campo Email esteja visível
        elements.numParcelsInput.value = 1; // Reseta para 1 parcela
        elements.numParcelsInput.disabled = false; // Habilita o campo de parcelas
    },
    
    // Reset do formulário de transferência
    resetTransferForm: () => {
        elements.transferForm.reset();
        elements.fromAccountBalance.textContent = 'R$ 0,00';
        elements.maxTransferAmount.textContent = 'R$ 0,00';
        elements.transferButton.disabled = true;
    },

    // Reset do formulário de cadastro
    resetRegistrationForm: () => {
        elements.registerForm.reset();
        elements.passwordStrength.innerHTML = '';
        elements.consentLgpdCheckbox.checked = false; // Desmarca o checkbox
        elements.registerErrorMessage.classList.add('hidden');
        elements.registerPasswordInput.setCustomValidity('');
        elements.registerConfirmPasswordInput.value = ''; // Limpa o campo de confirmação de senha
    },
   
   // Renderiza a lista de usuários para a página de administração
   renderAdminUsers: (users) => {
       elements.adminUsersList.innerHTML = '';
       if (!users || users.length === 0) {
           elements.adminUsersList.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum usuário encontrado.</td></tr>';
           return;
       }
       users.forEach(user => {
           const tr = document.createElement('tr');
           tr.innerHTML = `
               <td>${user.id}</td>
               <td>${user.username}</td>
               <td>${user.email || 'N/A'}</td>
               <td>${user.whatsapp || 'N/A'}</td>
               <td>${user.instagram || 'N/A'}</td>
               <td>${user.consent_lgpd === 1 ? '<span class="badge bg-success">Sim</span>' : '<span class="badge bg-danger">Não</span>'}</td>
               <td>${user.group_id}</td>
               <td>${user.role}</td>
               <td>
                   <button class="btn btn-info btn-sm me-2 edit-admin-user-button" data-id="${user.id}">
                       <i class="fas fa-edit"></i> Editar
                   </button>
                   ${user.id == state.userId ? 
                       '<span class="badge bg-secondary">Não pode deletar</span>' : 
                       `<button class="btn btn-danger btn-sm delete-admin-user-button" data-id="${user.id}" data-username="${user.username}">
                           <i class="fas fa-trash"></i> Deletar
                       </button>`
                   }
               </td>
           `;
           elements.adminUsersList.appendChild(tr);
       });
   },

   // Exibe erro no formulário de edição de usuário
   showEditUserError: (message) => {
       elements.editUserErrorMessage.textContent = message;
       elements.editUserErrorMessage.classList.remove('hidden');
   },

   // Esconde erro no formulário de edição de usuário
   hideEditUserError: () => {
       elements.editUserErrorMessage.classList.add('hidden');
   },

   // Reset do formulário de edição de usuário
   resetEditUserForm: () => {
       elements.editUserForm.reset();
       elements.editUserErrorMessage.classList.add('hidden');
   },

   // Exibe erro no formulário de registro
   showRegisterError: (message) => {
       elements.registerErrorMessage.textContent = message;
       elements.registerErrorMessage.classList.remove('hidden');
   },

   // Esconde erro no formulário de registro
   hideRegisterError: () => {
       elements.registerErrorMessage.classList.add('hidden');
   },

   // Reset do formulário de alteração de senha
   resetChangePasswordForm: () => {
       elements.changePasswordForm.reset();
       elements.changePasswordErrorMessage.classList.add('hidden');
       elements.newPasswordStrength.innerHTML = '';
       elements.newPasswordInput.setCustomValidity('');
       elements.confirmNewPasswordInput.setCustomValidity('');
   },

   // Exibe erro no formulário de alteração de senha
   showChangePasswordError: (message) => {
       elements.changePasswordErrorMessage.textContent = message;
       elements.changePasswordErrorMessage.classList.remove('hidden');
   },

   // Esconde erro no formulário de alteração de senha
   hideChangePasswordError: () => {
       elements.changePasswordErrorMessage.classList.add('hidden');
   },
};