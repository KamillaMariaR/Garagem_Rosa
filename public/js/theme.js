// js/theme.js

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('btn-theme-switcher');
    const body = document.body;

    // Função para aplicar o tema salvo
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeSwitcher.textContent = '☀️'; // Sol para ir para o tema claro
            themeSwitcher.title = 'Mudar para tema claro';
        } else {
            body.classList.remove('dark-theme');
            themeSwitcher.textContent = '🌙'; // Lua para ir para o tema escuro
            themeSwitcher.title = 'Mudar para tema escuro';
        }
    };

    // Pega o tema salvo no armazenamento local do navegador
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Adiciona o evento de clique no botão
    themeSwitcher.addEventListener('click', () => {
        // Verifica se o tema atual é escuro
        const isDarkMode = body.classList.contains('dark-theme');
        
        if (isDarkMode) {
            // Se for escuro, muda para claro
            localStorage.setItem('theme', 'light');
            applyTheme('light');
        } else {
            // Se for claro, muda para escuro
            localStorage.setItem('theme', 'dark');
            applyTheme('dark');
        }
    });
});