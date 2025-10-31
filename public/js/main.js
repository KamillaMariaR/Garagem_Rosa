// js/main.js (VERSÃO FINALÍSSIMA, 100% COMPLETA E CORRIGIDA)

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Iniciando script principal...");

    // === SELETORES DE ELEMENTOS ===
    const secaoAuth = document.getElementById('secao-autenticacao');
    const conteudoPrincipal = document.getElementById('conteudo-principal');
    const userInfoBar = document.getElementById('user-info-bar');
    const userEmailDisplay = document.getElementById('user-email-display');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const linkMostrarRegistro = document.getElementById('link-mostrar-registro');
    const linkMostrarLogin = document.getElementById('link-mostrar-login');
    const containerRegistro = document.getElementById('container-registro');
    const formVeiculo = document.getElementById('form-add-veiculo');
    const btnSubmit = document.getElementById('btn-submit-veiculo');
    const notificationArea = document.getElementById('notification-area');
    let notificationTimeout;

    let modoEdicao = { ativo: false, veiculoId: null };

    // =============================================================
    // === ✨ SISTEMA DE FEEDBACK VISUAL ✨ ===
    // =============================================================
    function showNotification(message, type = 'success') {
        if (!notificationArea) return;
        clearTimeout(notificationTimeout);
        notificationArea.textContent = message;
        notificationArea.className = '';
        notificationArea.style.display = 'block';
        setTimeout(() => {
            notificationArea.classList.add(type, 'show');
        }, 10);
        notificationTimeout = setTimeout(() => {
            notificationArea.classList.remove('show');
            setTimeout(() => {
                if (!notificationArea.classList.contains('show')) {
                    notificationArea.style.display = 'none';
                }
            }, 500);
        }, 5000);
    }

    // =============================================================
    // === LÓGICA DE CONTROLE DA UI (LOGIN/LOGOUT) ===
    // =============================================================
    function checkAuthState() {
        if (isLoggedIn()) {
            secaoAuth.style.display = 'none';
            conteudoPrincipal.style.display = 'block';
            userInfoBar.style.display = 'flex';
            userEmailDisplay.textContent = getUserEmail();
            carregarDadosLogado();
        } else {
            secaoAuth.style.display = 'block';
            conteudoPrincipal.style.display = 'none';
            userInfoBar.style.display = 'none';
        }
    }

    function carregarDadosLogado() {
        buscarEExibirVeiculosNaTabela();
        carregarVeiculosDestaque();
        carregarServicos();
    }

    // =============================================================
    // === EVENT LISTENERS DE AUTENTICAÇÃO (COM FEEDBACK) ===
    // =============================================================
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro no login');
            }
            
            const data = await response.json();
            saveAuthData(data.token, data.email, data.userId);
            showNotification('Login realizado com sucesso! Bem-vindo(a)!', 'success');
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            showNotification(`Erro: ${error.message}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Registrando...';
        
        try {
            const response = await fetch(`${backendUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro no registro');
            }
            
            showNotification('Registro bem-sucedido! Agora você pode fazer login.', 'success');
            containerRegistro.style.display = 'none';
            formLogin.style.display = 'block';
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').focus();

        } catch (error) {
            showNotification(`Erro: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Registrar';
        }
    });

    linkMostrarRegistro?.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.style.display = 'none';
        containerRegistro.style.display = 'block';
    });

    linkMostrarLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        containerRegistro.style.display = 'none';
        formLogin.style.display = 'block';
    });
    
    // =============================================================
    // === SEÇÃO DE VEÍCULOS (CRUD, SHARE, UNSHARE) ===
    // =============================================================

    async function buscarEExibirVeiculosNaTabela() {
        const tbody = document.getElementById('tbody-veiculos');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="8">Carregando sua frota...</td></tr>`;
        
        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos`);
            if (!response.ok) throw new Error('Falha ao buscar veículos');
            
            const veiculos = await response.json();
            const currentUserId = getUserId();

            if (veiculos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8">Nenhum veículo cadastrado. Adicione um acima!</td></tr>`;
                return;
            }
            
            tbody.innerHTML = veiculos.map(v => {
                const isOwner = v.owner?._id === currentUserId;
                const ownerEmail = v.owner?.email || 'dono desconhecido';

                const imageUrl = v.imageUrl 
                    ? `${backendUrl}/${v.imageUrl}` 
                    : 'imagens/civic-removebg-preview.png';

                const imagemHtml = `<img src="${imageUrl}" alt="Foto de ${v.modelo}" style="width: 100px; height: auto; border-radius: 5px;" onerror="this.onerror=null;this.src='imagens/civic-removebg-preview.png';">`;

                let sharedInfoHtml = '';
                let actionButtons = '';
                let mainContentHtml = '';
                let ownerBadgeHtml = '';

                if (isOwner) {
                    ownerBadgeHtml = `<span class="owner-badge">Meu Veículo</span>`;
                    actionButtons = `
                        <button class="btn-edit" data-id="${v._id}">Editar</button>
                        <button class="btn-delete" data-id="${v._id}" data-placa="${v.placa}">Deletar</button>
                        <button class="btn-share" data-id="${v._id}" data-placa="${v.placa}">Compartilhar</button>
                    `;
                    
                    if (v.sharedWith && v.sharedWith.length > 0) {
                        sharedInfoHtml = `
                            <div class="shared-with-container">
                                <ul class="shared-with-list">
                                    <span>Compartilhado com:</span>
                                    ${v.sharedWith.map(user => `
                                        <li>
                                            ${user.email}
                                            <button class="btn-unshare" title="Remover acesso de ${user.email}" data-veiculo-id="${v._id}" data-user-to-remove-id="${user._id}" data-user-email="${user.email}">×</button>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    mainContentHtml = `<td>${v.modelo} ${ownerBadgeHtml}</td>`;
                } else {
                    mainContentHtml = `<td>${v.modelo} <br><small class="shared-info">(Compartilhado por ${ownerEmail})</small></td>`;
                }

                return `
                    <tr id="veiculo-${v._id}">
                        <td>${imagemHtml}</td>
                        <td>${v.placa}</td>
                        <td>${v.marca}</td>
                        ${mainContentHtml}
                        <td>${v.ano}</td>
                        <td>${v.cor || 'N/A'}</td>
                        <td>${new Date(v.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td>
                            ${actionButtons}
                            ${isOwner ? sharedInfoHtml : ''}
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="8" class="error">${error.message}</td></tr>`;
            showNotification(`Erro: ${error.message}`, 'error');
        }
    }

    async function handleShareVeiculo(id, placa) {
        const email = prompt(`Com qual e-mail você deseja compartilhar o veículo de placa ${placa}?`);
        if (!email || email.trim() === '') return;

        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${id}/share`, {
                method: 'POST',
                body: JSON.stringify({ email: email.trim() })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Não foi possível compartilhar');
            }
            
            const data = await response.json();
            showNotification(data.message, 'success');
            await buscarEExibirVeiculosNaTabela();
        } catch (error) {
            showNotification(`Erro: ${error.message}`, 'error');
        }
    }

    async function handleUnshareVeiculo(veiculoId, userIdToRemove, userEmail) {
        if (!confirm(`Tem certeza que deseja remover o acesso de ${userEmail} a este veículo?`)) return;

        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${veiculoId}/unshare`, {
                method: 'POST',
                body: JSON.stringify({ userIdToRemove })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Não foi possível remover o compartilhamento');
            }
            
            const data = await response.json();
            showNotification(data.message, 'success');
            await buscarEExibirVeiculosNaTabela();
        } catch (error) {
            showNotification(`Erro: ${error.message}`, 'error');
        }
    }

    async function handleDeletarVeiculo(id, placa) {
        if (!confirm(`Tem certeza que deseja deletar o veículo de placa ${placa}?`)) return;
        
        try {
            const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${id}`, { method: 'DELETE' });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Não foi possível deletar');
            }
            
            const data = await response.json();
            showNotification(data.message, 'success');
            await Promise.all([buscarEExibirVeiculosNaTabela(), carregarVeiculosDestaque()]);
        } catch (error) {
            showNotification(`Erro: ${error.message}`, 'error');
        }
    }
    
    function handleIniciarEdicao(id) {
        const linhaVeiculo = document.getElementById(`veiculo-${id}`);
        if (!linhaVeiculo) return;
        
        const modeloTexto = linhaVeiculo.cells[3].childNodes[0].nodeValue.trim();
        formVeiculo.querySelector('#input-placa').value = linhaVeiculo.cells[1].textContent;
        formVeiculo.querySelector('#input-marca').value = linhaVeiculo.cells[2].textContent;
        formVeiculo.querySelector('#input-modelo').value = modeloTexto;
        formVeiculo.querySelector('#input-ano').value = linhaVeiculo.cells[4].textContent;
        formVeiculo.querySelector('#input-cor').value = linhaVeiculo.cells[5].textContent === 'N/A' ? '' : linhaVeiculo.cells[5].textContent;
        
        btnSubmit.textContent = 'Salvar Alterações';
        modoEdicao = { ativo: true, veiculoId: id };
        formVeiculo.scrollIntoView({ behavior: 'smooth' });
    }

    function resetarFormulario() {
        formVeiculo.reset();
        btnSubmit.textContent = 'Adicionar Veículo';
        modoEdicao = { ativo: false, veiculoId: null };
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(formVeiculo);

        btnSubmit.disabled = true;
        const url = modoEdicao.ativo ? `${backendUrl}/api/veiculos/${modoEdicao.veiculoId}` : `${backendUrl}/api/veiculos`;
        const method = modoEdicao.ativo ? 'PUT' : 'POST';
        btnSubmit.textContent = modoEdicao.ativo ? 'Salvando...' : 'Adicionando...';

        try {
            const isCreating = !modoEdicao.ativo;
            
            const body = isCreating ? formData : JSON.stringify({
                placa: formData.get('placa'),
                marca: formData.get('marca'),
                modelo: formData.get('modelo'),
                ano: formData.get('ano'),
                cor: formData.get('cor')
            });
            
            const response = await fetchWithAuth(url, {
                method: method,
                body: body,
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Erro ${response.status}`);
            }
            
            showNotification(`Veículo ${modoEdicao.ativo ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            resetarFormulario();
            await Promise.all([buscarEExibirVeiculosNaTabela(), carregarVeiculosDestaque()]);
        } catch (error) {
            showNotification(`Erro: ${error.message}`, 'error');
        } finally {
            btnSubmit.disabled = false;
            if (modoEdicao.ativo) resetarFormulario();
            btnSubmit.textContent = 'Adicionar Veículo';
        }
    }
    
    formVeiculo?.addEventListener('submit', handleFormSubmit);

    document.getElementById('tbody-veiculos')?.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-delete')) {
            handleDeletarVeiculo(target.dataset.id, target.dataset.placa);
        } else if (target.classList.contains('btn-edit')) {
            handleIniciarEdicao(target.dataset.id);
        } else if (target.classList.contains('btn-share')) {
            handleShareVeiculo(target.dataset.id, target.dataset.placa);
        } else if (target.classList.contains('btn-unshare')) {
            const { veiculoId, userToRemoveId, userEmail } = target.dataset;
            handleUnshareVeiculo(veiculoId, userToRemoveId, userEmail);
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
            if (!response.ok) throw new Error(dicas.message || 'Erro ao buscar dicas.');
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


    // =======================================================================
    // === ✨ LÓGICA COMPLETA E CORRIGIDA DO CLIMA ✨ ===
    // =======================================================================
    let dadosPrevisaoGlobal = null;
    let unidadeTemperaturaAtual = localStorage.getItem('unidadeTemperaturaPreferida') || 'C';

    const btnVerificarClima = document.getElementById('verificar-clima-btn');
    const inputDestino = document.getElementById('destino-viagem');
    const resultadoClima = document.getElementById('previsao-tempo-resultado');
    const btnAlternarUnidade = document.getElementById('alternar-unidade-temp-btn');
    const filtroChuvaCheck = document.getElementById('destaque-chuva');
    const filtroTempBaixaCheck = document.getElementById('destaque-temp-baixa-check');
    const filtroTempBaixaValor = document.getElementById('destaque-temp-baixa-valor');
    const filtroTempAltaCheck = document.getElementById('destaque-temp-alta-check');
    const filtroTempAltaValor = document.getElementById('destaque-temp-alta-valor');
    
    function celsiusParaFahrenheit(c) {
        return (c * 9/5) + 32;
    }

    function renderizarPrevisao(dados) {
        if (!dados) {
            resultadoClima.innerHTML = `<p class="error">Nenhum dado de previsão para exibir.</p>`;
            return;
        }

        dadosPrevisaoGlobal = dados;

        const destacarChuva = filtroChuvaCheck.checked;
        const destacarTempBaixa = filtroTempBaixaCheck.checked;
        const valorTempBaixa = parseFloat(filtroTempBaixaValor.value);
        const destacarTempAlta = filtroTempAltaCheck.checked;
        const valorTempAlta = parseFloat(filtroTempAltaValor.value);

        const numDiasSelecionado = parseInt(document.querySelector('input[name="numDias"]:checked').value);
        const diasParaExibir = [];
        const diasJaAdicionados = new Set();

        for (const previsao of dados.list) {
            const data = new Date(previsao.dt_txt).toLocaleDateString('pt-BR');
            if (!diasJaAdicionados.has(data) && diasParaExibir.length < numDiasSelecionado) {
                diasParaExibir.push(previsao);
                diasJaAdicionados.add(data);
            }
        }

        let html = `<h3>Previsão para ${dados.city.name}</h3><div class="previsao-dias-container">`;
        
        html += diasParaExibir.map(dia => {
            const data = new Date(dia.dt_txt);
            const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
            const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            let temp = dia.main.temp;
            let tempMin = dia.main.temp_min;
            let tempMax = dia.main.temp_max;
            
            let classesExtras = '';
            if (destacarChuva && dia.weather[0].description.toLowerCase().includes('chuva')) {
                classesExtras += ' highlight-rain';
            }
            if (destacarTempBaixa && dia.main.temp_min < valorTempBaixa) {
                classesExtras += ' highlight-temp-low';
            }
            if (destacarTempAlta && dia.main.temp_max > valorTempAlta) {
                classesExtras += ' highlight-temp-high';
            }

            if (unidadeTemperaturaAtual === 'F') {
                temp = celsiusParaFahrenheit(temp);
                tempMin = celsiusParaFahrenheit(tempMin);
                tempMax = celsiusParaFahrenheit(tempMax);
            }

            const unidade = `°${unidadeTemperaturaAtual}`;
            const iconeUrl = `https://openweathermap.org/img/wn/${dia.weather[0].icon}@2x.png`;
            
            return `
                <div class="previsao-dia-card${classesExtras}">
                    <div class="card-content-wrapper">
                        <h4>${diaSemana} <br><small>(${dataFormatada})</small></h4>
                        <img src="${iconeUrl}" alt="${dia.weather[0].description}" class="weather-icon-daily">
                        <p><strong>${temp.toFixed(1)}${unidade}</strong></p>
                        <p><small>Min: ${tempMin.toFixed(1)}${unidade} / Max: ${tempMax.toFixed(1)}${unidade}</small></p>
                        <p><small>${dia.weather[0].description}</small></p>
                    </div>
                </div>
            `;
        }).join('');
        
        html += `</div>`;
        resultadoClima.innerHTML = html;
    }

    async function buscarPrevisao() {
        const cidade = inputDestino.value.trim();
        if (!cidade) {
            resultadoClima.innerHTML = `<p class="error">Por favor, digite uma cidade.</p>`;
            return;
        }

        resultadoClima.innerHTML = `<p class="loading">Buscando previsão para ${cidade}...</p>`;
        btnVerificarClima.disabled = true;

        try {
            const response = await fetch(`${backendUrl}/clima?cidade=${encodeURIComponent(cidade)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro desconhecido ao buscar clima.');
            }
            
            renderizarPrevisao(data);

        } catch (error) {
            resultadoClima.innerHTML = `<p class="error">Erro: ${error.message}</p>`;
            dadosPrevisaoGlobal = null;
        } finally {
            btnVerificarClima.disabled = false;
        }
    }

    function atualizarUnidadeUI() {
        if (unidadeTemperaturaAtual === 'F') {
            btnAlternarUnidade.textContent = 'Mudar para °C';
        } else {
            btnAlternarUnidade.textContent = 'Mudar para °F';
        }
        localStorage.setItem('unidadeTemperaturaPreferida', unidadeTemperaturaAtual);
        
        if (dadosPrevisaoGlobal) {
            renderizarPrevisao(dadosPrevisaoGlobal);
        }
    }

    btnVerificarClima?.addEventListener('click', buscarPrevisao);

    btnAlternarUnidade?.addEventListener('click', () => {
        unidadeTemperaturaAtual = (unidadeTemperaturaAtual === 'C') ? 'F' : 'C';
        atualizarUnidadeUI();
    });

    document.querySelectorAll('input[name="numDias"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (dadosPrevisaoGlobal) {
                renderizarPrevisao(dadosPrevisaoGlobal);
            }
        });
    });

    const filtros = [filtroChuvaCheck, filtroTempBaixaCheck, filtroTempBaixaValor, filtroTempAltaCheck, filtroTempAltaValor];
    filtros.forEach(filtro => {
        filtro?.addEventListener('change', () => {
            if (dadosPrevisaoGlobal) {
                renderizarPrevisao(dadosPrevisaoGlobal);
            }
        });
    });

    atualizarUnidadeUI();

    // =======================================================================
    // --- INICIALIZAÇÃO DA PÁGINA ---
    // =======================================================================
    checkAuthState();
});