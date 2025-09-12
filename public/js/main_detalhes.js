// js/main_detalhes.js (CORRIGIDO - Botão "Detalhes Extras" agora funciona sempre)

const garagem = new Garagem();
const backendUrl = 'http://localhost:3001';
let veiculoDbId = null;

/**
 * Descobre qual tipo de veículo esta página representa.
 * @returns {string | null} 'carro', 'esportivo', 'caminhao', 'moto' ou null.
 */
function getTipoDePagina() {
    if (document.getElementById('carro-container')) return 'carro';
    if (document.getElementById('carroEsportivo-container')) return 'esportivo';
    if (document.getElementById('caminhao-container')) return 'caminhao';
    if (document.getElementById('moto-container')) return 'moto';
    return null;
}

/**
 * Retorna o ID interno usado na simulação da Garagem.
 * @returns {string | null} O ID do veículo ('meuCarro', 'moto', etc.) ou null se não encontrar.
 */
function getVeiculoIdFromPage() {
    if (document.getElementById('carro-container')) return 'meuCarro';
    if (document.getElementById('carroEsportivo-container')) return 'carroEsportivo';
    if (document.getElementById('caminhao-container')) return 'caminhao';
    if (document.getElementById('moto-container')) return 'moto';
    return null;
}

async function encontrarVeiculoIdParaPagina(tipo) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`);
        if (!response.ok) return null;
        const veiculos = await response.json();

        let veiculoEncontrado = null;
        switch (tipo) {
            case 'carro':
                veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('civic'));
                break;
            case 'esportivo':
                veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('pagani'));
                break;
            case 'caminhao':
                veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('actros'));
                break;
            case 'moto':
                veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('ninja'));
                break;
        }

        return veiculoEncontrado ? veiculoEncontrado._id : null;
    } catch (error) {
        console.error("Erro ao buscar veículos para encontrar ID:", error);
        return null;
    }
}

async function carregarManutencoes(veiculoId) {
    const listaUl = document.getElementById('lista-manutencoes');
    if (!listaUl) return;

    listaUl.innerHTML = '<li>Carregando histórico...</li>';

    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`);
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Não foi possível carregar as manutenções.`);
        }
        const manutencoes = await response.json();

        if (manutencoes.length === 0) {
            listaUl.innerHTML = '<li>Nenhum registro de manutenção encontrado.</li>';
            return;
        }

        listaUl.innerHTML = manutencoes.map(m => `
            <li>
                <strong>${new Date(m.data).toLocaleDateString('pt-BR')}</strong> - ${m.descricaoServico}
                <br>
                <span>Custo: ${m.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | KM: ${m.quilometragem || 'N/A'}</span>
            </li>
        `).join('');

    } catch (error) {
        console.error(error);
        listaUl.innerHTML = `<li class="error">${error.message}</li>`;
    }
}

async function adicionarManutencao(veiculoId, dadosFormulario) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario)
        });

        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.error || `Erro ${response.status}`);
        }

        alert('Manutenção adicionada com sucesso!');
        await carregarManutencoes(veiculoId);
        document.getElementById('form-add-manutencao').reset();

    } catch (error) {
        console.error("Erro ao adicionar manutenção:", error);
        alert(`Falha ao adicionar manutenção: ${error.message}`);
    }
}


// ==================================================================
// INICIALIZAÇÃO DA PÁGINA DE DETALHES DE UM VEÍCULO
// ==================================================================
window.onload = async () => {
    console.log("Página de DETALHES carregada.");
    
    // 1. Carrega a simulação interativa do localStorage
    garagem.carregarGaragem(); 

    // 2. Descobre qual veículo simulado pertence a esta página
    const veiculoIdSimulado = getVeiculoIdFromPage();

    // 3. (CORRIGIDO) Adiciona a funcionalidade ao botão "Detalhes Extras" SEMPRE
    if (veiculoIdSimulado) {
        const btnExtras = document.querySelector(`.btn-detalhes-extras[data-veiculo-id="${veiculoIdSimulado}"]`);
        if(btnExtras) {
            btnExtras.addEventListener('click', () => garagem.mostrarDetalhesExtras(veiculoIdSimulado));
        }
    }

    // 4. Agora, verifica se o veículo existe na simulação para atualizar a UI interativa
    const veiculoSimulado = garagem.veiculos[veiculoIdSimulado];
    if (veiculoIdSimulado && veiculoSimulado) {
        console.log(`Inicializando UI da simulação para o veículo: ${veiculoIdSimulado}`);
        // Atualiza a parte interativa (velocidade, status, etc.)
        veiculoSimulado.atualizarDetalhes();
        veiculoSimulado.atualizarStatus();
        veiculoSimulado.atualizarVelocidadeDisplay();
        veiculoSimulado.atualizarPonteiroVelocidade();
        veiculoSimulado.atualizarInfoDisplay();
        garagem.preencherInputsVeiculo(veiculoIdSimulado, veiculoSimulado);
        garagem.exibirInformacoes(veiculoIdSimulado);

    } else if (veiculoIdSimulado) {
        // Se o veículo não existe na simulação, avisa o usuário
        console.warn(`Veículo simulado com ID '${veiculoIdSimulado}' não encontrado.`);
        const infoArea = document.getElementById('informacoesVeiculo');
        if (infoArea) {
            infoArea.textContent = `Este veículo ainda não está na sua garagem simulada. Preencha os campos e clique em "Criar/Atualizar" para começar a interagir.`;
        }
    } else {
        console.error("ERRO: Não foi possível identificar o veículo desta página de detalhes.");
    }
    
    // --- LÓGICA DE MANUTENÇÃO DO BANCO DE DADOS (Permanece igual) ---
    const tipoPagina = getTipoDePagina();
    const secaoManutencaoDB = document.getElementById('secao-manutencao-db');
    if (tipoPagina && secaoManutencaoDB) {
        veiculoDbId = await encontrarVeiculoIdParaPagina(tipoPagina);
        
        if (veiculoDbId) {
            secaoManutencaoDB.style.display = 'block';
            await carregarManutencoes(veiculoDbId);

            const formManutencao = document.getElementById('form-add-manutencao');
            formManutencao.addEventListener('submit', async (event) => {
                event.preventDefault();
                const dados = {
                    descricaoServico: document.getElementById('input-manutencao-descricao').value,
                    custo: document.getElementById('input-manutencao-custo').value,
                    quilometragem: document.getElementById('input-manutencao-km').value
                };
                
                const btnSubmit = formManutencao.querySelector('button');
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Salvando...';

                await adicionarManutencao(veiculoDbId, dados);

                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Adicionar Manutenção';
            });

        } else {
            secaoManutencaoDB.innerHTML = `<h2>Histórico de Manutenções (Banco de Dados)</h2><p class="not-found">Nenhum veículo correspondente a esta página ('${tipoPagina}') foi encontrado no banco de dados. Por favor, adicione um na página inicial para ver e registrar manutenções.</p>`;
            secaoManutencaoDB.style.display = 'block';
        }
    }

    console.log("Inicialização da página de detalhes completa.");
};