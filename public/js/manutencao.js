// js/manutencao.js

/**
 * Representa um registro de manutenção (passado ou agendado) para um veículo.
 */
class Manutencao {
    /**
     * Cria uma instância de Manutencao.
     * @param {string} data - Data da manutenção (formato "YYYY-MM-DD").
     * @param {string} tipo - Tipo de serviço.
     * @param {number | string | null} custo - Custo (null/NaN/negativo se agendada, número >= 0 se concluída).
     * @param {string} [descricao=''] - Descrição opcional.
     * @param {string | null} [hora=null] - Hora da manutenção (formato "HH:MM").
     * @param {string} [status='concluida'] - Status ('concluida' ou 'agendada').
     */
    constructor(data, tipo, custo, descricao = '', hora = null, status = 'concluida') {
        this.data = data || '';
        this.tipo = tipo ? tipo.trim() : '';
        const custoNum = parseFloat(custo);
        this.custo = (status === 'agendada' || custo === null || isNaN(custoNum) || custoNum < 0) ? null : custoNum;
        this.descricao = descricao ? descricao.trim() : '';
        this.hora = (hora && /^\d{2}:\d{2}$/.test(hora)) ? hora : null; // Armazena null se inválida
        this.status = (status === 'agendada') ? 'agendada' : 'concluida';
    }

    /**
     * Retorna um objeto Date representando a data/hora da manutenção.
     * Retorna null se a data ou hora forem inválidas ou inconsistentes.
     * @returns {Date | null}
     */
    getDateTime() {
        if (!this.data || !/^\d{4}-\d{2}-\d{2}$/.test(this.data)) return null;

        let dateString = this.data + "T" + (this.hora || "00:00") + ":00"; // Usa hora ou meia-noite

        try {
            const dt = new Date(dateString);

            // Checagem primária de validade do objeto Date
            if (isNaN(dt.getTime())) {
                // console.warn(`Data/hora resultou em Date inválido: ${dateString}`);
                return null;
            }

            // Validação extra de consistência (evita 31/02 virar 03/03, etc.)
            const [year, month, day] = this.data.split('-').map(Number);
            if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) {
                // console.warn(`Inconsistência lógica na data: ${this.data}`);
                return null;
            }

            // Valida hora se foi fornecida e era sintaticamente válida
            if (this.hora) {
                const [hour, minute] = this.hora.split(':').map(Number);
                if (dt.getHours() !== hour || dt.getMinutes() !== minute) {
                   // console.warn(`Inconsistência lógica na hora: ${this.hora}`);
                   return null;
                }
            }
            return dt; // Data/hora válida e consistente
        } catch (e) {
            console.error("Erro crítico ao parsear data/hora:", dateString, e);
            return null;
        }
    }

    /**
     * Retorna uma string formatada do registro de manutenção para exibição.
     * @returns {string} Informação formatada.
     */
    formatar() {
        if (!this.tipo) return "(Tipo não informado)";

        let dataFormatada = this.data || "Data inválida"; // Fallback para data original
        const dateObj = this.getDateTime();
        if (dateObj) {
            dataFormatada = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        let info = '';
        if (this.status === 'agendada') {
            info = `Agendado: ${this.tipo} em ${dataFormatada}`;
            if (this.hora) info += ` às ${this.hora}`;
            if (this.descricao) info += ` (Obs: ${this.descricao})`;
        } else { // concluida
            const custoFormatado = (this.custo !== null)
                ? this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : 'Custo N/A'; // Custo Não Aplicável ou Não Informado
            info = `- ${this.tipo} em ${dataFormatada} - ${custoFormatado}`;
            if (this.descricao) info += ` (${this.descricao})`;
        }
        return info;
    }

    /**
     * Valida os dados da manutenção.
     * Verifica formato, obrigatoriedade e regras de negócio (data futura, custo >= 0).
     * @returns {string[]} Array de mensagens de erro. Vazio se válido.
     */
    validar() {
        const erros = [];
        const dataValida = this.getDateTime(); // Valida data e hora juntas

        if (!dataValida) {
            // Tenta dar um erro mais específico baseado no que falhou
            if (!this.data || !/^\d{4}-\d{2}-\d{2}$/.test(this.data)) {
                erros.push('Formato da data inválido (AAAA-MM-DD).');
            } else if (this.hora !== null && !/^\d{2}:\d{2}$/.test(this.hora)) {
                 // Só valida formato da hora se ela existir (não for null)
                erros.push('Formato da hora inválido (HH:MM).');
            } else {
                 // Se formatos estão ok, mas getDateTime falhou, é data/hora logicamente inválida
                erros.push('Data ou hora inválida (ex: 31/02, 25:00).');
            }
        }

        if (!this.tipo) {
            erros.push('O tipo de serviço é obrigatório.');
        }

        if (this.status === 'concluida') {
            if (this.custo === null) { // Custo 0 é válido
                erros.push('Para manutenção concluída, o custo é obrigatório (pode ser 0).');
            } else if (typeof this.custo !== 'number' || this.custo < 0) {
                erros.push('Custo deve ser um número maior ou igual a zero.');
            }
        }

        // Validação de data futura apenas para agendamentos e se a data for válida
        if (this.status === 'agendada' && dataValida) {
            const agora = new Date();
            agora.setSeconds(0, 0); // Compara sem segundos/ms
            if (dataValida < agora) {
                erros.push('A data/hora do agendamento deve ser no futuro.');
            }
        }
        return erros;
    }
}