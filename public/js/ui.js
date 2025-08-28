import { state } from './state.js';
import { formatDateForDisplay, getTodayDate } from './utils.js';

export const elements = {
    loginScreen: document.getElementById('login-screen'),
    mainApp: document.getElementById('main-app'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    errorMessage: document.getElementById('error-message'),
    accountForm: document.getElementById('account-form'),
    accountNameInput: document.getElementById('account-name'),
    transactionForm: document.getElementById('transaction-form'),
    descriptionInput: document.getElementById('description'),
    amountInput: document.getElementById('amount'),
    typeInput: document.getElementById('type'),
    accountSelect: document.getElementById('account-select'),
    formTitle: document.getElementById('form-title'),
    submitButton: document.getElementById('submit-button'),
    transactionIdInput: document.getElementById('transaction-id'),
    transactionDateInput: document.getElementById('transaction-date'),
    transactionDateDisplayInput: document.getElementById('transaction-date-display'),
    calendarIconBtn: document.querySelector('.calendar-icon-btn'),
    transactionList: document.getElementById('transaction-list'),
    accountsSummaryList: document.getElementById('accounts-summary-list'),
    totalIncomeEl: document.getElementById('total-income'),
    totalExpenseEl: document.getElementById('total-expense'),
    balanceEl: document.getElementById('balance'),
    logoutButton: document.getElementById('logout-button'),
};

export const render = {
    transactions: (transactions) => {
        elements.transactionList.innerHTML = '';
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
            elements.transactionList.appendChild(li);
            
            if (transaction.is_confirmed) {
                li.style.backgroundColor = '#e9ecef';
                li.style.opacity = '0.9';
            }
        });
    },

    calculateBalances: (transactions) => {
        let totalIncome = 0;
        let totalExpense = 0;
        const accountBalances = {};

        state.allAccounts.forEach(account => {
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

        elements.totalIncomeEl.textContent = `R$ ${totalIncome.toFixed(2)}`;
        elements.totalExpenseEl.textContent = `R$ ${totalExpense.toFixed(2)}`;
        elements.balanceEl.textContent = `R$ ${(totalIncome - totalExpense).toFixed(2)}`;

        elements.accountsSummaryList.innerHTML = '';
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
            elements.accountsSummaryList.appendChild(li);
        }
    },

    resetForm: () => {
        elements.transactionForm.reset();
        elements.transactionIdInput.value = '';
        elements.formTitle.textContent = 'Adicionar Transação';
        elements.submitButton.textContent = 'Adicionar';
        const today = getTodayDate();
        elements.transactionDateInput.value = today;
        elements.transactionDateDisplayInput.value = formatDateForDisplay(today);
    },

    populateAccountSelect: () => {
        elements.accountSelect.innerHTML = '';
        state.allAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `ID ${account.id} - ${account.name}`;
            elements.accountSelect.appendChild(option);
        });
    },

    showLoginScreen: () => {
        elements.loginScreen.classList.remove('hidden');
        elements.mainApp.classList.add('hidden');
    },

    showMainApp: () => {
        elements.loginScreen.classList.add('hidden');
        elements.mainApp.classList.remove('hidden');
    },

    showLoginError: (message) => {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.remove('hidden');
    },

    hideLoginError: () => {
        elements.errorMessage.classList.add('hidden');
    },
};