import { state } from './state.js';

const headers = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': state.userId,
});

export const api = {
    login: async (username, password) => {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        return await response.json();
    },

    fetchAccounts: async () => {
        const response = await fetch('/api/accounts', { headers: headers() });
        return await response.json();
    },

    createAccount: async (name) => {
        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ name }),
        });
        return response.ok;
    },

    deleteAccount: async (id, newAccountId, originalAccountName) => {
        const response = await fetch(`/api/accounts/${id}`, {
            method: 'DELETE',
            headers: headers(),
            body: JSON.stringify({ new_account_id: newAccountId, original_account_name: originalAccountName }),
        });
        return response;
    },
    
    fetchTransactions: async () => {
        const response = await fetch('/api/transactions', { headers: headers() });
        return await response.json();
    },

    createTransaction: async (data) => {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(data),
        });
        return response.ok;
    },

    editTransaction: async (id, data) => {
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(data),
        });
        return response.ok;
    },
    
    deleteTransaction: async (id) => {
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
            headers: headers(),
        });
        return response.ok;
    },

    confirmTransaction: async (id) => {
        const response = await fetch(`/api/transactions/${id}/confirm`, {
            method: 'PUT',
            headers: headers(),
        });
        return response.ok;
    },
    
    fetchSingleTransaction: async (id) => {
        const response = await fetch(`/api/transactions/${id}`, { headers: headers() });
        return await response.json();
    },
};