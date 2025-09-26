// js/auth.js
const backendUrl = 'https://garagem-interativa-1.onrender.com';

function saveAuthData(token, email) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
}

function getToken() {
    return localStorage.getItem('token');
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
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

    if (response.status === 401 || response.status === 403) {
        console.log('Token inválido ou expirado. Fazendo logout.');
        clearAuthData();
        window.location.href = '/index.html';
    }

    return response;
}