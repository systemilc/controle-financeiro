import { state } from './state.js';
import { api } from './api.js';
import { elements, render } from './ui.js';
import { getTodayDate } from './utils.js';

// Funções de inicialização e controle do app
const fetchAccounts = async () => {
    try {
        const data = await api.fetchAccounts();
        if (Array.isArray(data)) {
            state.allAccounts = data;
            render.populateAccountSelect();
            fetchTransactions();
        } else {
            console.error('Erro ao carregar contas:', data.message);
        }
    } catch (error) {
        console.error('Erro de rede:', error);
    }
};

const fetchTransactions = async () => {
    try {
        const data = await api.fetchTransactions();
        if (Array.isArray(data)) {
            render.transactions(data);
            render.calculateBalances(data);
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

const handleAccountFormSubmit = async (e) => {
    e.preventDefault();
    const accountName = elements.accountNameInput.value;
    if (!accountName) return;

    const success = await api.createAccount(accountName);
    if (success) {
        elements.accountNameInput.value = '';
        fetchAccounts();
    } else {
        alert('Erro ao adicionar conta.');
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
            fetchTransactions();
        } else {
            alert('Erro ao atualizar transação.');
        }
    } else {
        const success = await api.createTransaction(transactionData);
        if (success) {
            render.resetForm();
            fetchTransactions();
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
    } else {
        alert('Erro ao buscar transação para edição.');
    }
};

const deleteTransaction = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;
    const success = await api.deleteTransaction(id);
    if (success) {
        fetchTransactions();
    } else {
        alert('Erro ao deletar transação.');
    }
};

const confirmTransaction = async (id) => {
    const success = await api.confirmTransaction(id);
    if (success) {
        fetchTransactions();
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
        fetchAccounts();
        alert('Conta deletada e transações transferidas com sucesso.');
    } else {
        const error = await response.json();
        alert(`Erro ao deletar conta: ${error.message}`);
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;

    console.log('Tentando fazer login...');
    console.log('Username:', username);
    console.log('Password:', password);

    try {
        const data = await api.login(username, password);

        console.log('Resposta do servidor:', data);

        if (data.userId) {
            state.userId = data.userId;
            localStorage.setItem('userId', data.userId);
            render.showMainApp();
            render.resetForm();
            fetchAccounts();
        } else {
            render.showLoginError('Usuário ou senha incorretos. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro na requisição de login:', error);
        render.showLoginError('Erro de conexão. Tente novamente.');
    }
};

const logout = () => {
    localStorage.removeItem('userId');
    state.userId = null;
    state.allAccounts = [];
    render.showLoginScreen();
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    render.hideLoginError();
    render.resetForm();
    elements.accountsSummaryList.innerHTML = '';
    elements.transactionList.innerHTML = '';
    elements.totalIncomeEl.textContent = 'R$ 0,00';
    elements.totalExpenseEl.textContent = 'R$ 0,00';
    elements.balanceEl.textContent = 'R$ 0,00';
};

const init = () => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
        state.userId = savedUserId;
        render.showMainApp();
        render.resetForm();
        fetchAccounts();
    }
};

// Listeners de eventos
elements.loginForm.addEventListener('submit', handleLogin);
elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
elements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);
elements.logoutButton.addEventListener('click', logout);

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

elements.accountsSummaryList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-account-button')) {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        deleteAccount(id, name);
    }
});

elements.transactionDateInput.addEventListener('change', () => {
    elements.transactionDateDisplayInput.value = formatDateForDisplay(elements.transactionDateInput.value);
});
elements.calendarIconBtn.addEventListener('click', () => {
    elements.transactionDateInput.showPicker();
});

init();