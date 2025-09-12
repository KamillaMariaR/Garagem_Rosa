// js/carroEsportivo.js

/**
 * Classe CarroEsportivo, herda de Carro.
 * Depende: Carro (deve ser carregado antes)
 */
class CarroEsportivo extends Carro {
    constructor(modelo, cor) {
        super(modelo, cor);
        this.turboAtivado = false;
        this.velocidadeMaxima = 300; // Velocidade maior
    }

    // --- Ações Específicas ---

    ativarTurbo() {
        if (!this.ligado) return alert("Ligue o carro esportivo primeiro!");
        if (this.turboAtivado) return; // Já está ativado
        if (this.combustivel < 20) return alert("Combustível baixo demais para ativar o turbo!");

        this.turboAtivado = true;
        console.log('Turbo Ativado!');
        alert('Turbo Ativado!');
        this.atualizarInfoDisplay(); // Mostra na UI
        this.atualizarStatus(); // Habilita/Desabilita botões
        garagem.salvarGaragem();
    }

    desativarTurbo() {
        if (!this.turboAtivado) return; // Já está desativado

        this.turboAtivado = false;
        console.log('Turbo Desativado!');
        alert('Turbo Desativado!');
        this.atualizarInfoDisplay(); // Mostra na UI
        this.atualizarStatus(); // Habilita/Desabilita botões
        garagem.salvarGaragem();
    }

    // --- Ações Sobrescritas ---

    acelerar() { // Acelera mais, consome mais (especialmente com turbo)
        const prefixoId = this.obterPrefixoIdHtml();
        if (!this.ligado) return alert("Ligue o carro esportivo!");
        if (this.combustivel <= 0) { this.desligar(); return alert("Sem combustível!"); }
        if (this.velocidade >= this.velocidadeMaxima) return;

        const aumento = this.turboAtivado ? 50 : 20;
        const consumo = this.turboAtivado ? 15 : 10;

        this.velocidade = Math.min(this.velocidade + aumento, this.velocidadeMaxima);
        this.combustivel = Math.max(this.combustivel - consumo, 0);

        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        this.ativarAnimacao('aceleracao', prefixoId);
        console.log(`Acelerando Esportivo (Turbo: ${this.turboAtivado})! V:${this.velocidade}, C:${this.combustivel.toFixed(0)}%`);
        garagem.salvarGaragem();

        if (this.combustivel <= 0) {
            console.log("Combustível acabou!");
            if (this.turboAtivado) this.desativarTurbo(); // Desativa turbo antes de desligar
            this.desligar();
        }
        // Atualiza status dos botões turbo (pode ter ficado sem comb pro turbo)
        this.atualizarStatus();
    }

    frear(interno = false) { // Freia mais forte
        const prefixoId = this.obterPrefixoIdHtml();
        const frearBtn = document.getElementById(`frear-${prefixoId}-btn`);
        if (this.velocidade === 0) { if (frearBtn) frearBtn.disabled = true; return; }

        this.velocidade = Math.max(this.velocidade - 20, 0); // Redução maior

        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        if (frearBtn) frearBtn.disabled = (this.velocidade === 0);

        if (!interno) {
            this.ativarAnimacao('freagem', prefixoId);
            console.log(`Freando Esportivo! V:${this.velocidade}`);
            garagem.salvarGaragem();
        }
        if (this.velocidade === 0 && !this.ligado) {
            this.atualizarStatus();
        }
    }

    // --- UI Sobrescrita ---

    atualizarStatus() {
        super.atualizarStatus(); // Chama o atualizarStatus do Carro (botões comuns)
        const prefixoId = this.obterPrefixoIdHtml();

        // Encontra botões de turbo (assumindo que estão dentro do container de botões)
        const botoesContainer = document.getElementById(`botoes-${prefixoId}`);
        if (!botoesContainer) return;

        const turboOnBtn = botoesContainer.querySelector('button[onclick*="ativarTurbo"]');
        const turboOffBtn = botoesContainer.querySelector('button[onclick*="desativarTurbo"]');

        // Desabilita Ativar Turbo se: desligado, já ativo, ou combustível < 20
        if (turboOnBtn) turboOnBtn.disabled = !this.ligado || this.turboAtivado || this.combustivel < 20;
        // Desabilita Desativar Turbo se: desligado ou não ativo
        if (turboOffBtn) turboOffBtn.disabled = !this.ligado || !this.turboAtivado;
    }

    atualizarInfoDisplay() {
        const infoElem = document.getElementById('infoEsportivo');
        if (infoElem) {
            infoElem.textContent = `Turbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`;
        }
    }

    exibirInformacoes() {
        let baseInfo = super.exibirInformacoes(); // Pega infos do Carro (modelo, cor, comb, hist, status, vel)
        return `${baseInfo}\nTurbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`;
    }
}