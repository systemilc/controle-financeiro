import { state } from './state.js';

const headers = () => {
    const apiHeaders = {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('userId'), // Pega do localStorage
        'X-Group-Id': localStorage.getItem('groupId'), // Pega do localStorage
        'X-User-Role': localStorage.getItem('userRole'), // Adiciona o papel do usuário
    };
    console.log('--- Headers da API ---');
    console.log(apiHeaders);
    return apiHeaders;
};

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

    fetchGroupUsers: async () => {
        const response = await fetch('/api/users/list', { headers: headers() });
        return await response.json();
    },

    addUserToGroup: async (username, password, whatsapp, instagram, email) => {
        const response = await fetch('/api/users/add', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ username, password, whatsapp, instagram, email }),
        });
        return response;
    },

    registerUser: async (username, password, whatsapp, instagram, email, consentLGPD) => {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, whatsapp, instagram, email, consent_lgpd: consentLGPD }),
        });
        return response.ok;
    },

    deleteUser: async (id) => {
        // O endpoint de deleção de usuário agora pode ser um endpoint mais genérico se o admin estiver usando
        // O backend já tem a lógica para admin deletar qualquer um, ou usuário deletar colaborador
        const response = await fetch(`/api/users/${id}`, { 
            method: 'DELETE',
            headers: headers(),
        });
        return response.ok;
    },

    fetchUserById: async (id) => {
        const response = await fetch(`/api/users/${id}`, { headers: headers() });
        if (!response.ok) {
            const errorData = await response.json(); // Tenta ler a mensagem de erro do backend
            throw new Error(errorData.message || `Erro ao buscar usuário: ${response.statusText}`);
        }
        return await response.json();
    },

    editUser: async (id, userData) => {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao editar usuário');
        }
        return response.ok;
    },

    changePassword: async (userId, currentPassword, newPassword) => {
        const response = await fetch(`/api/users/${userId}/change-password`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao alterar senha');
        }
        return response.ok;
    },
};