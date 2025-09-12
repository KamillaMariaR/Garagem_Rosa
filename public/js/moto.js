// js/moto.js

/**
 * Classe Moto, herda de Carro.
 * Depende: Carro (deve ser carregado antes)
 */
class Moto extends Carro {
    constructor(modelo, cor) {
        super(modelo, cor);
        this.velocidadeMaxima = 180; // Velocidade diferente
    }

    // --- Ações Sobrescritas (com pequenas variações) ---

    ligar() { // Pode ter log/som diferente
        if (this.ligado) return;
        if (this.combustivel > 0) {
            this.ligado = true;
            this.atualizarStatus();
            console.log("Moto ligada! Vrumm!");
            garagem.salvarGaragem();
        } else {
            alert("Sem combustível!");
        }
    }

    acelerar() { // Acelera mais rápido? Consome menos?
        const prefixoId = this.obterPrefixoIdHtml();
        if (!this.ligado) return alert("Ligue a moto!");
        if (this.combustivel <= 0) { this.desligar(); return alert("Sem combustível!"); }
        if (this.velocidade >= this.velocidadeMaxima) return;

        this.velocidade = Math.min(this.velocidade + 15, this.velocidadeMaxima); // Aumento maior
        this.combustivel = Math.max(this.combustivel - 4, 0); // Consumo menor?

        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        this.ativarAnimacao('aceleracao', prefixoId);
        console.log(`Acelerando Moto! V:${this.velocidade}, C:${this.combustivel.toFixed(0)}%`);
        garagem.salvarGaragem();

        if (this.combustivel <= 0) {
            console.log("Combustível acabou!");
            this.desligar();
        }
    }

    frear(interno = false) { // Freia mais rápido?
        const prefixoId = this.obterPrefixoIdHtml();
        const frearBtn = document.getElementById(`frear-${prefixoId}-btn`);
        if (this.velocidade === 0) { if (frearBtn) frearBtn.disabled = true; return; }

        this.velocidade = Math.max(this.velocidade - 15, 0); // Redução maior

        this.atualizarVelocidadeDisplay();
        this.atualizarPonteiroVelocidade();
        if (frearBtn) frearBtn.disabled = (this.velocidade === 0);

        if (!interno) {
            this.ativarAnimacao('freagem', prefixoId);
            console.log(`Freando Moto! V:${this.velocidade}`);
           garagem.salvarGaragem();
        }
         if (this.velocidade === 0 && !this.ligado) {
            this.atualizarStatus();
        }
    }

    // --- UI Sobrescrita ---

    atualizarStatus() {
        super.atualizarStatus(); // Chama Carro
        // Muda texto específico para "Ligada"/"Desligada"
        const prefixoId = this.obterPrefixoIdHtml();
        const statusElem = document.getElementById(`${prefixoId}-status`);
        if (statusElem) {
            statusElem.textContent = this.ligado ? 'Ligada' : 'Desligada';
        }
    }

    atualizarInfoDisplay() {
        // Moto não tem info extra por padrão
        const infoElem = document.getElementById('infoMoto');
        if (infoElem) infoElem.textContent = '';
    }

    // exibirInformacoes() usa a implementação herdada de Carro.
}