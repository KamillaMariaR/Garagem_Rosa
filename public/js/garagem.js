// js/garagem.js

// REMOVA A CONSTANTE DAQUI:
// const DADOS_VEICULOS_API_SIMULADA = [ ... ];

/**
 * Gerencia a coleção de veículos, a persistência e a interação com a UI.
 * Depende: Manutencao, Carro, CarroEsportivo, Caminhao, Moto (devem ser carregados antes)
 */
class Garagem {
    // ADICIONE A CONSTANTE AQUI COMO UMA PROPRIEDADE ESTÁTICA OU NO CONSTRUTOR
    // Opção 1: Propriedade Estática (mais limpo se não precisar do 'this' para ela)
    static DADOS_VEICULOS_API_SIMULADA = [
      {
        "id": "meuCarro",
        "modeloOriginal": "Civic",
        "valorFIPE": "R$ 95.000,00",
        "recallPendente": "Verificar sistema de airbags (Campanha #1234)",
        "dicaManutencao": "Trocar óleo do motor a cada 10.000 km ou 1 ano.",
        "seguroMedioAnual": "R$ 2.800,00",
        "consumoMedio": "11 km/l (cidade) / 14 km/l (estrada)"
      },
      {
        "id": "carroEsportivo",
        "modeloOriginal": "Pagani Huayra",
        "valorFIPE": "R$ 15.000.000,00",
        "recallPendente": null,
        "dicaManutencao": "Revisão especializada a cada 5.000 km. Pneus de alta performance requerem atenção especial.",
        "seguroMedioAnual": "R$ 150.000,00",
        "consumoMedio": "4 km/l (cidade) / 7 km/l (estrada)"
      },
      {
        "id": "caminhao",
        "modeloOriginal": "Mercedes-Benz Actros",
        "valorFIPE": "R$ 450.000,00",
        "recallPendente": "Inspeção do sistema de freios pneumáticos (Campanha #5678)",
        "dicaManutencao": "Verificar calibragem dos pneus e nível de Arla 32 semanalmente. Lubrificação periódica do chassi.",
        "seguroMedioAnual": "R$ 12.000,00",
        "consumoMedio": "2.5 km/l (carregado)"
      },
      {
        "id": "moto",
        "modeloOriginal": "Kawasaki Ninja",
        "valorFIPE": "R$ 55.000,00",
        "recallPendente": null,
        "dicaManutencao": "Manter a corrente lubrificada e tensionada. Verificar freios antes de cada uso.",
        "seguroMedioAnual": "R$ 2.200,00",
        "consumoMedio": "18 km/l"
      }
    ];

    constructor() {
        this.veiculos = {}; // Objeto para armazenar instâncias: { nomeInterno: Veiculo }
        this.localStorageKey = 'dadosGaragemCompleta_v6'; // Chave para localStorage
        // carregarGaragem() será chamado no main.js após instanciar

        // Opção 2: Se não quiser usar static, pode definir no construtor (menos comum para constantes assim)
        // this.DADOS_VEICULOS_API_SIMULADA = [ ... ];
    }

    // --- Persistência (LocalStorage) ---
    // ... (resto do código da persistência) ...
    _serializarManutencao(manutencao) {
        return {
            data: manutencao.data, tipo: manutencao.tipo, custo: manutencao.custo,
            descricao: manutencao.descricao, hora: manutencao.hora, status: manutencao.status
        };
    }

    _deserializarManutencao(data) {
        if (!data || typeof data.data === 'undefined' || typeof data.tipo === 'undefined') {
            console.warn("Tentando deserializar dados de manutenção inválidos:", data);
            return null;
        }
        return new Manutencao(data.data, data.tipo, data.custo, data.descricao, data.hora, data.status);
    }

    salvarGaragem() {
        const dadosParaSalvar = {};
        for (const nomeVeiculo in this.veiculos) {
            const veiculo = this.veiculos[nomeVeiculo];
            dadosParaSalvar[nomeVeiculo] = {
                tipo: veiculo.constructor.name,
                modelo: veiculo.modelo,
                cor: veiculo.cor,
                combustivel: veiculo.combustivel,
                ligado: veiculo.ligado,
                velocidade: veiculo.velocidade,
                velocidadeMaxima: veiculo.velocidadeMaxima,
                historicoManutencao: veiculo.historicoManutencao.map(m => this._serializarManutencao(m)),
                ...(veiculo instanceof CarroEsportivo && { turboAtivado: veiculo.turboAtivado }),
                ...(veiculo instanceof Caminhao && { capacidadeCarga: veiculo.capacidadeCarga, cargaAtual: veiculo.cargaAtual }),
            };
        }
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(dadosParaSalvar));
            console.log(`Garagem salva (v${this.localStorageKey.split('_v')[1]}).`);
        } catch (error) {
            console.error("Erro ao salvar garagem:", error);
            if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                alert("Erro: Limite de armazenamento local excedido! Não foi possível salvar.");
            }
        }
    }

    carregarGaragem() {
        const dadosSalvos = localStorage.getItem(this.localStorageKey);
        if (!dadosSalvos) {
            console.log(`Nenhum dado salvo encontrado (key: ${this.localStorageKey}).`);
            return false;
        }
        try {
            const dadosParseados = JSON.parse(dadosSalvos);
            this.veiculos = {};
            for (const nomeVeiculo in dadosParseados) {
                const d = dadosParseados[nomeVeiculo];
                let veiculoInstancia = null;
                switch (d.tipo) {
                    case 'Carro':           veiculoInstancia = new Carro(d.modelo, d.cor); break;
                    case 'CarroEsportivo':  veiculoInstancia = new CarroEsportivo(d.modelo, d.cor); break;
                    case 'Caminhao':        veiculoInstancia = new Caminhao(d.modelo, d.cor, d.capacidadeCarga); break;
                    case 'Moto':            veiculoInstancia = new Moto(d.modelo, d.cor); break;
                    default:
                        console.warn(`Tipo de veículo desconhecido "${d.tipo}" encontrado para ${nomeVeiculo}. Pulando.`);
                        continue;
                }
                if (veiculoInstancia) {
                    veiculoInstancia.combustivel = d.combustivel ?? 100;
                    veiculoInstancia.ligado = d.ligado || false;
                    veiculoInstancia.velocidade = d.velocidade || 0;
                    veiculoInstancia.velocidadeMaxima = d.velocidadeMaxima || veiculoInstancia.velocidadeMaxima;
                    if (veiculoInstancia instanceof CarroEsportivo) veiculoInstancia.turboAtivado = d.turboAtivado || false;
                    if (veiculoInstancia instanceof Caminhao) veiculoInstancia.cargaAtual = d.cargaAtual || 0;
                    if (Array.isArray(d.historicoManutencao)) {
                        veiculoInstancia.historicoManutencao = d.historicoManutencao
                            .map(m => this._deserializarManutencao(m))
                            .filter(m => m !== null);
                    } else {
                        veiculoInstancia.historicoManutencao = [];
                    }
                    veiculoInstancia.nomeNaGaragem = nomeVeiculo;
                    this.veiculos[nomeVeiculo] = veiculoInstancia;
                }
            }
            console.log(`Garagem carregada (v${this.localStorageKey.split('_v')[1]}) com ${Object.keys(this.veiculos).length} veículo(s).`);
            return true;
        } catch (error) {
            console.error(`Erro ao carregar/parsear garagem (v${this.localStorageKey.split('_v')[1]}):`, error);
            localStorage.removeItem(this.localStorageKey);
            alert("Erro ao carregar dados da garagem. Os dados podem estar corrompidos e foram removidos.");
            this.veiculos = {};
            return false;
        }
    }


    // --- Busca Detalhes Extras (API Simulada - AGORA INCORPORADA) ---

    async buscarDetalhesVeiculoAPI(identificadorVeiculo) {
        console.log(`Buscando detalhes extras nos dados embutidos para: ${identificadorVeiculo}`);
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // ACESSE A PROPRIEDADE ESTÁTICA USANDO Garagem.DADOS_VEICULOS_API_SIMULADA
            // ou this.DADOS_VEICULOS_API_SIMULADA se você escolheu a Opção 2 no construtor
            const dadosVeiculo = Garagem.DADOS_VEICULOS_API_SIMULADA.find(veiculo => veiculo.id === identificadorVeiculo);
            return dadosVeiculo || null;
        } catch (error) {
           console.error(`Erro ao buscar detalhes nos dados embutidos para ${identificadorVeiculo}:`, error);
           return null;
        }
    }

    async mostrarDetalhesExtras(veiculoId) {
        const displayElement = document.getElementById(`detalhes-extras-${veiculoId}`);
        if (!displayElement) {
            console.error(`Elemento de exibição 'detalhes-extras-${veiculoId}' não encontrado.`);
            return;
        }
        displayElement.innerHTML = '<p class="loading">Carregando detalhes extras...</p>';
        displayElement.style.display = 'block';
        const detalhes = await this.buscarDetalhesVeiculoAPI(veiculoId); // O método da instância chama o outro
        if (detalhes) {
            let htmlConteudo = `<h4>Detalhes Extras (${detalhes.modeloOriginal || veiculoId})</h4><ul>`;
            if (detalhes.valorFIPE) htmlConteudo += `<li><strong>Valor FIPE (aprox.):</strong> ${detalhes.valorFIPE}</li>`;
            if (detalhes.recallPendente) htmlConteudo += `<li><strong>Recall Pendente:</strong> ${detalhes.recallPendente}</li>`;
            else htmlConteudo += `<li><strong>Recall Pendente:</strong> Nenhum encontrado.</li>`;
            if (detalhes.dicaManutencao) htmlConteudo += `<li><strong>Dica de Manutenção:</strong> ${detalhes.dicaManutencao}</li>`;
            if (detalhes.seguroMedioAnual) htmlConteudo += `<li><strong>Seguro Médio Anual (est.):</strong> ${detalhes.seguroMedioAnual}</li>`;
            if (detalhes.consumoMedio) htmlConteudo += `<li><strong>Consumo Médio:</strong> ${detalhes.consumoMedio}</li>`;
            htmlConteudo += '</ul>';
            displayElement.innerHTML = htmlConteudo;
        } else {
            displayElement.innerHTML = `<p class="not-found">Detalhes extras não encontrados para este veículo.</p>`;
        }
    }


    // --- Helpers de Exibição de Manutenção ---
    _renderizarHistoricoConcluido(historicoConcluido) {
        if (!historicoConcluido || historicoConcluido.length === 0) {
            return "\nNenhuma manutenção realizada registrada.";
        }
        historicoConcluido.sort((a, b) => (b.getDateTime()?.getTime() || 0) - (a.getDateTime()?.getTime() || 0));
        return historicoConcluido
            .map(m => `\n${m.formatar()}`)
            .join('');
    }

    _renderizarListaAgendamentos(listaElement, agendamentosOrdenados) {
        listaElement.innerHTML = '';
        if (agendamentosOrdenados.length === 0) {
            listaElement.innerHTML = '<li class="nenhum">Nenhum agendamento futuro encontrado.</li>';
        } else {
            agendamentosOrdenados.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `[${item.veiculoNome}] ${item.manutencao.formatar()}`;
                listaElement.appendChild(li);
            });
        }
    }

    // --- Atualização da UI ---
    atualizarDisplaysManutencao(nomeVeiculoAtualizado, modeloVeiculoAtualizado) {
        const infoArea = document.getElementById('informacoesVeiculo');
        if (infoArea && infoArea.textContent.includes(`Modelo: ${modeloVeiculoAtualizado}`)) {
            this.exibirInformacoes(nomeVeiculoAtualizado);
        }
        this.atualizarListaAgendamentos();
    }

    atualizarUICompleta() {
        console.log("Atualizando UI completa...");
        for (const nomeVeiculo in this.veiculos) {
            const veiculo = this.veiculos[nomeVeiculo];
            veiculo.atualizarDetalhes();
            veiculo.atualizarStatus();
            veiculo.atualizarVelocidadeDisplay();
            veiculo.atualizarPonteiroVelocidade();
            veiculo.atualizarInfoDisplay();
            this.preencherInputsVeiculo(nomeVeiculo, veiculo);
        }
        const primeiroNome = Object.keys(this.veiculos)[0];
        const infoArea = document.getElementById('informacoesVeiculo');
        if (primeiroNome && infoArea) {
            this.exibirInformacoes(primeiroNome);
        } else if (infoArea) {
            infoArea.textContent = "Nenhum veículo na garagem. Crie ou atualize um veículo acima.";
        }
        this.atualizarListaAgendamentos();
    }

    preencherInputsVeiculo(nome, veiculo) {
        const suffix = nome === 'meuCarro' ? 'Carro' :
                       nome === 'carroEsportivo' ? 'Esportivo' :
                       nome === 'caminhao' ? 'Caminhao' :
                       nome === 'moto' ? 'Moto' : null;
        if (!suffix) return;
        const modeloInput = document.getElementById(`modelo${suffix}`);
        const corInput = document.getElementById(`cor${suffix}`);
        if (modeloInput && veiculo.modelo !== "Não definido") modeloInput.value = veiculo.modelo;
        if (corInput && veiculo.cor !== "Não definida") corInput.value = veiculo.cor;
        if (nome === 'caminhao' && veiculo instanceof Caminhao) {
            const capacidadeInput = document.getElementById('capacidadeCarga');
            if (capacidadeInput && veiculo.capacidadeCarga) {
                capacidadeInput.value = veiculo.capacidadeCarga;
            }
        }
    }

    // --- Criação e Atualização de Veículos ---
    _criarOuAtualizarVeiculo(nomeInterno, ClasseVeiculo, modelo, cor, argsExtras = []) {
        let veiculo = this.veiculos[nomeInterno];
        const ehNovo = !veiculo;
        if (ehNovo) {
            veiculo = new ClasseVeiculo(modelo, cor, ...argsExtras);
            veiculo.nomeNaGaragem = nomeInterno;
            this.veiculos[nomeInterno] = veiculo;
            console.log(`${ClasseVeiculo.name} "${modelo}" criado!`);
        } else {
            veiculo.modelo = modelo;
            veiculo.cor = cor;
            if (ClasseVeiculo === Caminhao && argsExtras.length > 0) {
                const novaCapacidade = argsExtras[0];
                if (veiculo.capacidadeCarga !== novaCapacidade) {
                    veiculo.capacidadeCarga = novaCapacidade > 0 ? novaCapacidade : 1000;
                    if (veiculo.cargaAtual > veiculo.capacidadeCarga) {
                        veiculo.cargaAtual = veiculo.capacidadeCarga;
                    }
                    console.log(`Capacidade do caminhão ${veiculo.modelo} atualizada para ${veiculo.capacidadeCarga}kg.`);
                }
            }
            console.log(`${ClasseVeiculo.name} "${veiculo.modelo}" atualizado.`);
        }
        const containerId = `${veiculo.obterPrefixoIdHtml()}-container`;
        const veiculoContainer = document.getElementById(containerId);
        if (veiculoContainer) {
            console.log(`Container ${containerId} encontrado. Atualizando a UI do veículo...`);
            veiculo.atualizarDetalhes();
            veiculo.atualizarStatus();
            veiculo.atualizarVelocidadeDisplay();
            veiculo.atualizarPonteiroVelocidade();
            veiculo.atualizarInfoDisplay();
            this.exibirInformacoes(nomeInterno);
        } else {
            console.log(`Container ${containerId} não encontrado. Pulando atualização da UI específica do veículo.`);
        }
        this.salvarGaragem();
    }

    criarCarro() {
        const modeloInput = document.getElementById('modeloCarro');
        const corInput = document.getElementById('corCarro');
        const m = (modeloInput ? modeloInput.value.trim() : "") || "Civic";
        const c = (corInput ? corInput.value.trim() : "") || "Branco";
        this._criarOuAtualizarVeiculo('meuCarro', Carro, m, c);
    }
    criarCarroEsportivo() {
        const modeloInput = document.getElementById('modeloEsportivo');
        const corInput = document.getElementById('corEsportivo');
        const m = (modeloInput ? modeloInput.value.trim() : "") || "Pagani";
        const c = (corInput ? corInput.value.trim() : "") || "Rosa";
        this._criarOuAtualizarVeiculo('carroEsportivo', CarroEsportivo, m, c);
    }
    criarCaminhao() {
        const modeloInput = document.getElementById('modeloCaminhao');
        const corInput = document.getElementById('corCaminhao');
        const capacidadeInput = document.getElementById('capacidadeCarga');
        const m = (modeloInput ? modeloInput.value.trim() : "") || "Actros";
        const c = (corInput ? corInput.value.trim() : "") || "Cinza";
        const cap = (capacidadeInput ? parseInt(capacidadeInput.value, 10) : NaN) || 5000;
        this._criarOuAtualizarVeiculo('caminhao', Caminhao, m, c, [cap]);
    }
    criarMoto() {
        const modeloInput = document.getElementById('modeloMoto');
        const corInput = document.getElementById('corMoto');
        const m = (modeloInput ? modeloInput.value.trim() : "") || "Ninja";
        const c = (corInput ? corInput.value.trim() : "") || "Preta/Rosa";
        this._criarOuAtualizarVeiculo('moto', Moto, m, c);
    }

    // --- Interação com Veículos ---
    interagirComVeiculo(nomeVeiculo, acao) {
        const veiculo = this.veiculos[nomeVeiculo];
        if (!veiculo) {
            alert(`Veículo "${nomeVeiculo}" ainda não existe. Crie ou atualize primeiro.`);
            try {
                let btnSelector = `button[onclick*="criar${nomeVeiculo.replace('meuC', 'C')}"]`;
                document.querySelector(btnSelector)?.focus();
            } catch (e) { /* Ignora erro */ }
            return;
        }
        try {
            let sucessoAcao = true;
            switch (acao) {
                case 'ligar':           veiculo.ligar(); break;
                case 'desligar':        veiculo.desligar(); break;
                case 'acelerar':        veiculo.acelerar(); break;
                case 'frear':           veiculo.frear(); break;
                case 'ativarTurbo':     if (veiculo instanceof CarroEsportivo) veiculo.ativarTurbo(); else alert("Ação inválida para este veículo."); break;
                case 'desativarTurbo':  if (veiculo instanceof CarroEsportivo) veiculo.desativarTurbo(); else alert("Ação inválida para este veículo."); break;
                case 'carregar':
                    const pesoCarregarInput = document.getElementById('pesoCarga');
                    if (veiculo instanceof Caminhao && pesoCarregarInput) {
                        sucessoAcao = veiculo.carregar(pesoCarregarInput.value);
                        if (sucessoAcao) pesoCarregarInput.value = '';
                    } else { alert("Ação inválida ou input não encontrado."); }
                    break;
                case 'descarregar':
                    const pesoDescargaInput = document.getElementById('pesoDescarga');
                    if (veiculo instanceof Caminhao && pesoDescargaInput) {
                        sucessoAcao = veiculo.descarregar(pesoDescargaInput.value);
                        if (sucessoAcao) pesoDescargaInput.value = '';
                    } else { alert("Ação inválida ou input não encontrado."); }
                    break;
                default:
                    alert("Ação desconhecida: " + acao);
                    break;
            }
            const infoArea = document.getElementById('informacoesVeiculo');
            if (infoArea && infoArea.textContent.includes(`Modelo: ${veiculo.modelo}`)) {
                this.exibirInformacoes(nomeVeiculo);
            }
        } catch (error) {
            console.error(`Erro ao interagir (${acao}) com ${nomeVeiculo}:`, error);
            alert(`Ocorreu um erro durante a ação "${acao}".`);
        }
    }

    pintarVeiculo(nomeVeiculo) {
        const veiculo = this.veiculos[nomeVeiculo];
        if (!veiculo) return alert(`Veículo "${nomeVeiculo}" não existe.`);
        const suffix = nomeVeiculo === 'meuCarro' ? '' :
                       nomeVeiculo === 'carroEsportivo' ? 'Esportivo' :
                       nomeVeiculo === 'caminhao' ? 'Caminhao' :
                       nomeVeiculo === 'moto' ? 'Moto' : null;
        if (suffix === null && nomeVeiculo !== 'meuCarro') return alert("Erro interno: Mapeamento de ID de pintura falhou.");
        const corInput = document.getElementById(`corPintura${suffix}`);
        if (corInput) {
            const sucesso = veiculo.pintar(corInput.value);
            if (sucesso) {
                const infoArea = document.getElementById('informacoesVeiculo');
                if (infoArea && infoArea.textContent.includes(`Modelo: ${veiculo.modelo}`)) {
                    this.exibirInformacoes(nomeVeiculo);
                }
                corInput.value = '';
            }
        } else {
             alert(`Erro interno: Input de pintura "corPintura${suffix}" não encontrado.`);
        }
    }

    abastecerVeiculo(nomeVeiculo) {
        const veiculo = this.veiculos[nomeVeiculo];
        if (!veiculo) return alert(`Veículo "${nomeVeiculo}" não existe.`);
        const suffix = nomeVeiculo === 'meuCarro' ? '' :
                       nomeVeiculo === 'carroEsportivo' ? 'Esportivo' :
                       nomeVeiculo === 'caminhao' ? 'Caminhao' :
                       nomeVeiculo === 'moto' ? 'Moto' : null;
        if (suffix === null && nomeVeiculo !== 'meuCarro') return alert("Erro interno: Mapeamento de ID de combustível falhou.");
        const combustivelInput = document.getElementById(`combustivel${suffix}`);
        if (combustivelInput) {
            const quantidade = parseInt(combustivelInput.value, 10);
            const sucesso = veiculo.abastecer(quantidade);
            if (sucesso) {
                const infoArea = document.getElementById('informacoesVeiculo');
                if (infoArea && infoArea.textContent.includes(`Modelo: ${veiculo.modelo}`)) {
                    this.exibirInformacoes(nomeVeiculo);
                }
                combustivelInput.value = '';
            }
        } else {
             alert(`Erro interno: Input de combustível "combustivel${suffix}" não encontrado.`);
        }
    }

    // --- Métodos de Manutenção ---
    registrarManutencao(nomeVeiculo) {
        const veiculo = this.veiculos[nomeVeiculo];
        if (!veiculo) return alert(`Veículo "${nomeVeiculo}" não criado.`);
        const idSuffix = veiculo.obterIdHtmlSufixoFormulario();
        if (!idSuffix) return alert("Erro interno: Sufixo de ID do formulário não encontrado.");
        const dataInput = document.getElementById(`dataManutencao${idSuffix}`);
        const tipoInput = document.getElementById(`tipoManutencao${idSuffix}`);
        const custoInput = document.getElementById(`custoManutencao${idSuffix}`);
        const descInput = document.getElementById(`descManutencao${idSuffix}`);
        if (!dataInput || !tipoInput || !custoInput || !descInput) {
            return alert(`Erro interno: Campos de registro de manutenção (${idSuffix}) não encontrados no HTML.`);
        }
        const manutencao = new Manutencao(
            dataInput.value,
            tipoInput.value,
            custoInput.value,
            descInput.value,
            null,
            'concluida'
        );
        const erros = manutencao.validar();
        if (erros.length > 0) {
            alert("Erro ao registrar manutenção:\n- " + erros.join("\n- "));
            return;
        }
        if (veiculo.adicionarManutencaoValidada(manutencao)) {
            dataInput.value = '';
            tipoInput.value = '';
            custoInput.value = '';
            descInput.value = '';
        }
    }

    agendarManutencao(nomeVeiculo) {
        const veiculo = this.veiculos[nomeVeiculo];
        if (!veiculo) return alert(`Veículo "${nomeVeiculo}" não criado.`);
        const idSuffix = veiculo.obterIdHtmlSufixoFormulario();
         if (!idSuffix) return alert("Erro interno: Sufixo de ID do formulário não encontrado.");
        const dataInput = document.getElementById(`dataAgendamento${idSuffix}`);
        const horaInput = document.getElementById(`horaAgendamento${idSuffix}`);
        const tipoInput = document.getElementById(`tipoAgendamento${idSuffix}`);
        const obsInput = document.getElementById(`obsAgendamento${idSuffix}`);
        if (!dataInput || !horaInput || !tipoInput || !obsInput) {
            return alert(`Erro interno: Campos de agendamento (${idSuffix}) não encontrados no HTML.`);
        }
        const agendamento = new Manutencao(
            dataInput.value,
            tipoInput.value,
            null,
            obsInput.value,
            horaInput.value || null,
            'agendada'
        );
        const erros = agendamento.validar();
        if (erros.length > 0) {
            alert("Erro ao agendar manutenção:\n- " + erros.join("\n- "));
            return;
        }
        if (veiculo.adicionarManutencaoValidada(agendamento)) {
            dataInput.value = '';
            horaInput.value = '';
            tipoInput.value = '';
            obsInput.value = '';
        }
    }

    // --- Atualização e Exibição da Lista de Agendamentos ---
    atualizarListaAgendamentos() {
        const listaElement = document.getElementById('listaAgendamentos');
        if (!listaElement) {
             console.warn("Elemento 'listaAgendamentos' não encontrado no HTML. Pulando atualização da lista.");
             return;
        }
        const agora = new Date();
        agora.setSeconds(0, 0);
        let todosAgendamentosFuturos = [];
        for (const nomeVeiculo in this.veiculos) {
            const veiculo = this.veiculos[nomeVeiculo];
            if (Array.isArray(veiculo.historicoManutencao)) {
                veiculo.historicoManutencao.forEach(manutencao => {
                    const m = manutencao;
                    if (!m) return;
                    const dataM = m.getDateTime();
                    if (m.status === 'agendada' && m.validar().length === 0 && dataM && dataM >= agora) {
                        todosAgendamentosFuturos.push({
                            veiculoNome: veiculo.modelo,
                            manutencao: m,
                            dataObj: dataM
                        });
                    }
                });
            }
        }
        todosAgendamentosFuturos.sort((a, b) => a.dataObj - b.dataObj);
        this._renderizarListaAgendamentos(listaElement, todosAgendamentosFuturos);
    }

    // --- Exibição de Informações do Veículo Selecionado ---
    exibirInformacoes(nomeVeiculo) {
        const veiculo = this.veiculos[nomeVeiculo];
        const infoArea = document.getElementById('informacoesVeiculo');
        if (!infoArea) {
             console.warn("Elemento 'informacoesVeiculo' não encontrado. Pulando exibição de informações.");
             return;
        }
        if (veiculo) {
            try {
                infoArea.textContent = veiculo.exibirInformacoes();
             } catch (error) {
                 console.error(`Erro ao gerar informações para ${nomeVeiculo}:`, error);
                 infoArea.textContent = `Erro ao obter informações para ${veiculo.modelo || nomeVeiculo}.`;
            }
        } else {
            infoArea.textContent = `Veículo "${nomeVeiculo}" não existe na garagem.`;
        }
    }

    // --- Lembretes de Agendamento ---
    verificarAgendamentosProximos() {
        console.log("Verificando agendamentos próximos...");
        const agora = new Date();
        const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const amanhaInicio = new Date(hojeInicio.getTime() + 24 * 60 * 60 * 1000);
        const depoisDeAmanhaInicio = new Date(amanhaInicio.getTime() + 24 * 60 * 60 * 1000);
        const lembretes = [];
        for (const nomeVeiculo in this.veiculos) {
            const veiculo = this.veiculos[nomeVeiculo];
            if (Array.isArray(veiculo.historicoManutencao)) {
                veiculo.historicoManutencao.forEach(manutencao => {
                    const m = manutencao;
                    if (!m) return;
                    const dataM = m.getDateTime();
                    if (m.status === 'agendada' && m.validar().length === 0 && dataM) {
                        let quando = '';
                        if (dataM >= agora && dataM < amanhaInicio) {
                            quando = "hoje";
                        }
                        else if (dataM >= amanhaInicio && dataM < depoisDeAmanhaInicio) {
                            quando = "amanhã";
                        }
                        if (quando) {
                            let horaFormatada = m.hora ? ` às ${m.hora}` : '';
                            lembretes.push(`- ${m.tipo} (${veiculo.modelo}) agendado para ${quando}${horaFormatada}.`);
                        }
                    }
                });
            }
        }
        if (lembretes.length > 0) {
            console.log("Lembretes encontrados:", lembretes);
            alert("🔔 Lembretes de Agendamento:\n\n" + lembretes.join("\n\n"));
        } else {
            console.log("Nenhum lembrete de agendamento para hoje ou amanhã.");
        }
    }
}