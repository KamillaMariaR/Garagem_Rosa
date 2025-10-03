// js/main.js (VERSÃO SIMPLIFICADA)
// A lógica de mostrar/esconder o menu foi movida para o theme.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Iniciando script principal (index)...");

    // === SELETORES DE ELEMENTOS DA PÁGINA INICIAL ===
    const secaoAuth = document.getElementById('secao-autenticacao');
    const conteudoPrincipal = document.getElementById('conteudo-principal');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const linkMostrarRegistro = document.getElementById('link-mostrar-registro');
    const linkMostrarLogin = document.getElementById('link-mostrar-login');
    const containerRegistro = document.getElementById('container-registro');
    const authErrorMessage = document.getElementById('auth-error-message');
    const formVeiculo = document.getElementById('form-add-veiculo');
    const btnSubmit = document.getElementById('btn-submit-veiculo');
    
    let modoEdicao = { ativo: false, veiculoId: null };
    let dadosPrevisaoGlobal = null;
    let unidadeTemperaturaAtual = localStorage.getItem('unidadeTemperaturaPreferida') || 'C';

    // =============================================================
    // === LÓGICA DE CONTROLE DA UI (LOGIN/LOGOUT) ===
    // =============================================================

    function showAuthError(message) {
        authErrorMessage.textContent = message;
        authErrorMessage.style.display = 'block';
    }

    // Função que mostra o conteúdo certo após o login
    function mostrarConteudoLogado() {
        if (isLoggedIn()) {
            secaoAuth.style.display = 'none';
            conteudoPrincipal.style.display = 'block';
            carregarDadosLogado();
        } else {
             secaoAuth.style.display = 'block';
             conteudoPrincipal.style.display = 'none';
        }
    }
    
    function carregarDadosLogado() {
        buscarEExibirVeiculosNaTabela();
        carregarVeiculosDestaque();
        carregarServicos();
    }
    
    // =============================================================
    // === EVENT LISTENERS DE AUTENTICAÇÃO ===
    // =============================================================
    
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAuthError('');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido.');
            saveAuthData(data.token, data.email);
            
            // ATUALIZADO: Agora apenas recarrega a página. O theme.js vai cuidar do resto.
            window.location.reload(); 
        } catch (error) {
            showAuthError(`Falha no login: ${error.message}`);
        }
    });

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAuthError('');
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            const response = await fetch(`${backendUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido.');
            alert('Registro bem-sucedido! Agora você pode fazer login.');
            containerRegistro.style.display = 'none';
            formLogin.style.display = 'block';
        } catch (error) {
            showAuthError(`Falha no registro: ${error.message}`);
        }
    });
    
    linkMostrarRegistro.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.style.display = 'none';
        containerRegistro.style.display = 'block';
        showAuthError('');
    });
    
    linkMostrarLogin.addEventListener('click', (e) => {
        e.preventDefault();
        containerRegistro.style.display = 'none';
        formLogin.style.display = 'block';
        showAuthError('');
    });

    // O resto do seu código de CRUD e APIs continua aqui...
    // (O código abaixo é o mesmo de antes e não precisa ser alterado)
    
    // =============================================================
    // === SEÇÃO DE VEÍCULOS (CRUD) ===
    // =============================================================

    async function buscarEExibirVeiculosNaTabela() {
        const tbody = document.getElementById('tbody-veiculos');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="7">Carregando sua frota...</td></tr>`;
        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos`);
            if (!response.ok) throw new Error('Falha ao buscar veículos do servidor.');
            const veiculos = await response.json();
            if (veiculos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7">Nenhum veículo cadastrado.</td></tr>`;
                return;
            }
            tbody.innerHTML = veiculos.map(v => `
                <tr id="veiculo-${v._id}">
                    <td>${v.placa}</td>
                    <td>${v.marca}</td>
                    <td>${v.modelo}</td>
                    <td>${v.ano}</td>
                    <td>${v.cor || 'N/A'}</td>
                    <td>${new Date(v.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <button class="btn-edit" data-id="${v._id}">Editar</button>
                        <button class="btn-delete" data-id="${v._id}" data-placa="${v.placa}">Deletar</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="7" class="error">${error.message}</td></tr>`;
        }
    }

    function handleIniciarEdicao(id) {
        const linhaVeiculo = document.getElementById(`veiculo-${id}`);
        if (!linhaVeiculo) return;

        const placa = linhaVeiculo.cells[0].textContent;
        const marca = linhaVeiculo.cells[1].textContent;
        const modelo = linhaVeiculo.cells[2].textContent;
        const ano = linhaVeiculo.cells[3].textContent;
        const cor = linhaVeiculo.cells[4].textContent;

        formVeiculo.querySelector('#input-placa').value = placa;
        formVeiculo.querySelector('#input-marca').value = marca;
        formVeiculo.querySelector('#input-modelo').value = modelo;
        formVeiculo.querySelector('#input-ano').value = ano;
        formVeiculo.querySelector('#input-cor').value = cor === 'N/A' ? '' : cor;
        
        btnSubmit.textContent = 'Salvar Alterações';
        modoEdicao = { ativo: true, veiculoId: id };
        formVeiculo.scrollIntoView({ behavior: 'smooth' });
    }

    async function handleSalvarEdicao(event) {
        event.preventDefault();
        const veiculoData = {
            placa: formVeiculo.querySelector('#input-placa').value,
            marca: formVeiculo.querySelector('#input-marca').value,
            modelo: formVeiculo.querySelector('#input-modelo').value,
            ano: formVeiculo.querySelector('#input-ano').value,
            cor: formVeiculo.querySelector('#input-cor').value,
        };
        const id = modoEdicao.veiculoId;
        const errorMessageDiv = formVeiculo.querySelector('#form-error-message');

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Salvando...';
        errorMessageDiv.style.display = 'none';

        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(veiculoData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
            
            alert('Veículo atualizado com sucesso!');
            resetarFormulario();
            await Promise.all([buscarEExibirVeiculosNaTabela(), carregarVeiculosDestaque()]);

        } catch (error) {
            errorMessageDiv.textContent = `Erro: ${error.message}`;
            errorMessageDiv.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            if (!modoEdicao.ativo) {
                btnSubmit.textContent = 'Adicionar Veículo';
            }
        }
    }

    function resetarFormulario() {
        formVeiculo.reset();
        btnSubmit.textContent = 'Adicionar Veículo';
        modoEdicao = { ativo: false, veiculoId: null };
        formVeiculo.querySelector('#form-error-message').style.display = 'none';
    }

    async function handleAdicionarVeiculo(event) {
        event.preventDefault();
        const errorMessageDiv = formVeiculo.querySelector('#form-error-message');
        const veiculoData = {
            placa: formVeiculo.querySelector('#input-placa').value,
            marca: formVeiculo.querySelector('#input-marca').value,
            modelo: formVeiculo.querySelector('#input-modelo').value,
            ano: formVeiculo.querySelector('#input-ano').value,
            cor: formVeiculo.querySelector('#input-cor').value,
        };
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';
        errorMessageDiv.style.display = 'none';
        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(veiculoData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
            alert('Veículo adicionado com sucesso!');
            formVeiculo.reset();
            await Promise.all([buscarEExibirVeiculosNaTabela(), carregarVeiculosDestaque()]);
        } catch (error) {
            errorMessageDiv.textContent = `Erro: ${error.message}`;
            errorMessageDiv.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Adicionar Veículo';
        }
    }
    
    async function handleDeletarVeiculo(id, placa) {
        if (!confirm(`Tem certeza que deseja deletar o veículo de placa ${placa}?`)) return;
        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Não foi possível deletar o veículo.');
            alert(data.message);
            await Promise.all([buscarEExibirVeiculosNaTabela(), carregarVeiculosDestaque()]);
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
    
    formVeiculo?.addEventListener('submit', (event) => {
        if (modoEdicao.ativo) {
            handleSalvarEdicao(event);
        } else {
            handleAdicionarVeiculo(event);
        }
    });

    document.getElementById('tbody-veiculos')?.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-delete')) {
            handleDeletarVeiculo(target.dataset.id, target.dataset.placa);
        }
        if (target.classList.contains('btn-edit')) {
            handleIniciarEdicao(target.dataset.id);
        }
    });

    // =============================================================
    // === CARREGAMENTO DAS SEÇÕES PÚBLICAS ===
    // =============================================================
    
    async function carregarVeiculosDestaque() {
        const container = document.getElementById('cards-veiculos-destaque');
        if (!container) return;
        try {
            const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`);
            const data = await response.json();
            if (data.length === 0) {
                container.innerHTML = '<p>Nenhum veículo para destacar.</p>';
                return;
            }
            container.innerHTML = data.map(v => `
                <div class="veiculo-card">
                    <img src="${v.imagemUrl}" alt="${v.modelo}" onerror="this.onerror=null;this.src='imagens/civic-removebg-preview.png';">
                    <h3>${v.modelo} (${v.ano})</h3>
                    <p><strong>${v.destaque}</strong></p>
                </div>`).join('');
                
        } catch (error) {
            container.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function carregarServicos() {
        const container = document.getElementById('lista-servicos-oferecidos');
        if (!container) return;
        try {
            const response = await fetch(`${backendUrl}/api/garagem/servicos-oferecidos`);
            const data = await response.json();
            container.innerHTML = data.map(s => `<li><strong>${s.nome}</strong><br><span>${s.descricao} (Preço Estimado: ${s.precoEstimado})</span></li>`).join('');
        } catch (error) {
            container.innerHTML = `<li class="error">${error.message}</li>`;
        }
    }
    
    async function buscarEExibirDicas(url) {
        const container = document.getElementById('dicas-resultado-container');
        if (!container) return;
        container.innerHTML = '<p class="loading">Buscando dicas...</p>';
        try {
            const response = await fetch(url);
            const dicas = await response.json();
            if (!response.ok) throw new Error(dicas.error || 'Erro ao buscar dicas.');
            container.innerHTML = '<ul>' + dicas.map(d => `<li>${d.dica}</li>`).join('') + '</ul>';
        } catch (error) {
            container.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    document.getElementById('btn-buscar-dicas-gerais')?.addEventListener('click', () => buscarEExibirDicas(`${backendUrl}/api/dicas-manutencao`));
    document.getElementById('btn-buscar-dicas-especificas')?.addEventListener('click', () => {
        const tipo = document.getElementById('input-tipo-veiculo').value.trim();
        if (tipo) buscarEExibirDicas(`${backendUrl}/api/dicas-manutencao/${tipo}`);
    });

    // =============================================================
    // === SEÇÃO DE PREVISÃO DO TEMPO ===
    // =============================================================

    function celsiusParaFahrenheit(celsius) { return (celsius * 9 / 5) + 32; }
    function formatarTemperatura(tempCelsius) { return unidadeTemperaturaAtual === 'F' ? `${celsiusParaFahrenheit(tempCelsius).toFixed(1)}°F` : `${tempCelsius.toFixed(1)}°C`; }
    function formatarTemperaturaInteira(tempCelsius) { return unidadeTemperaturaAtual === 'F' ? `${celsiusParaFahrenheit(tempCelsius).toFixed(0)}°F` : `${tempCelsius.toFixed(0)}°C`; }
    
    function getClassPorTemperatura(tempCelsius) {
        if (tempCelsius < 5) return 'temp-grad-muito-frio';
        if (tempCelsius < 12) return 'temp-grad-frio';
        if (tempCelsius < 20) return 'temp-grad-ameno';
        if (tempCelsius < 28) return 'temp-grad-quente';
        return 'temp-grad-muito-quente';
    }

    async function fetchForecastData(nomeCidade) {
        const resultadoDiv = document.getElementById('previsao-tempo-resultado');
        if (!nomeCidade) {
            resultadoDiv.innerHTML = '<p class="error">Por favor, digite uma cidade.</p>';
            return;
        }
        resultadoDiv.innerHTML = '<p class="loading">Verificando clima...</p>';
        try {
            const response = await fetch(`${backendUrl}/clima?cidade=${encodeURIComponent(nomeCidade)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Erro ao buscar clima.");

            const previsoesPorDia = {};
            if (data.list && data.list.length > 0) {
                data.list.forEach(item => {
                    const dataISO = item.dt_txt.split(' ')[0];
                    if (!previsoesPorDia[dataISO]) {
                        previsoesPorDia[dataISO] = { data: dataISO, entradas: [], temp_min_dia: item.main.temp_min, temp_max_dia: item.main.temp_max, descricoesContador: {}, iconesContador: {}, umidadeSoma: 0, tempSoma: 0, countEntradas: 0 };
                    }
                    const dia = previsoesPorDia[dataISO];
                    dia.entradas.push(item);
                    dia.temp_min_dia = Math.min(dia.temp_min_dia, item.main.temp_min);
                    dia.temp_max_dia = Math.max(dia.temp_max_dia, item.main.temp_max);
                    const desc = item.weather[0].description;
                    const iconBase = item.weather[0].icon.substring(0, 2);
                    dia.descricoesContador[desc] = (dia.descricoesContador[desc] || 0) + 1;
                    dia.iconesContador[iconBase] = (dia.iconesContador[iconBase] || 0) + 1;
                    dia.umidadeSoma += item.main.humidity;
                    dia.tempSoma += item.main.temp;
                    dia.countEntradas++;
                });
            }
            const resultadoFinal = Object.values(previsoesPorDia).map(dia => {
                const descFinal = Object.keys(dia.descricoesContador).reduce((a, b) => dia.descricoesContador[a] > dia.descricoesContador[b] ? a : b);
                const iconBaseFinal = Object.keys(dia.iconesContador).reduce((a, b) => dia.iconesContador[a] > dia.iconesContador[b] ? a : b);
                return {
                    data: dia.data, temperaturaMin: dia.temp_min_dia, temperaturaMax: dia.temp_max_dia,
                    temperatura: dia.tempSoma / dia.countEntradas, descricao: descFinal, icone: `${iconBaseFinal}d`,
                    umidade: dia.umidadeSoma / dia.countEntradas, entradasHorarias: dia.entradas
                };
            });
            
            dadosPrevisaoGlobal = { cidadeNome: data.city?.name || "Desconhecida", pais: data.city?.country || "", previsoes: resultadoFinal };
            renderizarPrevisaoCompleta();

        } catch (error) {
            resultadoDiv.innerHTML = `<p class="error">Não foi possível buscar a previsão. (${error.message})</p>`;
            dadosPrevisaoGlobal = null;
        }
    }

    function renderizarPrevisaoCompleta() {
        const previsaoResultadoDiv = document.getElementById('previsao-tempo-resultado');
        if (!dadosPrevisaoGlobal || !previsaoResultadoDiv) return;

        const numDias = parseInt(document.querySelector('input[name="numDias"]:checked')?.value, 10) || 1;
        const destacarChuva = document.getElementById('destaque-chuva')?.checked;
        const destacarTempBaixa = document.getElementById('destaque-temp-baixa-check')?.checked;
        const valorTempBaixa = parseFloat(document.getElementById('destaque-temp-baixa-valor')?.value);
        const destacarTempAlta = document.getElementById('destaque-temp-alta-check')?.checked;
        const valorTempAlta = parseFloat(document.getElementById('destaque-temp-alta-valor')?.value);

        let htmlConteudo = `<h3>Clima em ${dadosPrevisaoGlobal.cidadeNome} para ${numDias === 1 ? 'o próximo dia' : `os próximos ${numDias} dias`}</h3><div class="previsao-dias-container">`;
        if (dadosPrevisaoGlobal.previsoes && dadosPrevisaoGlobal.previsoes.length > 0) {
            dadosPrevisaoGlobal.previsoes.slice(0, numDias).forEach(previsaoDia => {
                const dataObj = new Date(previsaoDia.data + "T12:00:00Z");
                const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
                const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                const iconUrl = `https://openweathermap.org/img/wn/${previsaoDia.icone}@2x.png`;
                
                let classesCard = `previsao-dia-card forecast-card-clickable ${getClassPorTemperatura(previsaoDia.temperatura)}`;
                if (destacarChuva && previsaoDia.descricao.toLowerCase().includes('chuva')) classesCard += " highlight-rain";
                if (destacarTempBaixa && !isNaN(valorTempBaixa) && previsaoDia.temperaturaMin <= valorTempBaixa) classesCard += " highlight-temp-low";
                if (destacarTempAlta && !isNaN(valorTempAlta) && previsaoDia.temperaturaMax >= valorTempAlta) classesCard += " highlight-temp-high";

                htmlConteudo += `<div class="${classesCard.trim()}" data-forecast-date="${previsaoDia.data}"><div class="card-content-wrapper"><h4>${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${dataFormatada} (clique)</h4><img src="${iconUrl}" alt="${previsaoDia.descricao}" class="weather-icon-daily"><p><strong>Min:</strong> ${formatarTemperatura(previsaoDia.temperaturaMin)} / <strong>Max:</strong> ${formatarTemperatura(previsaoDia.temperaturaMax)}</p><p><strong>Condição:</strong> <span style="text-transform: capitalize;">${previsaoDia.descricao}</span></p><div class="detalhes-horarios-container" style="display: none;"></div></div></div>`;
            });
        }
        htmlConteudo += '</div>';
        previsaoResultadoDiv.innerHTML = htmlConteudo;
    }

    document.getElementById('verificar-clima-btn')?.addEventListener('click', () => fetchForecastData(document.getElementById('destino-viagem').value));
    
    const btnAlternarUnidade = document.getElementById('alternar-unidade-temp-btn');
    if (btnAlternarUnidade) {
        btnAlternarUnidade.textContent = `Mudar para ${unidadeTemperaturaAtual === 'C' ? '°F' : '°C'}`;
        btnAlternarUnidade.addEventListener('click', () => {
            unidadeTemperaturaAtual = unidadeTemperaturaAtual === 'C' ? 'F' : 'C';
            localStorage.setItem('unidadeTemperaturaPreferida', unidadeTemperaturaAtual);
            btnAlternarUnidade.textContent = `Mudar para ${unidadeTemperaturaAtual === 'C' ? '°F' : '°C'}`;
            renderizarPrevisaoCompleta();
        });
    }
    
    document.querySelectorAll('input[name="numDias"]').forEach(r => r.addEventListener('change', renderizarPrevisaoCompleta));
    ['destaque-chuva', 'destaque-temp-baixa-check', 'destaque-temp-alta-check', 'destaque-temp-baixa-valor', 'destaque-temp-alta-valor'].forEach(id => document.getElementById(id)?.addEventListener('change', renderizarPrevisaoCompleta));
    
    document.getElementById('previsao-tempo-resultado')?.addEventListener('click', e => {
        const cardClicado = e.target.closest('.forecast-card-clickable');
        if (!cardClicado || !dadosPrevisaoGlobal) return;
        const detalhesContainer = cardClicado.querySelector('.detalhes-horarios-container');
        if (!detalhesContainer) return;
        if (detalhesContainer.style.display === 'block') {
            detalhesContainer.style.display = 'none';
            return;
        }
        const previsaoDoDia = dadosPrevisaoGlobal.previsoes.find(p => p.data === cardClicado.dataset.forecastDate);
        if (previsaoDoDia?.entradasHorarias) {
            detalhesContainer.innerHTML = '<h5>Previsão Horária:</h5><div class="horarios-grid">' + previsaoDoDia.entradasHorarias.map(h => `<div class="horario-item"><span>${h.dt_txt.split(' ')[1].substring(0, 5)}</span><img src="https://openweathermap.org/img/wn/${h.weather[0].icon}.png" alt="${h.weather[0].description}"><span>${formatarTemperaturaInteira(h.main.temp)}</span></div>`).join('') + '</div>';
            detalhesContainer.style.display = 'block';
        }
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    // A função no theme.js vai cuidar de mostrar o conteúdo certo na hora certa.
    mostrarConteudoLogado();
});
