export const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Data Inválida';

    let date;
    try {
        // Se a string for completa (com 'T'), usa a data completa
        if (dateString.includes('T')) {
            date = new Date(dateString);
        } else {
            // Se for apenas a data (AAAA-MM-DD), usa o formato local
            date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) {
            return 'Data Inválida';
        }
    
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'Data Inválida';
    }
};

export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};