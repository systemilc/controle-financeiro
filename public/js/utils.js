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
        if (dateString.includes('Z')) {
            // Formato ISO completo já em UTC
            date = new Date(dateString);
        } else if (dateString.includes('T')) {
            // Formato ISO sem fuso horário. Assume-se local.
            date = new Date(dateString);
        } else if (dateString.includes(' ')) {
            // Formato do SQLite (e.g., '2025-08-27 10:30:00').
            // Adiciona um Z para tratar como UTC e converter para o fuso local.
            date = new Date(dateString.replace(' ', 'T') + 'Z');
        }
        else {
            // Formato YYYY-MM-DD. Adiciona um tempo para evitar erro de fuso horário.
            date = new Date(dateString + 'T12:00:00');
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