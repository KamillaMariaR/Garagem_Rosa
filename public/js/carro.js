// js/carro.js

/**
 * Classe Carro, herda de Veiculo.
 * Depende: Veiculo (deve ser carregado antes)
 */
class Carro extends Veiculo {
    constructor(modelo, cor) {
        super(modelo, cor);
        this.ligado = false;
        this.velocidade = 0;
        this.velocidadeMaxima = 200;
    }

    // --- Ações Específicas ---

    ligar() {
        if (this.ligado) return;
        if (this.combustivel > 0) {
            this.ligado = true;
            this.atualizarStatus(); // Atualiza UI
            console.log(`${this.nomeNaGaragem} ligado!`);
            garagem.salvarGaragem();
        } else {
            alert("Sem combustível!");
        }
    }

    desligar() {
        if (!this.ligado) return;

        const estavaLigado = this.ligado;
        this.ligado = false; // Define como desligado imediatamente

        // Se estiver em movimento, freia automaticamente antes de desligar completamente
        if (this.velocidade > 0) {
            console.log(`${this.nomeNaGaragem} desligando... Freando automaticamente.`);
            const interval = setInterval(() => {
                this.frear(true); // Chama frear internamente (sem animação/salvar repetido)
                if (this.velocidade === 0) {
                    clearInterval(interval);
                    this.atualizarStatus(); // Atualiza UI final (botões, status)
                    this.atualizarVelocidadeDisplay();
                    this.atualizarPonteiroVelocidade();
                    console.log(`${this.nomeNaGaragem} parado e desligado.`);
                    garagem.salvarGaragem(); // Salva estado final
                }
            }, 100); // Intervalo da frenagem
        } else {
            // Se já estava parado, apenas atualiza a UI e salva se necessário
            this.atualizarStatus();
            this.atualizarVelocidadeDisplay();
            this.atualizarPonteiroVelocidade();
            console.log(`${this.nomeNaGaragem} desligado.`);
            if (estavaLigado) garagem.salvarGaragem(); // Salva só se realmente mudou de estado
        }
    }

    acelerar() {
        const prefixoId = this.obterPrefixoIdHtml();
        if (!this.ligado) {
            return alert(`Ligue o ${prefixoId === 'carro' ? 'carro' : prefixoId} primeiro!`);
        }
        if (this.combustivel <= 0) {
            this.desligar(); // Desliga se tentar acelerar sem combustível
            return alert("Sem combustível!");
        }
        if (this.velocidade >= this.velocidadeMaxima) {
            return; // Já está na velocidade máxima
        }

        // Aumenta velocidade e consome combustível
        this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
        this.combustivel = Math.max(this.combustivel - 5, 0);

        // Atualiza UI
        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        this.ativarAnimacao('aceleracao', prefixoId);
        console.log(`${this.nomeNaGaragem} acelerando! V:${this.velocidade}, C:${this.combustivel.toFixed(0)}%`);
        garagem.salvarGaragem(); // Salva estado

        // Verifica se acabou o combustível após acelerar
        if (this.combustivel <= 0) {
            console.log("Combustível acabou durante a aceleração!");
            this.desligar(); // Inicia processo de desligamento (que vai frear)
        }
    }

    /**
     * Freia o veículo.
     * @param {boolean} [interno=false] - Flag para indicar se a chamada é interna (ex: desligamento),
     *                                    para evitar animações ou salvamentos repetidos.
     */
    frear(interno = false) {
        const prefixoId = this.obterPrefixoIdHtml();
        // Encontra o botão de frear específico deste veículo
        const frearBtnId = `frear${prefixoId === 'carro' ? '' : '-' + prefixoId}-btn`;
        const frearBtn = document.getElementById(frearBtnId);

        if (this.velocidade === 0) {
            if (frearBtn) frearBtn.disabled = true; // Garante que botão esteja desabilitado se parado
            return; // Não faz nada se já parado
        }

        // Diminui velocidade
        this.velocidade = Math.max(this.velocidade - 10, 0);

        // Atualiza UI
        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        if (frearBtn) frearBtn.disabled = (this.velocidade === 0); // Desabilita/Habilita botão

        // Ações apenas se chamado externamente (clique do usuário)
        if (!interno) {
            this.ativarAnimacao('freagem', prefixoId);
            console.log(`${this.nomeNaGaragem} freando! V:${this.velocidade}`);
            garagem.salvarGaragem(); // Salva estado
        }

        // Se parou E o carro está desligando (flag 'ligado' é false), atualiza status final
        if (this.velocidade === 0 && !this.ligado) {
            this.atualizarStatus();
        }
    }

    /**
     * Abastece o veículo.
     * @param {number} quantidade - Percentual de combustível a adicionar.
     * @returns {boolean} True se abastecido com sucesso, false se quantidade inválida.
     */
    abastecer(quantidade) {
        if (isNaN(quantidade) || quantidade < 0) {
             alert("Quantidade inválida. Use um número maior ou igual a 0.");
             return false;
        }
        const combustivelAntes = this.combustivel;
        this.combustivel = Math.min(this.combustivel + quantidade, 100); // Limita a 100%
        const adicionado = this.combustivel - combustivelAntes;

        alert(`${this.nomeNaGaragem} abastecido com ${adicionado.toFixed(0)}%. Nível atual: ${this.combustivel.toFixed(0)}%`);
        this.atualizarStatus(); // Habilita/Desabilita botões (ligar, turbo)
        this.atualizarInfoDisplay(); // Caso mostre combustível em outro lugar
        garagem.salvarGaragem(); // Salva novo nível de combustível
        return true;
    }

    // --- Métodos de Atualização de UI (Implementação) ---

    // js/carro.js - DENTRO da classe Carro

// Substitua seu método atualizarStatus por este:
atualizarStatus() {
    const prefixoId = this.obterPrefixoIdHtml();
    const statusElem = document.getElementById(`${prefixoId}-status`);

    // IDs dos botões
    const ligarBtnId = `ligar${prefixoId === 'carro' ? '' : '-' + prefixoId}-btn`;
    const desligarBtnId = `desligar${prefixoId === 'carro' ? '' : '-' + prefixoId}-btn`;
    const acelerarBtnId = `acelerar${prefixoId === 'carro' ? '' : '-' + prefixoId}-btn`;
    const frearBtnId = `frear${prefixoId === 'carro' ? '' : '-' + prefixoId}-btn`;

    // Busca os elementos
    const ligarBtn = document.getElementById(ligarBtnId);
    const desligarBtn = document.getElementById(desligarBtnId);
    const acelerarBtn = document.getElementById(acelerarBtnId);
    const frearBtn = document.getElementById(frearBtnId);
    
    // Atualiza texto e cor do status
    if (statusElem) { // <-- VERIFICAÇÃO IMPORTANTE!
        statusElem.textContent = this.ligado ? 'Ligado' : 'Desligado';
        statusElem.style.color = this.ligado ? 'green' : 'red';
    }

    // Habilita/Desabilita botões, SÓ SE ELES EXISTIREM
    if (ligarBtn) ligarBtn.disabled = this.ligado;
    if (desligarBtn) desligarBtn.disabled = !this.ligado;
    if (acelerarBtn) acelerarBtn.disabled = !this.ligado;
    if (frearBtn) frearBtn.disabled = this.velocidade === 0;

    // A lógica para os botões específicos (turbo, carga) já está nas classes filhas,
    // e como elas só rodam na página delas, o risco de erro é menor.
    // Esta mudança no Carro.js já protege a maior parte da lógica.
}

    atualizarVelocidadeDisplay() {
        const prefixoId = this.obterPrefixoIdHtml();
        const velElemId = `${prefixoId}-velocidade-valor`;
        // Tenta ID específico, se não achar (caso do carro base), usa ID genérico
        const velElem = document.getElementById(velElemId) || document.getElementById('velocidade-valor');
        if (velElem) {
            velElem.textContent = `${this.velocidade.toFixed(0)} km/h`;
        }
        // Garante que o botão de frear reflita o estado atual da velocidade
        const frearBtnId = `frear${prefixoId === 'carro' ? '' : '-' + prefixoId}-btn`;
        const frearBtn = document.getElementById(frearBtnId);
         if (frearBtn) {
             frearBtn.disabled = (this.velocidade === 0);
         }
    }

    atualizarPonteiroVelocidade() {
        const prefixoId = this.obterPrefixoIdHtml();
        const ponteiroId = `ponteiro${prefixoId === 'carro' ? '' : '-' + prefixoId}-velocidade`;
        const ponteiro = document.getElementById(ponteiroId);
        if (ponteiro) {
            const porcentagem = Math.min((this.velocidade / this.velocidadeMaxima) * 100, 100);
            ponteiro.style.width = `${porcentagem}%`;
        }
    }

    atualizarDetalhes() {
        const prefixoId = this.obterPrefixoIdHtml();
        // IDs dos spans de modelo e cor (ex: 'modelo', 'carroEsportivo-modelo')
        const modeloElemId = (prefixoId === 'carro') ? 'modelo' : `${prefixoId}-modelo`;
        const corElemId = (prefixoId === 'carro') ? 'cor' : `${prefixoId}-cor`;

        const modeloElem = document.getElementById(modeloElemId);
        const corElem = document.getElementById(corElemId);

        if (modeloElem) modeloElem.textContent = this.modelo;
        if (corElem) corElem.textContent = this.cor;
    }

    // atualizarInfoDisplay() é deixado vazio aqui, para ser sobrescrito se necessário.

    // --- Exibição de Informações ---

    /** Sobrescreve exibirInformacoes para adicionar Status e Velocidade */
    exibirInformacoes() {
        let baseInfo = super.exibirInformacoes(); // Pega Modelo, Cor, Combustível, Histórico
        return `${baseInfo}\nStatus: ${this.ligado ? 'Ligado' : 'Desligado'}\nVelocidade: ${this.velocidade.toFixed(0)} km/h`;
    }
}