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
    
    // Páginas
    dashboardPage: document.getElementById('dashboard-page'),
    contasPage: document.getElementById('contas-page'),
    transacoesPage: document.getElementById('transacoes-page'),
    usuariosPage: document.getElementById('usuarios-page'),
    categoriasPage: document.getElementById('categorias-page'), // Nova página de categorias
    
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
    
    // Novos elementos do Dashboard para filtros e gráficos
    dashboardFiltersForm: document.getElementById('dashboard-filters-form'),
    dashboardFilterPeriodType: document.getElementById('dashboard-filter-period-type'),
    dashboardFilterDateStart: document.getElementById('dashboard-filter-date-start'),
    dashboardFilterDateEnd: document.getElementById('dashboard-filter-date-end'),
    dashboardFilterTransactionType: document.getElementById('dashboard-filter-transaction-type'),
    dashboardFilterCategory: document.getElementById('dashboard-filter-category'),
    dashboardFilterAccount: document.getElementById('dashboard-filter-account'),
    dashboardApplyFiltersButton: document.getElementById('dashboard-apply-filters-button'),
    dashboardClearFiltersButton: document.getElementById('dashboard-clear-filters-button'),
    pieChartCanvas: document.getElementById('pieChartCanvas'),
    barChartCanvas: document.getElementById('barChartCanvas'),
    
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
    transactionTableBody: document.getElementById('transaction-table-body'),
    calendarIconBtn: document.querySelector('.calendar-icon-btn'),
    multiplierInput: document.getElementById('multiplier-input'), // Novo campo multiplicador
    
    // Categorias
    categoryNameInput: document.getElementById('category-name'),
    categoryTypeSelect: document.getElementById('category-type'),
    categoryForm: document.getElementById('category-form'),
    categoriesList: document.getElementById('categories-list'),
    categorySelect: document.getElementById('category-select'), // Select de categorias no formulário de transações
    
    // Filtros de Transações
    transactionFiltersForm: document.getElementById('transaction-filters-form'),
    filterDateRangeStart: document.getElementById('filter-date-range-start'),
    filterDateRangeEnd: document.getElementById('filter-date-range-end'),
    filterDateTypeCreated: document.getElementById('filter-date-type-created'),
    filterDateTypeDue: document.getElementById('filter-date-type-due'),
    filterDateTypeConfirmed: document.getElementById('filter-date-type-confirmed'),
    filterTypeIncome: document.getElementById('filter-type-income'),
    filterTypeExpense: document.getElementById('filter-type-expense'),
    filterConfirmedSelect: document.getElementById('filter-confirmed'),
    applyFiltersButton: document.getElementById('apply-filters-button'),
    clearFiltersButton: document.getElementById('clear-filters-button'), // Novo botão

    // Usuários
    newUsernameInput: document.getElementById('new-username'),
    addUserNotificationPasswordInput: document.getElementById('new-password'), // Renomeado
    newWhatsappInput: document.getElementById('new-whatsapp'),
    newInstagramInput: document.getElementById('new-instagram'),
    newEmailInput: document.getElementById('new-email'),
    addUserForm: document.getElementById('add-user-form'),
    groupUsersList: document.getElementById('group-users-list'),
    
    // Gerenciamento de Usuários (Admin)
    adminUsersPage: document.getElementById('admin-users-page'),
    adminUsersList: document.getElementById('admin-users-list'),
    pendingUsersList: document.getElementById('pending-users-list'), // Novo elemento

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

    // Alterar Senha (Modal)
    changePasswordModal: document.getElementById('changePasswordModal'),
    changePasswordForm: document.getElementById('change-password-form'),
    currentPasswordInput: document.getElementById('current-password'),
    changePasswordNewPasswordInput: document.getElementById('change-new-password'), // ID atualizado e renomeado
    changePasswordConfirmNewPasswordInput: document.getElementById('confirm-new-password'), // Renomeado
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

// Variáveis globais para os objetos Chart.js
let pieChartInstance = null;
let barChartInstance = null;

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
        // Se for para o dashboard, popular os filtros e desenhar os gráficos
        if (pageName === 'dashboard') {
            render.populateDashboardFilters();
            // Os gráficos serão renderizados após fetchAllData no main.js
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
        elements.registerScreen.classList.add('hidden');
        elements.mainApp.classList.add('hidden');
        elements.loginScreen.classList.remove('hidden');
        elements.errorMessage.classList.add('hidden'); // Esconde erro anterior
        render.resetForm(); // Reset do formulário de login
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
                    console.log(`Transação confirmada: ${transaction.description}, Tipo: ${transaction.type}, Valor: ${amount}, É Transferência: ${transaction.is_transfer}`);
                    
                    // Se não for uma transferência, contribui para a receita/despesa total consolidada
                    if (!transaction.is_transfer) {
                        if (transaction.type === 'income') {
                            totalIncome += amount;
                        } else if (transaction.type === 'expense') {
                            totalExpense += amount;
                        }
                    }

                    // Sempre afeta o saldo da conta individual
                    if (transaction.type === 'income') {
                        if (accountBalances[transaction.account_id]) {
                            accountBalances[transaction.account_id].income += amount;
                            console.log(`Receita adicionada à conta ${transaction.account_id}: +${amount}`);
                        } else {
                            console.log(`AVISO: Conta ${transaction.account_id} não encontrada para receita`);
                        }
                    } else if (transaction.type === 'expense') {
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
    
    // Popula os selects de contas e categorias nos filtros do dashboard
    populateDashboardFilters: () => {
        // Popula o select de contas
        elements.dashboardFilterAccount.innerHTML = '<option value="">Todas</option>';
        state.allAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            elements.dashboardFilterAccount.appendChild(option);
        });

        // Popula o select de categorias
        elements.dashboardFilterCategory.innerHTML = '<option value="">Todas</option>';
        state.allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            elements.dashboardFilterCategory.appendChild(option);
        });
    },

    renderPieChart: (transactions, filterBy = 'category') => {
        if (pieChartInstance) {
            pieChartInstance.destroy();
        }
        
        const ctx = elements.pieChartCanvas.getContext('2d');
        const dataMap = {};
        
        transactions.filter(t => t.is_confirmed).forEach(t => {
            let key;
            let label;

            if (filterBy === 'category') {
                key = t.category_id || 'N/A';
                label = t.category_name || 'Sem Categoria';
            } else if (filterBy === 'type') {
                key = t.type;
                label = t.type === 'income' ? 'Receita' : 'Despesa';
            }

            if (dataMap[key]) {
                dataMap[key].amount += parseFloat(t.amount);
            } else {
                dataMap[key] = { label, amount: parseFloat(t.amount) };
            }
        });

        const labels = Object.values(dataMap).map(d => d.label);
        const data = Object.values(dataMap).map(d => d.amount);
        const backgroundColors = generateColors(labels.length);

        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `Distribuição por ${filterBy === 'category' ? 'Categoria' : 'Tipo'}`
                    }
                }
            },
        });
    },

    renderBarChart: (transactions) => {
        if (barChartInstance) {
            barChartInstance.destroy();
        }

        const ctx = elements.barChartCanvas.getContext('2d');
        const monthlyData = {}; // { 'YYYY-MM': { income: X, expense: Y } }

        transactions.filter(t => t.is_confirmed).forEach(t => {
            const date = new Date(t.due_date || t.created_at);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const amount = parseFloat(t.amount);

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0 };
            }

            if (t.type === 'income') {
                monthlyData[monthYear].income += amount;
            } else if (t.type === 'expense') {
                monthlyData[monthYear].expense += amount;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const incomes = sortedMonths.map(month => monthlyData[month].income);
        const expenses = sortedMonths.map(month => monthlyData[month].expense);

        barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Receitas',
                        data: incomes,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    },
                    {
                        label: 'Despesas',
                        data: expenses,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: false,
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Evolução Mensal de Receitas e Despesas'
                    }
                }
            }
        });
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
        elements.transactionTableBody.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            const noTransactionsRow = document.createElement('tr');
            noTransactionsRow.innerHTML = '<td colspan="9" class="text-center text-muted py-4">Nenhuma transação encontrada para os filtros aplicados.</td>';
            elements.transactionTableBody.appendChild(noTransactionsRow);
            return;
        }

        transactions.forEach(transaction => {
            const tr = document.createElement('tr');
            tr.className = 'transaction-row';
            tr.dataset.id = transaction.id; // Adiciona o ID para facilitar a manipulação de eventos
            
            const accountName = transaction.account_name || transaction.original_account_name || 'Conta não encontrada';
            const amountClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            
            const confirmButtonHtml = transaction.is_confirmed ? 
                '<span class="badge bg-success">Confirmada</span>' : 
                `<button class="btn btn-sm confirm-button table-action-btn" data-id="${transaction.id}" title="Confirmar"><i class="fas fa-check"></i></button>`;
            
            const editButtonHtml = `<button class="btn btn-sm edit-button table-action-btn" data-id="${transaction.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>`;
            const deleteButtonHtml = `<button class="btn btn-sm delete-button table-action-btn" data-id="${transaction.id}" title="Deletar"><i class="fas fa-times"></i></button>`;

            tr.innerHTML = `
                <td>${transaction.description}</td>
                <td class="${amountClass} text-end">${amountPrefix}R$ ${parseFloat(transaction.amount).toFixed(2).replace('.', ',')}</td>
                <td>${transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
                <td>${accountName}</td>
                <td>${transaction.category_name || 'N/A'}</td>
                <td>${formatDateForDisplay(transaction.created_at)}</td>
                <td>${transaction.due_date ? formatDateForDisplay(transaction.due_date) : 'N/A'}</td>
                <td>${transaction.is_confirmed && transaction.confirmed_at ? formatDateForDisplay(transaction.confirmed_at) : 'Não Confirmada'}</td>
                <td>${transaction.creator_name || 'N/A'}</td>
                <td class="text-nowrap">
                    ${confirmButtonHtml}
                    ${editButtonHtml}
                    ${deleteButtonHtml}
                </td>
            `;
            
            elements.transactionTableBody.appendChild(tr);
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
                   <button class="btn btn-sm me-2 edit-collaborator-button table-action-btn" data-id="${user.id}" title="Editar">
                       <i class="fas fa-edit"></i>
                   </button>
                    ${user.id == state.userId ? 
                        '<span class="badge cannot-delete-badge">Não pode deletar</span>' : 
                        `<button class="btn btn-sm delete-collaborator-button table-action-btn" data-id="${user.id}" data-username="${user.username}" title="Deletar">
                            <i class="fas fa-trash"></i>
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
        elements.transactionDateInput.value = '';
        elements.transactionDateDisplayInput.value = '';
        elements.formTitle.textContent = 'Adicionar Transação';
        elements.submitButton.textContent = 'Adicionar';
        elements.multiplierInput.value = 1; // Reseta o multiplicador para 1
        elements.categorySelect.value = ''; // Reseta o campo de categoria
        // As linhas de reset para os campos de adição de usuário foram movidas para serem chamadas apenas após o sucesso do cadastro.
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

   // Renderiza a lista de usuários pendentes de aprovação
   renderPendingUsers: (users) => {
       elements.pendingUsersList.innerHTML = '';
       if (!users || users.length === 0) {
           elements.pendingUsersList.innerHTML = '<li class="list-group-item text-center">Nenhum usuário pendente de aprovação.</li>';
           return;
       }
       users.forEach(user => {
           const li = document.createElement('li');
           li.className = 'list-group-item d-flex justify-content-between align-items-center';
           li.innerHTML = `
               <div>
                   <strong>${user.username}</strong> 
                   <small class="text-muted">(${user.email})</small>
               </div>
               <button class="btn btn-success btn-sm approve-user-button" data-id="${user.id}" data-username="${user.username}">
                   <i class="fas fa-check"></i> Aprovar
               </button>
           `;
           elements.pendingUsersList.appendChild(li);
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
       elements.changePasswordNewPasswordInput.setCustomValidity(''); // Atualizado para o novo nome
       elements.changePasswordConfirmNewPasswordInput.setCustomValidity(''); // Atualizado para o novo nome
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

    // Categorias
    renderCategoriesList: (categories) => {
        elements.categoriesList.innerHTML = '';
        if (!categories || categories.length === 0) {
            elements.categoriesList.innerHTML = '<li class="list-group-item text-center text-muted">Nenhuma categoria cadastrada.</li>';
            return;
        }
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            const typeBadgeClass = category.type === 'income' ? 'bg-success' : 'bg-danger';
            const typeText = category.type === 'income' ? 'Receita' : 'Despesa';
            li.innerHTML = `
                <div>
                    <strong>${category.name}</strong>
                    <span class="badge ${typeBadgeClass} ms-2">${typeText}</span>
                </div>
                <div>
                    <button class="btn btn-info btn-sm me-2 edit-category-button" data-id="${category.id}" data-name="${category.name}" data-type="${category.type}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm delete-category-button" data-id="${category.id}" data-name="${category.name}">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </div>
            `;
            elements.categoriesList.appendChild(li);
        });
    },

    populateCategorySelect: (categories, currentType) => {
        elements.categorySelect.innerHTML = '<option value="">Nenhuma</option>';
        const filteredCategories = categories.filter(cat => !currentType || cat.type === currentType);

        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            elements.categorySelect.appendChild(option);
        });
    },
};

// Função para gerar cores aleatórias (para os gráficos)
function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 137 + 50) % 360; // Usa um algoritmo para distribuir as cores
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}