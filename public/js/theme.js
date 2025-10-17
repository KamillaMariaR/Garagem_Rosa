// js/theme.js (VERSÃO FINAL E CORRIGIDA)

// Função que atualiza a aparência do site (menu, e-mail, etc) baseado no login
// Ela vai rodar em TODAS as páginas
function atualizarInterfaceDeUsuario() {
    const estaLogado = !!localStorage.getItem('token'); // Checa se existe um token de login

    // Seleciona os elementos que podem mudar
    const barraDeUsuario = document.getElementById('user-info-bar');
    const displayDeEmail = document.getElementById('user-email-display');
    const linksDoMenu = {
        carro: document.getElementById('nav-link-carro'),
        esportivo: document.getElementById('nav-link-esportivo'),
        caminhao: document.getElementById('nav-link-caminhao'),
        moto: document.getElementById('nav-link-moto')
    };
    
    // Se o usuário estiver logado...
    if (estaLogado) {
        if (barraDeUsuario) {
            barraDeUsuario.style.display = 'flex'; // Mostra a barra de e-mail
            if (displayDeEmail) {
                displayDeEmail.textContent = localStorage.getItem('userEmail');
            }
        }
        // Mostra os links do menu que estavam escondidos (na index.html)
        Object.values(linksDoMenu).forEach(link => {
            if (link) link.style.display = 'list-item';
        });
    } 
    // Se não estiver logado...
    else {
        if (barraDeUsuario) {
            barraDeUsuario.style.display = 'none'; // Esconde a barra de e-mail
        }
        // Esconde os links do menu (na index.html)
        Object.values(linksDoMenu).forEach(link => {
            if (link) link.style.display = 'none';
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO TEMA ESCURO (continua a mesma) ---
    const themeSwitcher = document.getElementById('btn-theme-switcher');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeSwitcher.textContent = '☀️';
            themeSwitcher.title = 'Mudar para tema claro';
        } else {
            body.classList.remove('dark-theme');
            themeSwitcher.textContent = '🌙';
            themeSwitcher.title = 'Mudar para tema escuro';
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeSwitcher.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-theme');
        if (isDarkMode) {
            localStorage.setItem('theme', 'light');
            applyTheme('light');
        } else {
            localStorage.setItem('theme', 'dark');
            applyTheme('dark');
        }
    });
    
    // --- LÓGICA DE LOGIN/LOGOUT (AGORA CENTRALIZADA AQUI) ---
    
    // Roda a função principal que arruma a página
    atualizarInterfaceDeUsuario(); 

    // Adiciona a funcionalidade ao botão de "Sair"
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            window.location.href = '/index.html'; // Volta para a página inicial
        });
    }
});