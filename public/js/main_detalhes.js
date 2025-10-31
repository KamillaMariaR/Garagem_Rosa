// js/main_detalhes.js

// Proteção de Rota: Redireciona para o login se o usuário não estiver logado
if (!isLoggedIn()) {
    alert("Você precisa estar logado para ver os detalhes do veículo.");
    window.location.href = '/index.html';
}

const garagem = new Garagem();
let veiculoDbId = null;

function getTipoDePagina() {
    if (document.getElementById('carro-container')) return 'carro';
    if (document.getElementById('carroEsportivo-container')) return 'esportivo';
    if (document.getElementById('caminhao-container')) return 'caminhao';
    if (document.getElementById('moto-container')) return 'moto';
    return null;
}

function getVeiculoIdFromPage() {
    if (document.getElementById('carro-container')) return 'meuCarro';
    if (document.getElementById('carroEsportivo-container')) return 'carroEsportivo';
    if (document.getElementById('caminhao-container')) return 'caminhao';
    if (document.getElementById('moto-container')) return 'moto';
    return null;
}

async function encontrarVeiculoIdParaPagina(tipo) {
    try {
        // Usa o backendUrl que definimos no auth.js
        const response = await fetchWithAuth(`${backendUrl}/api/veiculos`);
        if (!response.ok) return null;
        const veiculos = await response.json();
        let veiculoEncontrado = null;
        switch (tipo) {
            case 'carro': veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('civic')); break;
            case 'esportivo': veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('pagani')); break;
            case 'caminhao': veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('actros')); break;
            case 'moto': veiculoEncontrado = veiculos.find(v => v.modelo.toLowerCase().includes('ninja')); break;
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
        const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`);
        if (!response.ok) throw new Error(`Erro ${response.status}: Não foi possível carregar as manutenções.`);
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
        const response = await fetchWithAuth(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`, {
            method: 'POST',
            body: JSON.stringify(dadosFormulario)
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.error || `Erro ${response.status}`);
        alert('Manutenção adicionada com sucesso!');
        await carregarManutencoes(veiculoId);
        document.getElementById('form-add-manutencao').reset();
    } catch (error) {
        console.error("Erro ao adicionar manutenção:", error);
        alert(`Falha ao adicionar manutenção: ${error.message}`);
    }
}

window.onload = async () => {
    console.log("Página de DETALHES carregada.");
    garagem.carregarGaragem();
    const veiculoIdSimulado = getVeiculoIdFromPage();
    if (veiculoIdSimulado) {
        const btnExtras = document.querySelector(`.btn-detalhes-extras[data-veiculo-id="${veiculoIdSimulado}"]`);
        if (btnExtras) {
            btnExtras.addEventListener('click', () => garagem.mostrarDetalhesExtras(veiculoIdSimulado));
        }
    }
    const veiculoSimulado = garagem.veiculos[veiculoIdSimulado];
    if (veiculoIdSimulado && veiculoSimulado) {
        veiculoSimulado.atualizarDetalhes();
        veiculoSimulado.atualizarStatus();
        veiculoSimulado.atualizarVelocidadeDisplay();
        veiculoSimulado.atualizarPonteiroVelocidade();
        veiculoSimulado.atualizarInfoDisplay();
        garagem.preencherInputsVeiculo(veiculoIdSimulado, veiculoSimulado);
        garagem.exibirInformacoes(veiculoIdSimulado);
    } else if (veiculoIdSimulado) {
        const infoArea = document.getElementById('informacoesVeiculo');
        if (infoArea) {
            infoArea.textContent = `Este veículo ainda não está na sua garagem simulada. Preencha os campos e clique em "Criar/Atualizar" para começar a interagir.`;
        }
    }

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