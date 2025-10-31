// Detecta se estamos rodando localmente ou em produção (online)
const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const backendUrl = isLocal ? 'http://localhost:3001' : 'https://garagem-interativa-1.onrender.com';

console.log(`[auth.js] Modo de execução: ${isLocal ? 'Local' : 'Produção'}. Usando backend em: ${backendUrl}`);



function saveAuthData(token, email, userId) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', userId); // Esta linha garante que o ID seja salvo
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
}

function getToken() {
    return localStorage.getItem('token');
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
}

function getUserId() {
    return localStorage.getItem('userId');
}

function isLoggedIn() {
    return !!getToken();
}

/**
 * Função helper para fazer requisições fetch já com o token de autorização.
 * ATENÇÃO: Esta função agora lida com JSON e FormData.
 * @param {string} url - A URL completa da requisição.
 * @param {object} options - As opções do fetch (method, body, etc.).
 * @returns {Promise<Response>} A resposta do fetch.
 */
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = { ...options.headers }; // Copia os headers existentes

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Se o corpo NÃO for FormData, define o Content-Type como JSON
    // Se for FormData, o navegador define o Content-Type automaticamente, o que é essencial para o upload funcionar
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    // Se o token for inválido/expirado, o servidor responderá com 401
    if (response.status === 401) {
        console.log('Token inválido ou expirado. Fazendo logout.');
        clearAuthData();
        // Recarrega a página para o usuário ser redirecionado para a tela de login
        window.location.reload(); 
    }

    return response;
}