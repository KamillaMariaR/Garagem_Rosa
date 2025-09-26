// models/veiculo.js
const mongoose = require('mongoose');

const veiculoSchema = new mongoose.Schema({
    placa: {
        type: String,
        required: [true, 'A placa é obrigatória.'],
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Formato de placa inválido.']
    },
    marca: {
        type: String,
        required: [true, 'A marca é obrigatória.'],
        trim: true
    },
    modelo: {
        type: String,
        required: [true, 'O modelo é obrigatório.'],
        trim: true
    },
    ano: {
        type: Number,
        required: [true, 'O ano é obrigatório.'],
        min: [1900, 'O ano parece ser muito antigo.'],
        max: [new Date().getFullYear() + 1, 'O ano não pode ser no futuro.']
    },
    cor: {
        type: String,
        trim: true,
        default: 'Não informada'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Garante que a combinação de placa e dono seja única
veiculoSchema.index({ placa: 1, owner: 1 }, { unique: true });

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

module.exports = Veiculo;