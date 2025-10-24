// js/auth.js (VERSÃO FINAL E CORRIGIDA)
const backendUrl = 'https://garagem-interativa-1.onrender.com';

// A FUNÇÃO CORRIGIDA ESTÁ AQUI
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

async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        console.log('Token inválido ou expirado. Fazendo logout.');
        clearAuthData();
        window.location.reload(); 
    }

    return response;
}