const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const accountForm = document.getElementById('account-form');
const accountNameInput = document.getElementById('account-name');
const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const accountSelect = document.getElementById('account-select');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const transactionIdInput = document.getElementById('transaction-id');
const transactionDateInput = document.getElementById('transaction-date');
const transactionDateDisplayInput = document.getElementById('transaction-date-display');
const calendarIconBtn = document.querySelector('.calendar-icon-btn');
const transactionList = document.getElementById('transaction-list');
const accountsSummaryList = document.getElementById('accounts-summary-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const balanceEl = document.getElementById('balance');
const logoutButton = document.getElementById('logout-button');

let userId = null;
let allAccounts = [];

// Funções utilitárias
const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Data Inválida';
    // O construtor de data sem o tempo usa o fuso horário local, resolvendo o problema
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Funções para comunicação com o servidor
const fetchAccounts = async () => {
    try {
        const response = await fetch('/api/accounts', {
            headers: { 'X-User-Id': userId },
        });
        const data = await response.json();
        if (response.ok) {
            allAccounts = data;
            populateAccountSelect();
            fetchTransactions();
        } else {
            console.error('Erro ao carregar contas:', data.message);
        }
    } catch (error) {
        console.error('Erro de rede:', error);
    }
};

const populateAccountSelect = () => {
    accountSelect.innerHTML = '';
    allAccounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `ID ${account.id} - ${account.name}`;
        accountSelect.appendChild(option);
    });
};

const fetchTransactions = async () => {
    try {
        const response = await fetch('/api/transactions', {
            headers: { 'X-User-Id': userId },
        });
        const data = await response.json();
        if (response.ok) {
            renderTransactions(data);
            calculateBalances(data);
        } else {
            console.error('Erro ao carregar transações:', data.message);
            alert('Erro ao carregar transações. Faça login novamente.');
            logout();
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        alert('Erro de conexão. Tente novamente.');
    }
};

const renderTransactions = (transactions) => {
    transactionList.innerHTML = '';
    transactions.forEach((transaction) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center', 'shadow-sm', 'mb-2');
        
        const sign = transaction.type === 'income' ? '+' : '-';
        const className = transaction.type === 'income' ? 'text-success' : 'text-danger';
        
        const createdDate = `Criado: ${formatDateForDisplay(transaction.created_at)}`;
        const dueDate = `Vencimento: ${formatDateForDisplay(transaction.due_date)}`;
        let confirmedDate = '';
        if (transaction.is_confirmed) {
            confirmedDate = `Confirmado: ${formatDateForDisplay(transaction.confirmed_at)}`;
        }

        li.innerHTML = `
            <div>
                <span class="d-block text-muted" style="font-size: 0.8em;">
                    ${createdDate} | ${dueDate} ${confirmedDate ? '| ' + confirmedDate : ''}
                </span>
                <span>
                    [${transaction.account_name}] ${transaction.description}
                    <span class="${className} fw-bold ms-2">${sign} R$ ${transaction.amount.toFixed(2)}</span>
                </span>
            </div>
            <div class="d-flex align-items-center transaction-buttons">
                <button class="icon-button edit-button" data-id="${transaction.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                <button class="icon-button delete-button" data-id="${transaction.id}" title="Deletar"><i class="fas fa-times"></i></button>
                ${transaction.is_confirmed ? '' : `<button class="icon-button confirm-button" data-id="${transaction.id}" title="Confirmar"><i class="fas fa-check"></i></button>`}
            </div>
        `;
        transactionList.appendChild(li);
        
        if (transaction.is_confirmed) {
            li.style.backgroundColor = '#e9ecef';
            li.style.opacity = '0.9';
        }
    });
};

const calculateBalances = (transactions) => {
    let totalIncome = 0;
    let totalExpense = 0;
    const accountBalances = {};

    allAccounts.forEach(account => {
        accountBalances[account.id] = { income: 0, expense: 0, name: account.name, id: account.id };
    });

    transactions.forEach(transaction => {
        // Apenas contabiliza transações confirmadas
        if (transaction.is_confirmed) {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
                if (accountBalances[transaction.account_id]) {
                    accountBalances[transaction.account_id].income += transaction.amount;
                }
            } else {
                totalExpense += transaction.amount;
                if (accountBalances[transaction.account_id]) {
                    accountBalances[transaction.account_id].expense += transaction.amount;
                }
            }
        }
    });

    // Resumo consolidado (bruto)
    totalIncomeEl.textContent = `R$ ${totalIncome.toFixed(2)}`;
    totalExpenseEl.textContent = `R$ ${totalExpense.toFixed(2)}`;
    balanceEl.textContent = `R$ ${(totalIncome - totalExpense).toFixed(2)}`;

    // Resumo por conta (líquido)
    accountsSummaryList.innerHTML = '';
    for (const id in accountBalances) {
        const account = accountBalances[id];
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        const balance = account.income - account.expense;
        const className = balance >= 0 ? 'text-success' : 'text-danger';
        li.innerHTML = `
            <span>ID ${account.id} - ${account.name}:</span>
            <span class="${className} fw-bold">R$ ${balance.toFixed(2)}</span>
            <button class="delete-account-button" data-id="${account.id}" data-name="${account.name}">X</button>
        `;
        accountsSummaryList.appendChild(li);
    }
};

const handleAccountFormSubmit = async (e) => {
    e.preventDefault();
    const accountName = accountNameInput.value;
    if (!accountName) return;

    const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
        },
        body: JSON.stringify({ name: accountName }),
    });

    if (response.ok) {
        accountNameInput.value = '';
        fetchAccounts();
    } else {
        alert('Erro ao adicionar conta.');
    }
};

const handleTransactionFormSubmit = async (e) => {
    e.preventDefault();
    const transactionId = transactionIdInput.value;
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;
    const account_id = accountSelect.value;
    const due_date = transactionDateInput.value;

    if (!description || !amount || !account_id || !due_date) return;

    const transactionData = { description, amount, type, account_id, due_date };

    if (transactionId) {
        // Lógica de edição
        const response = await fetch(`/api/transactions/${transactionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId,
            },
            body: JSON.stringify(transactionData),
        });

        if (response.ok) {
            resetForm();
            fetchTransactions();
        } else {
            alert('Erro ao atualizar transação.');
        }

    } else {
        // Lógica de adicionar
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId,
            },
            body: JSON.stringify(transactionData),
        });

        if (response.ok) {
            transactionForm.reset();
            resetForm();
            fetchTransactions();
        } else {
            alert('Erro ao adicionar transação.');
        }
    }
};

const editTransaction = async (id) => {
    const response = await fetch(`/api/transactions/${id}`, {
        method: 'GET',
        headers: { 'X-User-Id': userId },
    });
    const transaction = await response.json();

    if (response.ok) {
        descriptionInput.value = transaction.description;
        amountInput.value = transaction.amount;
        typeInput.value = transaction.type;
        accountSelect.value = transaction.account_id;
        transactionIdInput.value = transaction.id;
        // Pega apenas a parte da data, ignorando a hora
        transactionDateInput.value = transaction.due_date ? transaction.due_date.split('T')[0] : getTodayDate();
        transactionDateDisplayInput.value = formatDateForDisplay(transaction.due_date ? transaction.due_date.split('T')[0] : getTodayDate());
        formTitle.textContent = 'Editar Transação';
        submitButton.textContent = 'Atualizar';
    } else {
        alert('Erro ao buscar transação para edição.');
    }
};

const deleteTransaction = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;
    const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId },
    });
    if (response.ok) {
        fetchTransactions();
    } else {
        alert('Erro ao deletar transação.');
    }
};

const confirmTransaction = async (id) => {
    const response = await fetch(`/api/transactions/${id}/confirm`, {
        method: 'PUT',
        headers: { 'X-User-Id': userId },
    });
    if (response.ok) {
        fetchTransactions();
    } else {
        alert('Erro ao confirmar transação.');
    }
};

const deleteAccount = async (id, name) => {
    if (allAccounts.length <= 1) {
        alert('Não é possível deletar a única conta existente.');
        return;
    }

    if (!confirm(`Tem certeza que deseja deletar a conta "${name}"? Todas as transações serão transferidas para outra conta.`)) {
        return;
    }

    const otherAccounts = allAccounts.filter(acc => acc.id != id);
    
    // Preparar a lista numerada e com IDs para o prompt
    let accountPromptList = "Para qual conta você gostaria de transferir as transações de \"" + name + "\"? \n\nContas disponíveis:\n";
    otherAccounts.forEach(acc => {
        accountPromptList += `ID ${acc.id} - ${acc.name}\n`;
    });
    accountPromptList += "\nDigite o ID ou o NOME da conta.";

    const input = prompt(accountPromptList);

    if (!input) return;

    let newAccount = null;
    // Tenta encontrar por ID primeiro
    const parsedInput = parseInt(input);
    if (!isNaN(parsedInput)) {
        newAccount = otherAccounts.find(acc => acc.id === parsedInput);
    } else {
        // Se não for número válido, tenta encontrar por nome
        newAccount = otherAccounts.find(acc => acc.name.toLowerCase() === input.toLowerCase());
    }
    
    if (!newAccount) {
        alert('ID ou nome de conta inválido. Operação cancelada.');
        return;
    }

    const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
        },
        body: JSON.stringify({ new_account_id: newAccount.id, original_account_name: name }),
    });

    if (response.ok) {
        fetchAccounts();
        alert('Conta deletada e transações transferidas com sucesso.');
    } else {
        const error = await response.json();
        alert(`Erro ao deletar conta: ${error.message}`);
    }
};

const resetForm = () => {
    transactionForm.reset();
    transactionIdInput.value = '';
    formTitle.textContent = 'Adicionar Transação';
    submitButton.textContent = 'Adicionar';
    transactionDateInput.value = getTodayDate();
    transactionDateDisplayInput.value = formatDateForDisplay(getTodayDate());
};

const handleLogin = async (e) => {
    e.preventDefault();
    const username = 'admin';
    const password = passwordInput.value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
        userId = data.userId;
        localStorage.setItem('userId', data.userId);
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        resetForm();
        fetchAccounts();
    } else {
        errorMessage.classList.remove('hidden');
    }
};

const logout = () => {
    localStorage.removeItem('userId');
    userId = null;
    allAccounts = [];
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    passwordInput.value = '';
    errorMessage.classList.add('hidden');
    resetForm();
    accountsSummaryList.innerHTML = '';
    transactionList.innerHTML = '';
    totalIncomeEl.textContent = 'R$ 0,00';
    totalExpenseEl.textContent = 'R$ 0,00';
    balanceEl.textContent = 'R$ 0,00';
};

const init = () => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
        userId = savedUserId;
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        resetForm();
        fetchAccounts();
    }
};

// Listeners de eventos
loginForm.addEventListener('submit', handleLogin);
accountForm.addEventListener('submit', handleAccountFormSubmit);
transactionForm.addEventListener('submit', handleTransactionFormSubmit);
logoutButton.addEventListener('click', logout);
transactionList.addEventListener('click', (e) => {
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
accountsSummaryList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-account-button')) {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        deleteAccount(id, name);
    }
});
// Evento para atualizar o campo de exibição quando a data é selecionada
transactionDateInput.addEventListener('change', () => {
    transactionDateDisplayInput.value = formatDateForDisplay(transactionDateInput.value);
});
calendarIconBtn.addEventListener('click', () => {
    transactionDateInput.showPicker();
});

init();