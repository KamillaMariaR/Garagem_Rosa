// js/caminhao.js

/**
 * Classe Caminhao, herda de Carro.
 * Depende: Carro (deve ser carregado antes)
 */
class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga) {
        super(modelo, cor);
        // Garante que capacidade seja um número positivo, ou usa default
        this.capacidadeCarga = (!isNaN(capacidadeCarga) && capacidadeCarga > 0) ? capacidadeCarga : 1000;
        this.cargaAtual = 0; // kg
        this.velocidadeMaxima = 120; // Mais lento
    }

    // --- Ações Específicas ---

    carregar(peso) {
        const pesoNumerico = parseInt(peso, 10);
        if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
             alert("Peso inválido para carregar. Use um número positivo.");
             return false;
        }
        if (this.cargaAtual + pesoNumerico > this.capacidadeCarga) {
             alert(`Carga excede a capacidade (${this.capacidadeCarga}kg)! Carga atual: ${this.cargaAtual}kg.`);
             return false;
        }

        this.cargaAtual += pesoNumerico;
        this.atualizarInfoDisplay(); // Atualiza exibição da carga
        console.log(`Caminhão carregado com ${pesoNumerico}kg. Carga atual: ${this.cargaAtual}kg`);
        alert(`Carga atual: ${this.cargaAtual}kg`);
        garagem.salvarGaragem();
        return true;
    }

    descarregar(peso) {
        const pesoNumerico = parseInt(peso, 10);
        if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
             alert("Peso inválido para descarregar. Use um número positivo.");
             return false;
        }
        if (pesoNumerico > this.cargaAtual) {
             alert(`Não é possível descarregar ${pesoNumerico}kg. Carga atual: ${this.cargaAtual}kg.`);
             return false;
        }

        this.cargaAtual -= pesoNumerico;
        this.atualizarInfoDisplay(); // Atualiza exibição da carga
        console.log(`Caminhão descarregado em ${pesoNumerico}kg. Carga atual: ${this.cargaAtual}kg`);
        alert(`Carga atual: ${this.cargaAtual}kg`);
        garagem.salvarGaragem();
        return true;
    }

    // --- Ações Sobrescritas ---

    acelerar() { // Aceleração e consumo dependem da carga
        const prefixoId = this.obterPrefixoIdHtml();
        if (!this.ligado) return alert("Ligue o caminhão!");
        if (this.combustivel <= 0) { this.desligar(); return alert("Sem combustível!"); }
        if (this.velocidade >= this.velocidadeMaxima) return;

        // Fator de carga: 1 (vazio) a ~0.5 (cheio) - afeta aceleração
        const fatorCargaAcel = 1 - (this.cargaAtual / (this.capacidadeCarga * 2));
        // Aumento: Menor quando mais pesado (mínimo 2)
        const aumento = Math.max(2, 8 * fatorCargaAcel);
        // Consumo: Maior quando mais pesado
        const consumo = 8 + (this.cargaAtual / this.capacidadeCarga) * 5;

        this.velocidade = Math.min(this.velocidade + aumento, this.velocidadeMaxima);
        this.combustivel = Math.max(this.combustivel - consumo, 0);

        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        this.ativarAnimacao('aceleracao', prefixoId);
        console.log(`Acelerando Caminhão! V:${this.velocidade.toFixed(1)}, C:${this.combustivel.toFixed(1)}%, Carga:${this.cargaAtual}kg`);
        garagem.salvarGaragem();

        if (this.combustivel <= 0) {
            console.log("Combustível acabou!");
            this.desligar();
        }
    }

    frear(interno = false) { // Frenagem também depende da carga
        const prefixoId = this.obterPrefixoIdHtml();
        const frearBtn = document.getElementById(`frear-${prefixoId}-btn`);
        if (this.velocidade === 0) { if (frearBtn) frearBtn.disabled = true; return; }

        // Fator de carga: 1 (vazio) a 2 (cheio) - dificulta frear
        const fatorCargaFren = 1 + (this.cargaAtual / this.capacidadeCarga);
        // Redução: Menor quando mais pesado (mínimo 1)
        const reducao = Math.max(1, 10 / fatorCargaFren);

        this.velocidade = Math.max(this.velocidade - reducao, 0);

        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        if (frearBtn) frearBtn.disabled = (this.velocidade === 0);

        if (!interno) {
            this.ativarAnimacao('freagem', prefixoId);
            console.log(`Freando Caminhão! V:${this.velocidade.toFixed(1)}`);
           garagem.salvarGaragem();
        }
         if (this.velocidade === 0 && !this.ligado) {
            this.atualizarStatus();
        }
    }

    // --- UI Sobrescrita ---

    atualizarStatus() {
        super.atualizarStatus(); // Atualiza botões comuns
        const prefixoId = this.obterPrefixoIdHtml();
        const botoesContainer = document.getElementById(`botoes-${prefixoId}`);
        if (!botoesContainer) return;

        // Habilita/Desabilita botão de descarregar
        const descarregarBtn = botoesContainer.querySelector('button[onclick*="descarregar"]');
        if (descarregarBtn) descarregarBtn.disabled = (this.cargaAtual === 0);

        // Mantém botão carregar sempre habilitado (poderia desabilitar se cheio)
        const carregarBtn = botoesContainer.querySelector('button[onclick*="carregar"]');
        if (carregarBtn) carregarBtn.disabled = false;
    }

    // atualizarDetalhes() não precisa mais mostrar carga aqui, vai para infoDisplay

    atualizarInfoDisplay() {
        const infoElem = document.getElementById('infoCaminhao');
        if (infoElem) {
            infoElem.textContent = `Carga: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg`;
        }
    }

    exibirInformacoes() {
        let baseInfo = super.exibirInformacoes(); // Pega infos do Carro
        return `${baseInfo}\nCarga: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg`;
    }
}