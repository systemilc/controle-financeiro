export const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Formata uma string de data (YYYY-MM-DD, ISO, ou SQLite) para exibição (DD/MM/YYYY)
export const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Data Inválida';

    // Tenta primeiro parsear como YYYY-MM-DD para evitar fuso horário
    const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?(?:Z)?$/);
    if (parts) {
        const year = parts[1];
        const month = parts[2];
        const day = parts[3];
        return `${day}/${month}/${year}`;
    }

    // Para outros formatos (ex: SQLite com hora), tenta criar um Date localmente
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Data inválida após tentativa de Date()');
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error('Erro em formatDateForDisplay para string:', dateString, e);
        return 'Data Inválida';
    }
};

// Formata uma string de data (ISO, YYYY-MM-DD) para input[type="date"] (YYYY-MM-DD local)
export const formatDateForInput = (dateString) => {
    if (!dateString) return '';

    // Se já é YYYY-MM-DD, retorna
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }

    try {
        // Cria um objeto Date explicitamente no fuso horário local
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Data inválida após tentativa de Date()');
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Erro em formatDateForInput para string:', dateString, e);
        return '';
    }
};

// Analisa uma string DD/MM/YYYY e a formata para YYYY-MM-DD (local), com validação
export const parseAndFormatDate = (dateString) => {
    const parts = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!parts) {
        console.log('parseAndFormatDate: Formato inválido para ', dateString);
        return null; // Formato inválido
    }
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);

    // Cria a data localmente e valida
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        console.log('parseAndFormatDate: Data inválida ou inconsistente para ', dateString);
        return null; // Data inválida
    }

    // Retorna no formato YYYY-MM-DD
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
};

// Adiciona meses a uma data YYYY-MM-DD, retornando YYYY-MM-DD (local)
export const addMonthsToDate = (dateString, months) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Cria a data localmente

    date.setMonth(date.getMonth() + months);

    // Ajusta o dia para o último dia do mês, se o dia original exceder
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    if (date.getDate() > lastDayOfMonth) {
        date.setDate(lastDayOfMonth);
    }

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    return `${newYear}-${newMonth}-${newDay}`;
};