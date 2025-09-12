// js/veiculo.js

/**
 * Classe base para todos os veículos da garagem.
 * Depende: Manutencao (deve ser carregado antes)
 * Interage com: garagem (variável global)
 */
class Veiculo {
    /**
     * Cria uma instância de Veiculo.
     * @param {string} modelo - O modelo do veículo.
     * @param {string} cor - A cor do veículo.
     */
    constructor(modelo, cor) {
        this.modelo = modelo || "Não definido";
        this.cor = cor || "Não definida";
        this.combustivel = 100; // Percentual
        this.historicoManutencao = []; // Array de instâncias de Manutencao
        this.nomeNaGaragem = null; // Identificador interno (ex: 'meuCarro')
    }

    // --- Ações Comuns ---

    /**
     * Pinta o veículo com uma nova cor.
     * @param {string} novaCor - A nova cor desejada.
     * @returns {boolean} True se a pintura foi bem-sucedida, false caso contrário.
     */
    pintar(novaCor) {
        if (novaCor && typeof novaCor === 'string' && novaCor.trim() !== '') {
            this.cor = novaCor.trim();
            if (this.atualizarDetalhes) this.atualizarDetalhes(); // Atualiza UI se método existir
            console.log(`Veículo ${this.nomeNaGaragem} pintado de ${this.cor}`);
            garagem.salvarGaragem(); // Persiste a mudança
            return true;
        } else {
            alert("Por favor, insira uma cor válida.");
            return false;
        }
    }

    /**
     * Adiciona um registro de manutenção JÁ VALIDADO ao histórico do veículo.
     * @param {Manutencao} manutencao - O objeto Manutencao validado.
     * @returns {boolean} True se adicionado com sucesso.
     */
    adicionarManutencaoValidada(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
            console.error("Tentativa de adicionar manutenção não validada ou de tipo incorreto.", manutencao);
            return false;
        }
        this.historicoManutencao.push(manutencao);
        console.log(`Manutenção (${manutencao.status}) adicionada para ${this.nomeNaGaragem}.`);
        garagem.atualizarDisplaysManutencao(this.nomeNaGaragem, this.modelo); // Atualiza UI (lista agendamentos, info veículo)
        garagem.salvarGaragem(); // Persiste a mudança
        alert(`Manutenção ${manutencao.status === 'agendada' ? 'agendada' : 'registrada'} com sucesso!`);
        return true;
    }

    // --- Exibição de Informações ---

    /**
     * Retorna uma string formatada com as informações básicas e o histórico CONCLUÍDO do veículo.
     * As subclasses devem chamar este método e adicionar suas informações específicas.
     * @returns {string} Informações formatadas.
     */
    exibirInformacoes() {
        let info = `Modelo: ${this.modelo}\nCor: ${this.cor}\nCombustível: ${this.combustivel}%`;

        // Filtra manutenções concluídas
        const concluidas = this.historicoManutencao.filter(m => m.status === 'concluida');

        // Delega a formatação do histórico para o helper da Garagem
        info += "\n\n--- Histórico de Manutenção Realizada ---";
        info += garagem._renderizarHistoricoConcluido(concluidas);

        return info;
    }

    // --- Métodos de Atualização de UI (Placeholders) ---
    // Estes métodos devem ser implementados ou sobrescritos pelas subclasses
    // para interagir com os elementos HTML específicos de cada tipo de veículo.

    /** Atualiza os detalhes visuais (modelo, cor) na UI. */
    atualizarDetalhes() { console.warn(`atualizarDetalhes não implementado para ${this.constructor.name}`); }
    /** Atualiza o status visual (Ligado/Desligado) e habilita/desabilita botões na UI. */
    atualizarStatus() { console.warn(`atualizarStatus não implementado para ${this.constructor.name}`); }
    /** Atualiza o display numérico de velocidade (km/h) na UI. */
    atualizarVelocidadeDisplay() { console.warn(`atualizarVelocidadeDisplay não implementado para ${this.constructor.name}`); }
    /** Atualiza a barra/ponteiro de velocidade na UI. */
    atualizarPonteiroVelocidade() { console.warn(`atualizarPonteiroVelocidade não implementado para ${this.constructor.name}`); }
    /** Atualiza áreas de informação específicas (Turbo, Carga) na UI. */
    atualizarInfoDisplay() { /* Pode ser vazio para veículos sem info extra */ }

    // --- Helpers Internos ---

    /**
     * Ativa uma animação CSS (aceleração ou freagem) no elemento correspondente.
     * @param {'aceleracao' | 'freagem'} tipoAnimacao - O tipo de animação.
     * @param {string} prefixoId - O prefixo do ID do elemento HTML (ex: 'carro', 'carroEsportivo').
     */
    ativarAnimacao(tipoAnimacao, prefixoId) {
        const elemento = document.getElementById(`animacao-${tipoAnimacao}-${prefixoId}`);
        if (elemento) {
            elemento.classList.add('ativa');
            // Remove a classe após a duração da animação CSS
            setTimeout(() => elemento.classList.remove('ativa'), 300);
        }
    }

    /**
     * Obtém o prefixo usado nos IDs principais dos elementos HTML deste veículo.
     * Ex: 'carro', 'carroEsportivo', 'caminhao', 'moto'.
     * @returns {string} O prefixo do ID.
     */
    obterPrefixoIdHtml() {
        // Mapeia o nome interno da garagem para o prefixo do ID HTML
        switch (this.nomeNaGaragem) {
            case 'meuCarro': return 'carro';
            case 'carroEsportivo': return 'carroEsportivo';
            case 'caminhao': return 'caminhao';
            case 'moto': return 'moto';
            default:
                console.error("Nome interno de veículo desconhecido:", this.nomeNaGaragem);
                return '';
        }
    }

    /**
     * Obtém o sufixo usado nos IDs dos elementos do *formulário de manutenção* deste veículo.
     * Ex: 'Carro', 'Esportivo', 'Caminhao', 'Moto'. (Note a capitalização)
     * @returns {string} O sufixo do ID do formulário.
     */
    obterIdHtmlSufixoFormulario() {
        // Mapeia o nome interno para o sufixo usado nos IDs dos inputs de manutenção
        switch (this.nomeNaGaragem) {
            case 'meuCarro': return 'Carro';
            case 'carroEsportivo': return 'Esportivo'; // Corrigido
            case 'caminhao': return 'Caminhao';
            case 'moto': return 'Moto';
            default:
                console.error("Nome interno de veículo desconhecido para sufixo de form:", this.nomeNaGaragem);
                return '';
        }
    }
}