// models/Manutencao.js
const mongoose = require('mongoose');

const manutencaoSchema = new mongoose.Schema({
    descricaoServico: {
        type: String,
        required: [true, 'A descrição do serviço é obrigatória.']
    },
    data: {
        type: Date,
        required: true,
        default: Date.now
    },
    custo: {
        type: Number,
        required: [true, 'O custo é obrigatório.'],
        min: [0, 'O custo não pode ser negativo.']
    },
    quilometragem: {
        type: Number,
        min: [0, 'A quilometragem não pode ser negativa.'],
        default: 0
    },
    veiculo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veiculo',
        required: true
    }
}, {
    timestamps: true
});

const Manutencao = mongoose.model('Manutencao', manutencaoSchema);

module.exports = Manutencao;